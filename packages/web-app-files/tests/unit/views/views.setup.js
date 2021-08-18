import { createLocalVue } from '@vue/test-utils'
import Vuex from 'vuex'
import OwnCloud from 'owncloud-sdk'
import { createStore } from 'vuex-extensions'
import DesignSystem from 'owncloud-design-system'
import GetTextPlugin from 'vue-gettext'
import VueCompositionAPI from '@vue/composition-api'

export const createFile = ({ id, status = 1, type = 'folder' }) => ({
  id: `file-id-${id}`,
  type,
  status,
  name: `file-name-${id}`,
  path: `/file-path/${id}`,
  extension: '',
  share: {
    id: `file-share-id-${id}`
  },
  indicators: []
})

export const localVue = createLocalVue()
localVue.prototype.$client = new OwnCloud()
localVue.prototype.$client.init({ baseUrl: 'http://none.de' })
localVue.use(Vuex)
localVue.use(DesignSystem)
localVue.use(VueCompositionAPI)

/*
 * TODO: options on GetTextPlugin do not have any effect because of
 * packages/web-app-files/src/gettext.js which overwrites every setting.
 */
localVue.use(GetTextPlugin, {
  translations: 'does-not-matter.json',
  silent: true
})

export const getStore = function ({
  highlightedFile = null,
  disablePreviews = true,
  currentPage = null,
  activeFiles = [],
  pages = null,
  sidebarClosed = false,
  currentFolder = null,
  inProgress = [null],
  selectedFiles = [],
  totalFilesCount = null,
  totalFilesSize = null,
  loginBackgroundImg = '',
  loginLogo = '',
  davProperties = [],
  publicLinkPassword = null,
  slogan = null,
  generalThemeName = '',
  isOcis = true,
  selectedResourcesForMove = null,
  locationPickerTargetFolder = null
} = {}) {
  return createStore(Vuex.Store, {
    state: {
      app: { quickActions: {} }
    },
    getters: {
      configuration: () => ({
        theme: {
          loginPage: {
            backgroundImg: loginBackgroundImg
          },
          logo: {
            login: loginLogo
          },
          general: {
            name: generalThemeName,
            slogan: slogan
          }
        },
        options: {
          disablePreviews: disablePreviews
        }
      }),
      getToken: () => '',
      isOcis: () => isOcis,
      homeFolder: () => '/'
    },
    actions: {
      showMessage: jest.fn()
    },
    modules: {
      Files: {
        state: {
          resource: null,
          currentFolder: currentFolder,
          currentPage: currentPage,
          filesPageLimit: 100,
          selectedResourcesForMove: selectedResourcesForMove,
          locationPickerTargetFolder: locationPickerTargetFolder
        },
        getters: {
          totalFilesCount: () => totalFilesCount,
          totalFilesSize: () => totalFilesSize,
          selectedFiles: () => selectedFiles,
          activeFiles: () => activeFiles,
          inProgress: () => inProgress,
          highlightedFile: () => highlightedFile,
          currentFolder: () => currentFolder,
          pages: () => pages,
          davProperties: () => davProperties,
          publicLinkPassword: () => publicLinkPassword
        },
        mutations: {
          UPDATE_RESOURCE: (state, resource) => {
            state.resource = resource
          },
          UPDATE_CURRENT_PAGE: jest.fn(),
          SET_FILES_PAGE_LIMIT: jest.fn(),
          CLEAR_FILES_SEARCHED: jest.fn(),
          SELECT_RESOURCES: jest.fn(),
          CLEAR_CURRENT_FILES_LIST: jest.fn()
        },
        actions: {
          loadFiles: jest.fn(),
          loadIndicators: jest.fn()
        },
        namespaced: true,
        modules: {
          sidebar: {
            state: {
              closed: sidebarClosed
            },
            namespaced: true
          },
          pagination: {
            state: {
              currentPage,
              itemsPerPage: 100
            },
            getters: {
              pages: () => pages
            },
            mutations: {
              SET_ITEMS_PER_PAGE: () => {},
              UPDATE_CURRENT_PAGE: () => {}
            },
            namespaced: true
          }
        }
      }
    }
  })
}
