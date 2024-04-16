import { FolderLoader, FolderLoaderTask, TaskContext } from '../folder'
import { Router } from 'vue-router'
import { useTask } from 'vue-concurrency'
import { buildIncomingShareResource } from '@ownclouders/web-client'
import { isLocationSharesActive } from '@ownclouders/web-pkg'

export class FolderLoaderSharedWithMe implements FolderLoader {
  public isEnabled(): boolean {
    return true
  }

  public isActive(router: Router): boolean {
    return isLocationSharesActive(router, 'files-shares-with-me')
  }

  public getTask(context: TaskContext): FolderLoaderTask {
    const { spacesStore, clientService, configStore, resourcesStore, sharesStore } = context

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return useTask(function* (signal1, signal2) {
      resourcesStore.clearResourceList()
      resourcesStore.setAncestorMetaData({})

      if (configStore.options.routing.fullShareOwnerPaths) {
        yield spacesStore.loadMountPoints({ graphClient: clientService.graphAuthenticated })
      }

      const {
        data: { value }
      } = yield clientService.graphAuthenticated.drives.listSharedWithMe()

      const resources = value.map((driveItem) =>
        buildIncomingShareResource({ driveItem, graphRoles: sharesStore.graphRoles })
      )

      resourcesStore.initResourceList({ currentFolder: null, resources })
    })
  }
}
