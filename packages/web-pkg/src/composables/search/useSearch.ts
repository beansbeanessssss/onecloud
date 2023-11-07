import { computed, unref } from 'vue'
import { SearchResult } from '../../components'
import { DavProperties } from '@ownclouders/web-client/src/webdav'
import { urlJoin } from '@ownclouders/web-client/src/utils'
import { useConfigurationManager } from '../configuration'
import { useStore } from '../store'
import { useClientService } from '../clientService'
import { isProjectSpaceResource } from '@ownclouders/web-client/src/helpers'

export const useSearch = () => {
  const store = useStore()
  const configurationManager = useConfigurationManager()
  const clientService = useClientService()

  const areHiddenFilesShown = computed(() => store.state.Files?.areHiddenFilesShown)
  const projectSpaces = computed(() =>
    store.getters['runtime/spaces/spaces'].filter((s) => isProjectSpaceResource(s))
  )
  const getProjectSpace = (id) => {
    return unref(projectSpaces).find((s) => s.id === id)
  }
  const search = async (term: string, searchLimit = null): Promise<SearchResult> => {
    if (configurationManager.options.routing.fullShareOwnerPaths) {
      await store.dispatch('runtime/spaces/loadMountPoints', {
        graphClient: clientService.graphAuthenticated
      })
    }

    if (!term) {
      return {
        totalResults: null,
        values: []
      }
    }

    const { resources, totalResults } = await clientService.webdav.search(term, {
      searchLimit,
      davProperties: DavProperties.Default
    })

    return {
      totalResults,
      values: resources
        .map((resource) => {
          const matchingSpace = getProjectSpace(resource.parentFolderId)
          const data = matchingSpace ? matchingSpace : resource

          if (configurationManager.options.routing.fullShareOwnerPaths && data.shareRoot) {
            data.path = urlJoin(data.shareRoot, data.path)
          }

          return { id: data.id, data }
        })
        .filter(({ data }) => {
          // filter results if hidden files shouldn't be shown due to settings
          return !data.name.startsWith('.') || unref(areHiddenFilesShown)
        })
    }
  }

  return {
    search
  }
}

export type SearchFunction = ReturnType<typeof useSearch>['search']
