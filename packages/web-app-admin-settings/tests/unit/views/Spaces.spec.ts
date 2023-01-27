import { mockAxiosResolve } from 'web-test-helpers/src/mocks'
import { Graph } from 'web-client'
import { mockDeep } from 'jest-mock-extended'
import { ClientService } from 'web-pkg/src'
import {
  createStore,
  defaultComponentMocks,
  defaultPlugins,
  defaultStoreMockOptions,
  mount
} from 'web-test-helpers'
import Spaces from '../../../src/views/Spaces.vue'

window.ResizeObserver =
  window.ResizeObserver ||
  jest.fn().mockImplementation(() => ({
    disconnect: jest.fn(),
    observe: jest.fn(),
    unobserve: jest.fn()
  }))

const selectors = {
  loadingSpinnerStub: 'app-loading-spinner-stub',
  spacesListStub: 'spaces-list-stub',
  noContentMessageStub: 'no-content-message-stub',
  batchActionsStub: 'batch-actions-stub'
}

const mixins = ['$_disable_items', '$_restore_items', '$_delete_items']
jest.mock('web-pkg/src/composables/appDefaults')

describe('Spaces view', () => {
  describe('loading states', () => {
    it('should show loading spinner if loading', () => {
      const { wrapper } = getWrapper()
      expect(wrapper.find(selectors.loadingSpinnerStub).exists()).toBeTruthy()
    })
    it('should render spaces list after loading has been finished', async () => {
      const { wrapper } = getWrapper()
      await wrapper.vm.loadResourcesTask.last
      expect(wrapper.html()).toMatchSnapshot()
      expect(wrapper.find(selectors.spacesListStub).exists()).toBeTruthy()
    })
  })
  it('should render no content message if no spaces found', async () => {
    const graph = mockDeep<Graph>()
    graph.drives.listAllDrives.mockImplementation(() => mockAxiosResolve({ value: [] }))
    const { wrapper } = getWrapper({ spaces: [] })
    await wrapper.vm.loadResourcesTask.last
    expect(wrapper.find(selectors.noContentMessageStub).exists()).toBeTruthy()
  })
  describe('toggle selection', () => {
    describe('toggleSelectAllSpaces method', () => {
      it('selects all spaces', async () => {
        const spaces = [{ name: 'Some Space' }]
        const { wrapper } = getWrapper({ spaces })
        await wrapper.vm.loadResourcesTask.last
        wrapper.vm.toggleSelectAllSpaces()
        expect(wrapper.vm.selectedSpaces).toEqual(
          expect.arrayContaining([expect.objectContaining({ name: spaces[0].name })])
        )
      })
      it('de-selects all selected spaces', async () => {
        const spaces = [{ name: 'Some Space' }]
        const { wrapper } = getWrapper({ spaces })
        await wrapper.vm.loadResourcesTask.last
        wrapper.vm.selectedSpaces = spaces
        wrapper.vm.toggleSelectAllSpaces()
        expect(wrapper.vm.selectedSpaces.length).toBe(0)
      })
    })
    describe('toggleSelectSpace method', () => {
      it('selects a space', async () => {
        const spaces = [{ name: 'Some Space' }]
        const { wrapper } = getWrapper()
        await wrapper.vm.loadResourcesTask.last
        wrapper.vm.toggleSelectSpace(spaces[0])
        expect(wrapper.vm.selectedSpaces).toEqual(
          expect.arrayContaining([expect.objectContaining({ name: spaces[0].name })])
        )
      })
      it('de-selects a selected space', async () => {
        const spaces = [{ name: 'Some Space' }]
        const { wrapper } = getWrapper()
        await wrapper.vm.loadResourcesTask.last
        wrapper.vm.selectedSpaces = spaces
        wrapper.vm.toggleSelectSpace(spaces[0])
        expect(wrapper.vm.selectedSpaces.length).toBe(0)
      })
    })
    describe('unselectAllSpaces method', () => {
      it('de-selects all selected spaces', async () => {
        const spaces = [{ name: 'Some Space' }]
        const { wrapper } = getWrapper({ spaces })
        await wrapper.vm.loadResourcesTask.last
        wrapper.vm.selectedSpaces = spaces
        wrapper.vm.unselectAllSpaces()
        expect(wrapper.vm.selectedSpaces.length).toBe(0)
      })
    })
  })
  describe('batch actions', () => {
    it('do not display when no space selected', async () => {
      const { wrapper } = getWrapper()
      await wrapper.vm.loadResourcesTask.last
      expect(wrapper.find(selectors.batchActionsStub).exists()).toBeFalsy()
    })
    it('display when one space selected', async () => {
      const spaces = [{ name: 'Some Space' }]
      const { wrapper } = getWrapper({ spaces })
      await wrapper.vm.loadResourcesTask.last
      wrapper.vm.toggleSelectSpace(spaces[0])
      await wrapper.vm.$nextTick()
      expect(wrapper.find(selectors.batchActionsStub).exists()).toBeTruthy()
    })
    it('display when more than one space selected', async () => {
      const spaces = [{ name: 'Some Space' }, { name: 'Some other Space' }]
      const { wrapper } = getWrapper({ spaces })
      await wrapper.vm.loadResourcesTask.last
      wrapper.vm.toggleSelectAllSpaces()
      await wrapper.vm.$nextTick()
      expect(wrapper.find(selectors.batchActionsStub).exists()).toBeTruthy()
    })
  })
})

function getWrapper({ spaces = [{ name: 'Some Space' }] } = {}) {
  const graph = mockDeep<Graph>()
  graph.drives.listAllDrives.mockImplementation(() => mockAxiosResolve({ value: spaces }))
  const $clientService = mockDeep<ClientService>()
  $clientService.graphAuthenticated.mockImplementation(() => graph)
  const mocks = { ...defaultComponentMocks(), $clientService, ...getMixinMocks(mixins) }

  const storeOptions = { ...defaultStoreMockOptions }
  const store = createStore(storeOptions)

  return {
    wrapper: mount(
      { ...Spaces, mixins },
      {
        global: {
          plugins: [...defaultPlugins(), store],
          mocks,
          stubs: {
            AppLoadingSpinner: true,
            NoContentMessage: true,
            SpacesList: true,
            OcBreadcrumb: true,
            BatchActions: true
          }
        }
      }
    )
  }
}

const getMixinMocks = (enabledActions) => {
  const mixinMocks = {}
  for (const mixin of mixins) {
    const isEnabled = !!enabledActions.includes(mixin)
    mixinMocks[mixin] = [{ isEnabled: () => isEnabled, name: '', items: [] }]
  }
  return mixinMocks
}
