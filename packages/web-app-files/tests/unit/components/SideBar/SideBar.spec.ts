import fileSideBars from 'web-app-files/src/fileSideBars'
import SideBar from 'web-app-files/src/components/SideBar/SideBar.vue'
import { Resource } from '@ownclouders/web-client/src/helpers'
import { mock, mockDeep } from 'jest-mock-extended'
import {
  createStore,
  defaultComponentMocks,
  defaultPlugins,
  defaultStoreMockOptions,
  RouteLocation,
  shallowMount
} from 'web-test-helpers'
import { defineComponent } from 'vue'

const InnerSideBarComponent = defineComponent({
  props: { availablePanels: { type: Array, required: true } },
  template: '<div id="foo"><slot name="header"></slot></div>'
})

jest.mock('@ownclouders/web-client/src/helpers/resource', () => {
  const original = jest.requireActual('@ownclouders/web-client/src/helpers/resource')
  return {
    ...original,
    buildResource: jest.fn()
  }
})

const selectors = {
  noSelectionInfoPanel: 'no-selection-stub',
  fileInfoStub: 'file-info-stub',
  spaceInfoStub: 'space-info-stub'
}

describe('SideBar', () => {
  describe('file info header', () => {
    it('should show when one resource selected', async () => {
      const item = mock<Resource>({ path: '/someFolder' })
      const { wrapper } = createWrapper({ item })
      wrapper.vm.loadedResource = item
      await wrapper.vm.$nextTick()
      expect(wrapper.find(selectors.fileInfoStub).exists()).toBeTruthy()
    })
    it('not show when no resource selected', () => {
      const { wrapper } = createWrapper()
      expect(wrapper.find(selectors.fileInfoStub).exists()).toBeFalsy()
    })
    it('should not show when selected resource is a project space', async () => {
      const item = mock<Resource>({ path: '/someFolder', driveType: 'project' })
      const { wrapper } = createWrapper({ item })
      wrapper.vm.loadedResource = item
      await wrapper.vm.$nextTick()
      expect(wrapper.find(selectors.fileInfoStub).exists()).toBeFalsy()
    })
  })
  describe('space info header', () => {
    it('should show when one project space resource selected', async () => {
      const item = mock<Resource>({ path: '/someFolder', driveType: 'project' })
      const { wrapper } = createWrapper({ item })
      wrapper.vm.loadedResource = item
      await wrapper.vm.$nextTick()
      expect(wrapper.find(selectors.spaceInfoStub).exists()).toBeTruthy()
    })
    it('not show when no resource selected', () => {
      const { wrapper } = createWrapper()
      expect(wrapper.find(selectors.spaceInfoStub).exists()).toBeFalsy()
    })
    it('should not show when selected resource is not a project space', async () => {
      const item = mock<Resource>({ path: '/someFolder' })
      const { wrapper } = createWrapper({ item })
      wrapper.vm.loadedResource = item
      await wrapper.vm.$nextTick()
      expect(wrapper.find(selectors.spaceInfoStub).exists()).toBeFalsy()
    })
  })
  describe('no selection info panel', () => {
    afterEach(() => {
      jest.clearAllMocks()
    })
    describe('for public links', () => {
      it.each([
        [
          'shows in root node',
          {
            path: '',
            noSelectionExpected: true
          }
        ],
        [
          'does not show in non-root node',
          {
            path: '/publicLinkToken/some-folder',
            noSelectionExpected: false
          }
        ]
      ])('%s', async (name, { path, noSelectionExpected }) => {
        const item = mockDeep<Resource>({ path })
        const { wrapper } = createWrapper({ item })
        wrapper.vm.loadedResource = item
        await wrapper.vm.$nextTick()
        const panels = wrapper.findComponent<any>({ ref: 'sidebar' }).props('availablePanels')
        expect(panels[0].app === 'no-selection').toBe(noSelectionExpected)
      })
    })
    describe('for all files', () => {
      it.each([
        [
          'shows in root node',
          {
            path: '/',
            noSelectionExpected: true
          }
        ],
        [
          'does not show in non-root node',
          {
            path: '/some-folder',
            noSelectionExpected: false
          }
        ]
      ])('%s', async (name, { path, noSelectionExpected }) => {
        const item = mockDeep<Resource>({ path })
        const { wrapper } = createWrapper({ item })
        wrapper.vm.loadedResource = item
        await wrapper.vm.$nextTick()
        const panels = wrapper.findComponent<any>({ ref: 'sidebar' }).props('availablePanels')
        expect(panels[0].app === 'no-selection').toBe(noSelectionExpected)
      })
    })
  })
})

function createWrapper({ item = undefined } = {}) {
  const storeOptions = {
    ...defaultStoreMockOptions,
    getters: {
      ...defaultStoreMockOptions.getters,
      user: function () {
        return { id: 'marie' }
      },
      capabilities: () => ({
        files_sharing: {
          api_enabled: true,
          public: { enabled: true }
        }
      })
    }
  }
  storeOptions.modules.apps.getters.fileSideBars.mockImplementation(() => fileSideBars)
  storeOptions.modules.Files.state.highlightedFile = item
  storeOptions.modules.Files.getters.highlightedFile.mockImplementation(
    (state) => state.highlightedFile
  )
  const store = createStore(storeOptions)
  const mocks = defaultComponentMocks({
    currentRoute: mock<RouteLocation>({ name: 'files-spaces-generic' })
  })
  return {
    wrapper: shallowMount(SideBar, {
      props: {
        open: true
      },
      global: {
        plugins: [...defaultPlugins(), store],
        renderStubDefaultSlot: true,
        stubs: {
          InnerSideBar: InnerSideBarComponent
        },
        mocks,
        provide: mocks
      }
    })
  }
}
