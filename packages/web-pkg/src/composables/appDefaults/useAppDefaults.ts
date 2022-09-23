import { computed, unref, Ref } from '@vue/composition-api'
import { useRouter, useRoute, useRouteParam } from '../router'
import { useStore } from '../store'
import { ClientService } from '../../services'
import { basename } from 'path'

import { FileContext } from './types'
import {
  useAppNavigation,
  AppNavigationResult,
  contextQueryToFileContextProps,
  contextRouteNameKey,
  queryItemAsString
} from './useAppNavigation'
import { useAppConfig, AppConfigResult } from './useAppConfig'
import { useAppFileHandling, AppFileHandlingResult } from './useAppFileHandling'
import { useAppFolderHandling, AppFolderHandlingResult } from './useAppFolderHandling'
import { useAppDocumentTitle } from './useAppDocumentTitle'
import { usePublicLinkPassword, usePublicLinkContext, useRequest } from '../authContext'
import { useClientService } from '../clientService'
import { MaybeRef } from '../../utils'
import { useDriveResolver } from '../driveResolver'
import { useCapabilityShareJailEnabled } from '../capability'
import { buildWebDavSpacesPath } from 'web-client/src/helpers'
import { buildWebDavFilesPath, buildWebDavPublicPath } from 'files/src/helpers/resources'

// TODO: this file/folder contains file/folder loading logic extracted from preview and drawio extensions
// Discussion how to progress from here can be found in this issue:
// https://github.com/owncloud/web/issues/3301

interface AppDefaultsOptions {
  applicationId: string
  applicationName?: MaybeRef<string>
  clientService?: ClientService
}

type AppDefaultsResult = AppConfigResult &
  AppNavigationResult &
  AppFileHandlingResult &
  AppFolderHandlingResult & {
    isPublicLinkContext: Ref<boolean>
    currentFileContext: Ref<FileContext>
  }

export function useAppDefaults(options: AppDefaultsOptions): AppDefaultsResult {
  const router = useRouter()
  const store = useStore()
  const currentRoute = useRoute()
  const clientService = options.clientService ?? useClientService()
  const applicationId = options.applicationId

  const isPublicLinkContext = usePublicLinkContext({ store })
  const publicLinkPassword = usePublicLinkPassword({ store })

  const driveAliasAndItem = useRouteParam('driveAliasAndItem')
  const { space, item } = useDriveResolver({
    store,
    driveAliasAndItem
  })
  const hasShareJail = useCapabilityShareJailEnabled(store)
  const currentFileContext = computed((): FileContext => {
    let path
    if (unref(space)) {
      if (unref(space).driveType === 'public') {
        path = buildWebDavPublicPath(unref(space).id, unref(item))
      } else if (unref(hasShareJail)) {
        path = buildWebDavSpacesPath(unref(space).id, unref(item))
      } else {
        path = buildWebDavFilesPath(unref(space).id, unref(item))
      }
    } else {
      // deprecated.
      path = `/${unref(currentRoute).params.filePath?.split('/').filter(Boolean).join('/')}`
    }

    return {
      path,
      driveAliasAndItem: unref(driveAliasAndItem),
      space: unref(space),
      item: unref(item),
      fileName: basename(path),
      routeName: queryItemAsString(unref(currentRoute).query[contextRouteNameKey]),
      ...contextQueryToFileContextProps(unref(currentRoute).query)
    }
  })

  useAppDocumentTitle({
    store,
    document,
    applicationId,
    applicationName: options.applicationName,
    currentFileContext
  })

  return {
    isPublicLinkContext,
    currentFileContext,
    ...useAppConfig({ store, ...options }),
    ...useAppNavigation({ router, currentFileContext }),
    ...useAppFileHandling({
      clientService
    }),
    ...useAppFolderHandling({
      clientService,
      store,
      currentRoute
    }),
    ...useRequest({ clientService, store, currentRoute: unref(currentRoute) })
  }
}
