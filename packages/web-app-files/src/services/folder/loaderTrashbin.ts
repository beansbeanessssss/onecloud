import { FolderLoader, FolderLoaderTask, TaskContext } from '../folder'
import { Router } from 'vue-router'
import { useTask } from 'vue-concurrency'
import { DavProperties } from '@ownclouders/web-client/webdav'
import { isLocationTrashActive } from '@ownclouders/web-pkg'
import { SpaceResource } from '@ownclouders/web-client'

export class FolderLoaderTrashbin implements FolderLoader {
  public isEnabled(): boolean {
    return true
  }

  public isActive(router: Router): boolean {
    return isLocationTrashActive(router, 'files-trash-generic')
  }

  public getTask(context: TaskContext): FolderLoaderTask {
    const {
      resourcesStore,
      clientService: { webdav }
    } = context
    return useTask(function* (signal1, signal2, space: SpaceResource) {
      resourcesStore.clearResourceList()
      resourcesStore.setAncestorMetaData({})

      const { resource, children } = yield webdav.listFiles(
        space,
        {},
        { depth: 1, davProperties: DavProperties.Trashbin, isTrash: true }
      )

      resourcesStore.initResourceList({ currentFolder: resource, resources: children })
    })
  }
}
