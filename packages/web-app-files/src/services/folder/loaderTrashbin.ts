import { FolderLoader, FolderLoaderTask, TaskContext } from '../folder'
import { Router } from 'vue-router'
import { useTask } from 'vue-concurrency'
import { DavProperties } from '@ownclouders/web-client/src/webdav/constants'
import { isLocationTrashActive } from '@ownclouders/web-pkg'
import { SpaceResource } from '@ownclouders/web-client/src/helpers'
import { Store } from 'vuex'

export class FolderLoaderTrashbin implements FolderLoader {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public isEnabled(store: Store<any>): boolean {
    return true
  }

  public isActive(router: Router): boolean {
    return isLocationTrashActive(router, 'files-trash-generic')
  }

  public getTask(context: TaskContext): FolderLoaderTask {
    const {
      store,
      clientService: { webdav }
    } = context
    return useTask(function* (signal1, signal2, space: SpaceResource) {
      store.commit('Files/CLEAR_CURRENT_FILES_LIST')
      store.commit('runtime/ancestorMetaData/SET_ANCESTOR_META_DATA', {})

      const { resource, children } = yield webdav.listFiles(
        space,
        {},
        { depth: 1, davProperties: DavProperties.Trashbin, isTrash: true }
      )

      store.commit('Files/LOAD_FILES', {
        currentFolder: resource,
        files: children
      })
    })
  }
}
