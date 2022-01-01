import { RouteComponents } from './router'
import { Location, RouteConfig } from 'vue-router'
import { createLocation, $gettext, isLocationActiveDirector } from './utils'

type commonTypes = 'files-common-favorites' | 'files-common-trash'

export const createLocationCommon = (name: commonTypes, location = {}): Location =>
  createLocation(name, location)

const locationFavorites = createLocationCommon('files-common-favorites')
const locationTrash = createLocationCommon('files-common-trash')

export const isLocationCommonActive = isLocationActiveDirector<commonTypes>(
  locationFavorites,
  locationTrash
)

export const buildRoutes = (components: RouteComponents): RouteConfig[] => [
  {
    path: `/trash`,
    components: {
      app: components.App
    },
    children: [
      {
        name: locationTrash.name,
        path: '',
        component: components.Trashbin,
        meta: {
          hideFilelistActions: true,
          hasBulkActions: true,
          title: $gettext('Deleted files')
        }
      }
    ]
  },
  {
    path: `/favorites`,
    components: {
      app: components.App
    },
    children: [
      {
        name: locationFavorites.name,
        path: '',
        component: components.Favorites,
        meta: {
          hideFilelistActions: true,
          hasBulkActions: false,
          title: $gettext('Favorite files')
        }
      }
    ]
  }
]
