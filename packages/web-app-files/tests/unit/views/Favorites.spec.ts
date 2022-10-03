import { mount } from '@vue/test-utils'
import { createFile } from './views.setup'
import Favorites from '../../../src/views/Favorites.vue'

import { defaultStoreMockOptions } from '../../../../../tests/unit/mocks/store/defaultStoreMockOptions'
import { defaultComponentMocks } from '../../../../../tests/unit/mocks/defaultComponentMocks'
import { createStore } from 'vuex-extensions'
import { defaultLocalVue } from '../../../../../tests/unit/localVue/defaultLocalVue'
import Vuex from 'vuex'

const stubs = {
  'app-bar': true,
  'router-link': true,
  translate: true,
  'oc-pagination': true,
  'resource-table': true,
  'oc-spinner': true,
  'context-actions': true,
  'side-bar': true
}

const selectors = {
  noContentMessage: '#files-favorites-empty',
  favoritesTable: '#files-favorites-table'
}

const spinnerStub = 'oc-spinner-stub'
const resourceTableStub = 'resource-table-stub'
const paginationStub = 'oc-pagination-stub'
const listInfoStub = 'list-info-stub'

const defaultActiveFiles = [createFile({ id: '1233' }), createFile({ id: '1234' })]

window.ResizeObserver =
  window.ResizeObserver ||
  jest.fn().mockImplementation(() => ({
    disconnect: jest.fn(),
    observe: jest.fn(),
    unobserve: jest.fn()
  }))

describe('Favorites view', () => {
  // these tests currently disable the composition API which basically renders the unit tests useless.
  // we need to come up with import mocks for composables, then mock the state from the composables and
  // test the respective composables separately. until then these view tests don't make much sense...
  describe('appBar always present', () => {
    it.todo('implement "app bar" tests')
  })
  describe('different files view states', () => {
    describe('loading', () => {
      it('shows only the loader component during loading', () => {
        const { wrapper } = getMountedWrapper({
          mocks: {
            loadResourcesTask: {
              perform: jest.fn()
            },
            areResourcesLoading: true
          }
        })

        expect(wrapper.find(spinnerStub).exists()).toBeTruthy()
        expect(wrapper.find(resourceTableStub).exists()).toBeFalsy()
      })
    })
    describe('no content', () => {
      it.todo('implement "no content" state tests')
    })
    describe('list files', () => {
      it.todo('implement "list files" state tests')
    })
  })
})

// describe('Favorites view', () => {
//   describe('loading indicator', () => {
//     it('shows only the list-loader during loading', () => {
//       const wrapper = getMountedWrapper({ loading: true })
//
//       expect(wrapper.find(spinnerStub).exists()).toBeTruthy()
//       expect(wrapper.find(resourceTableStub).exists()).toBeFalsy()
//     })
//
//     it('shows only the files table when loading is finished', () => {
//       const wrapper = getMountedWrapper({
//         setup() {
//           return {
//             paginatedResources: defaultActiveFiles
//           }
//         }
//       })
//
//       expect(wrapper.find(spinnerStub).exists()).toBeFalsy()
//       expect(wrapper.find(resourceTableStub).exists()).toBeTruthy()
//     })
//   })
//   describe('no content message', () => {
//     it('shows only the "no content" message if no resources are marked as favorite', () => {
//       const store = getStore()
//       const wrapper = getMountedWrapper({ store, loading: false })
//
//       expect(wrapper.find(selectors.noContentMessage).exists()).toBeTruthy()
//       expect(wrapper.find(resourceTableStub).exists()).toBeFalsy()
//     })
//
//     it('does not show the no content message if resources are marked as favorite', () => {
//       const wrapper = getMountedWrapper({
//         setup() {
//           return {
//             paginatedResources: defaultActiveFiles
//           }
//         }
//       })
//
//       expect(wrapper.find('#files-favorites-empty').exists()).toBeFalsy()
//       expect(wrapper.find(resourceTableStub).exists()).toBeTruthy()
//     })
//   })
//   describe('files table', () => {
//     describe('previews', () => {
//       it('displays previews when the "disablePreviews" config is disabled', () => {
//         const store = getStore({
//           disablePreviews: false
//         })
//         const wrapper = getMountedWrapper({
//           store,
//           loading: false,
//           setup() {
//             return {
//               paginatedResources: defaultActiveFiles
//             }
//           }
//         })
//
//         expect(
//           wrapper.find(selectors.favoritesTable).attributes('arethumbnailsdisplayed')
//         ).toBeTruthy()
//       })
//
//       it('hides previews when the "disablePreviews" config is enabled', () => {
//         const store = getStore({
//           disablePreviews: true
//         })
//         const wrapper = getMountedWrapper({
//           store,
//           loading: false,
//           setup() {
//             return {
//               paginatedResources: defaultActiveFiles
//             }
//           }
//         })
//
//         expect(
//           wrapper.find(selectors.favoritesTable).attributes('arethumbnailsdisplayed')
//         ).toBeFalsy()
//       })
//     })
//
//     describe('pagination', () => {
//       beforeEach(() => {
//         stubs['resource-table'] = false
//       })
//
//       it('does not show any pagination when there is only one page', () => {
//         const store = getStore({
//           highlightedFile: defaultActiveFiles[0],
//           pages: 1,
//           currentPage: 1,
//           totalFilesCount: { files: 10, folders: 10 }
//         })
//         const wrapper = getMountedWrapper({ store, loading: false })
//
//         expect(wrapper.find(paginationStub).exists()).toBeFalsy()
//       })
//     })
//
//     describe('list-info', () => {
//       beforeEach(() => {
//         stubs['resource-table'] = false
//         stubs['list-info'] = true
//       })
//
//       it('sets the counters and the size', () => {
//         const store = getStore({
//           highlightedFile: defaultActiveFiles[0],
//           totalFilesCount: { files: 15, folders: 20 },
//           totalFilesSize: 1024
//         })
//         const wrapper = getMountedWrapper({
//           store,
//           loading: false,
//           setup() {
//             return {
//               paginatedResources: defaultActiveFiles
//             }
//           }
//         })
//         const listInfoStubElement = wrapper.find(listInfoStub)
//
//         expect(listInfoStubElement.props()).toMatchObject({
//           files: 15,
//           folders: 20,
//           size: 1024
//         })
//         expect(listInfoStubElement.attributes()).toMatchObject({
//           files: '15',
//           folders: '20',
//           size: '1024'
//         })
//       })
//
//       it('shows the list info when there is only one active file', () => {
//         const file = createFile({ id: 3, status: 2, type: 'file' })
//         const store = getStore({
//           highlightedFile: file,
//           totalFilesCount: { files: 15, folders: 20 }
//         })
//         const wrapper = getMountedWrapper({
//           store,
//           loading: false,
//           setup() {
//             return {
//               paginatedResources: defaultActiveFiles
//             }
//           }
//         })
//
//         expect(wrapper.find(listInfoStub).exists()).toBeTruthy()
//       })
//
//       it('does not show the list info when there are no active files', () => {
//         const store = getStore()
//         const wrapper = getMountedWrapper({ store, loading: false })
//
//         expect(wrapper.find(listInfoStub).exists()).toBeFalsy()
//       })
//     })
//   })
// })

function getMountedWrapper({ mocks }) {
  const defaultMocks = {
    ...defaultComponentMocks(),
    sideBarOpen: false,
    ...(mocks && mocks)
  }
  const storeOptions = {
    ...defaultStoreMockOptions
  }
  const localVue = defaultLocalVue({ compositionApi: false })
  const store = createStore(Vuex.Store, storeOptions)
  return {
    mocks: defaultMocks,
    storeOptions,
    wrapper: mount(Favorites, {
      localVue,
      mocks: defaultMocks,
      store,
      stubs
    })
  }
}
