import {
  Resource,
  SpaceResource,
  extractNameWithoutExtension
} from '@ownclouders/web-client/src/helpers'
import { Store } from 'vuex'
import { computed, Ref, unref } from 'vue'
import { useClientService } from '../../clientService'
import { useRequest } from '../../authContext'
import { useRouter } from '../../router'
import { useStore } from '../../store'
import { FileAction, FileActionOptions } from '../types'
import { useGettext } from 'vue3-gettext'
import { resolveFileNameDuplicate } from '../../../helpers/resource'
import { join } from 'path'
import { WebDAV } from '@ownclouders/web-client/src/webdav'
import { isLocationSpacesActive } from '../../../router'
import { getIndicators } from '../../../helpers'
import { EDITOR_MODE_CREATE, useFileActions } from './useFileActions'
import { urlJoin } from '@ownclouders/web-client/src/utils'
import { configurationManager } from '../../../configuration'
import { stringify } from 'qs'
import { AncestorMetaData } from '../../../types'
import { useMessages, useModals, useUserStore } from '../../piniaStores'

export const useFileActionsCreateNewFile = ({
  store,
  space,
  newFileHandlers,
  mimetypesAllowedForCreation
}: {
  store?: Store<any>
  space?: SpaceResource
  newFileHandlers?: Ref<any> // FIXME: type?
  mimetypesAllowedForCreation?: Ref<any> // FIXME: type?
} = {}) => {
  store = store || useStore()
  const { showMessage, showErrorMessage } = useMessages()
  const userStore = useUserStore()
  const router = useRouter()
  const { $gettext } = useGettext()
  const { makeRequest } = useRequest()
  const { dispatchModal } = useModals()

  const { openEditor, triggerDefaultAction } = useFileActions()
  const clientService = useClientService()
  const currentFolder = computed((): Resource => store.getters['Files/currentFolder'])
  const files = computed((): Array<Resource> => store.getters['Files/files'])
  const ancestorMetaData = computed<AncestorMetaData>(
    () => store.getters['runtime/ancestorMetaData/ancestorMetaData']
  )
  const areFileExtensionsShown = computed((): boolean => store.state.Files.areFileExtensionsShown)

  const capabilities = computed(() => store.getters['capabilities'])

  const getNameErrorMsg = (fileName: string) => {
    if (fileName === '') {
      return $gettext('File name cannot be empty')
    }

    if (/[/]/.test(fileName)) {
      return $gettext('File name cannot contain "/"')
    }

    if (fileName === '.') {
      return $gettext('File name cannot be equal to "."')
    }

    if (fileName === '..') {
      return $gettext('File name cannot be equal to ".."')
    }

    if (/\s+$/.test(fileName)) {
      return $gettext('File name cannot end with whitespace')
    }

    const exists = unref(files).find((file) => file.name === fileName)

    if (exists) {
      return $gettext('%{name} already exists', { name: fileName }, true)
    }

    return null
  }

  const addAppProviderFileFunc = async (fileName: string) => {
    // FIXME: this belongs in web-app-external, but the app provider handles file creation differently than other editor extensions. Needs more refactoring.
    if (fileName === '') {
      return
    }
    try {
      const baseUrl = urlJoin(
        configurationManager.serverUrl,
        unref(capabilities).files.app_providers[0].new_url
      )
      const query = stringify({
        parent_container_id: unref(currentFolder).fileId,
        filename: fileName
      })
      const url = `${baseUrl}?${query}`
      const response = await makeRequest('POST', url)
      if (response.status !== 200) {
        throw new Error(`An error has occurred: ${response.status}`)
      }
      const path = join(unref(currentFolder).path, fileName) || ''
      const resource = await (clientService.webdav as WebDAV).getFileInfo(space, {
        path
      })
      if (unref(loadIndicatorsForNewFile)) {
        resource.indicators = getIndicators({ resource, ancestorMetaData: unref(ancestorMetaData) })
      }
      triggerDefaultAction({ space: space, resources: [resource] })
      store.commit('Files/UPSERT_RESOURCE', resource)
      showMessage({ title: $gettext('"%{fileName}" was created successfully', { fileName }) })
    } catch (error) {
      console.error(error)
      showErrorMessage({
        title: $gettext('Failed to create file'),
        errors: [error]
      })
    }
  }

  const loadIndicatorsForNewFile = computed(() => {
    return isLocationSpacesActive(router, 'files-spaces-generic') && space.driveType !== 'share'
  })

  const addNewFile = async (fileName, openAction) => {
    if (fileName === '') {
      return
    }

    try {
      const path = join(unref(currentFolder).path, fileName)
      const resource = await (clientService.webdav as WebDAV).putFileContents(space, {
        path
      })

      if (loadIndicatorsForNewFile.value) {
        resource.indicators = getIndicators({ resource, ancestorMetaData: unref(ancestorMetaData) })
      }

      store.commit('Files/UPSERT_RESOURCE', resource)

      if (openAction) {
        openEditor(
          openAction,
          space.getDriveAliasAndItem(resource),
          resource.webDavPath,
          resource.fileId,
          EDITOR_MODE_CREATE,
          space.shareId
        )

        return
      }

      showMessage({ title: $gettext('"%{fileName}" was created successfully', { fileName }) })
    } catch (error) {
      console.error(error)
      showErrorMessage({
        title: $gettext('Failed to create file'),
        errors: [error]
      })
    }
  }

  const handler = (
    fileActionOptions: FileActionOptions,
    extension: string,
    openAction: any // FIXME: type?
  ) => {
    let defaultName = $gettext('New file') + `.${extension}`

    if (unref(files).some((f) => f.name === defaultName)) {
      defaultName = resolveFileNameDuplicate(defaultName, extension, unref(files))
    }

    if (!areFileExtensionsShown.value) {
      defaultName = extractNameWithoutExtension({ name: defaultName, extension } as any)
    }

    const inputSelectionRange = !areFileExtensionsShown.value
      ? null
      : ([0, defaultName.length - (extension.length + 1)] as [number, number])

    dispatchModal({
      title: $gettext('Create a new file'),
      confirmText: $gettext('Create'),
      hasInput: true,
      inputValue: defaultName,
      inputLabel: $gettext('File name'),
      inputSelectionRange,
      onConfirm: (fileName: string) => {
        if (!areFileExtensionsShown.value) {
          fileName = `${fileName}.${extension}`
        }

        if (!openAction) {
          return addAppProviderFileFunc(fileName)
        }

        return addNewFile(fileName, openAction)
      },
      onInput: (name, setError) =>
        setError(getNameErrorMsg(areFileExtensionsShown.value ? name : `${name}.${extension}`))
    })
  }

  const actions = computed((): FileAction[] => {
    const actions = []
    for (const newFileHandler of unref(newFileHandlers) || []) {
      const openAction = newFileHandler.action
      actions.push({
        name: 'create-new-file',
        icon: 'add',
        handler: (args) => handler(args, newFileHandler.ext, openAction),
        label: () => newFileHandler.menuTitle($gettext),
        isEnabled: () => {
          return unref(currentFolder)?.canUpload({ user: userStore.user })
        },
        componentType: 'button',
        class: 'oc-files-actions-create-new-file',
        ext: newFileHandler.ext
      })
    }
    for (const mimeType of unref(mimetypesAllowedForCreation) || []) {
      const openAction = false
      actions.push({
        name: 'create-new-file',
        icon: 'add',
        handler: (args) => handler(args, mimeType.ext, openAction),
        label: () => mimeType.name,
        isEnabled: () => {
          return unref(currentFolder)?.canUpload({ user: userStore.user })
        },
        componentType: 'button',
        class: 'oc-files-actions-create-new-file',
        ext: mimeType.ext
      })
    }

    return actions
  })

  return {
    actions,
    getNameErrorMsg,
    addNewFile
  }
}
