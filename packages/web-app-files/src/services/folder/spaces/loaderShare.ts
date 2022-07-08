import { FolderLoader, FolderLoaderTask, TaskContext } from '../../folder'
import Router from 'vue-router'
import { useTask } from 'vue-concurrency'
import { isLocationSpacesActive } from '../../../router'
import { buildResource, buildWebDavSpacesPath } from '../../../helpers/resources'
import { Store } from 'vuex'
import get from 'lodash-es/get'
import {
  useCapabilityFilesSharingResharing,
  useCapabilityShareJailEnabled
} from 'web-pkg/src/composables'
import { DavProperties } from 'web-pkg/src/constants'
import { getIndicators } from '../../../helpers/statusIndicators'

export const SHARE_JAIL_ID = 'a0ca6a90-a365-4782-871e-d44447bbc668'

export class FolderLoaderSpacesShare implements FolderLoader {
  public isEnabled(store: Store<any>): boolean {
    return get(store, 'getters.capabilities.spaces.share_jail', false)
  }

  public isActive(router: Router): boolean {
    return isLocationSpacesActive(router, 'files-spaces-share')
  }

  public getTask(context: TaskContext): FolderLoaderTask {
    const { store, router, clientService } = context

    return useTask(function* (signal1, signal2, ref, shareId, path = null) {
      store.commit('Files/CLEAR_CURRENT_FILES_LIST')

      const webDavResponse = yield clientService.owncloudSdk.files.list(
        buildWebDavSpacesPath(
          [SHARE_JAIL_ID, shareId].join('!'),
          path || router.currentRoute.params.item || ''
        ),
        1,
        DavProperties.Default
      )

      const resources = webDavResponse.map(buildResource)
      const currentFolder = resources.shift()
      const hasResharing = useCapabilityFilesSharingResharing(store)
      const hasShareJail = useCapabilityShareJailEnabled(store)

      if (hasResharing.value) {
        yield store.dispatch('Files/loadSharesTree', {
          client: clientService.owncloudSdk,
          path: currentFolder.path
        })

        for (const file of resources) {
          file.indicators = getIndicators(file, store.state.Files.sharesTree, hasShareJail.value)
        }
      }

      store.commit('Files/LOAD_FILES', {
        currentFolder,
        files: resources
      })
    })
  }
}
