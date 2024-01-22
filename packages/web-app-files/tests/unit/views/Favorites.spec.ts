import Favorites from '../../../src/views/Favorites.vue'
import { useResourcesViewDefaults } from 'web-app-files/src/composables'
import { useResourcesViewDefaultsMock } from 'web-app-files/tests/mocks/useResourcesViewDefaultsMock'
import { h, ref } from 'vue'
import { mockDeep, mock } from 'jest-mock-extended'
import { Resource } from '@ownclouders/web-client'
import { defaultPlugins, defaultStubs, mount, defaultComponentMocks } from 'web-test-helpers'
import { RouteLocation } from 'vue-router'
import { useExtensionRegistryMock } from 'web-test-helpers/src/mocks/useExtensionRegistryMock'
import { useExtensionRegistry } from '@ownclouders/web-pkg'

jest.mock('web-app-files/src/composables')
jest.mock('@ownclouders/web-pkg', () => ({
  ...jest.requireActual('@ownclouders/web-pkg'),
  useFileActions: jest.fn(),
  useExtensionRegistry: jest.fn()
}))

describe('Favorites view', () => {
  it('appBar always present', () => {
    const { wrapper } = getMountedWrapper()
    expect(wrapper.find('app-bar-stub').exists()).toBeTruthy()
  })
  it('sideBar always present', () => {
    const { wrapper } = getMountedWrapper()
    expect(wrapper.find('file-side-bar-stub').exists()).toBeTruthy()
  })
  describe('different files view states', () => {
    it('shows the loading spinner during loading', () => {
      const { wrapper } = getMountedWrapper({ loading: true })
      expect(wrapper.find('oc-spinner-stub').exists()).toBeTruthy()
    })
    it('shows the no-content-message after loading', () => {
      const { wrapper } = getMountedWrapper()
      expect(wrapper.find('oc-spinner-stub').exists()).toBeFalsy()
      expect(wrapper.find('.no-content-message').exists()).toBeTruthy()
    })
    it('shows the files table when files are available', () => {
      const { wrapper } = getMountedWrapper({ files: [mockDeep<Resource>()] })
      expect(wrapper.find('.no-content-message').exists()).toBeFalsy()
      expect(wrapper.find('.resource-table').exists()).toBeTruthy()
    })
  })
})

function getMountedWrapper({ mocks = {}, files = [], loading = false } = {}) {
  jest.mocked(useResourcesViewDefaults).mockImplementation(() => {
    return useResourcesViewDefaultsMock({
      paginatedResources: ref(files),
      areResourcesLoading: ref(loading)
    })
  })

  const extensions = [
    {
      id: 'com.github.owncloud.web.files.folder-view.resource-table',
      type: 'folderView',
      scopes: ['resource', 'space', 'favorite'],
      folderView: {
        name: 'resource-table',
        label: 'Switch to default view',
        icon: {
          name: 'menu-line',
          fillType: 'none'
        },
        component: h('div', { class: 'resource-table' })
      }
    }
  ]

  jest.mocked(useExtensionRegistry).mockImplementation(() =>
    useExtensionRegistryMock({
      requestExtensions<ExtensionType>(type: string, scopes: string[]) {
        return extensions as ExtensionType[]
      }
    })
  )

  const defaultMocks = {
    ...defaultComponentMocks({
      currentRoute: mock<RouteLocation>({ name: 'files-common-favorites' })
    }),
    ...(mocks && mocks)
  }

  return {
    wrapper: mount(Favorites, {
      global: {
        plugins: [...defaultPlugins()],
        mocks: defaultMocks,
        provide: defaultMocks,
        stubs: defaultStubs
      }
    })
  }
}
