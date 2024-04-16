import { mockAxiosResolve } from 'web-test-helpers/src/mocks'
import { SpaceResource } from '@ownclouders/web-client'
import { Graph } from '@ownclouders/web-client/graph'
import { mock, mockDeep } from 'vitest-mock-extended'
import { ClientService, useAppDefaults } from '@ownclouders/web-pkg'
import { defaultComponentMocks, defaultPlugins, mount } from 'web-test-helpers'
import Spaces from '../../../src/views/Spaces.vue'
import { useAppDefaultsMock } from 'web-test-helpers/src/mocks/useAppDefaultsMock'

vi.mock('@ownclouders/web-pkg', async (importOriginal) => ({
  ...(await importOriginal<any>()),
  queryItemAsString: vi.fn(),
  useAppDefaults: vi.fn(),
  useRouteQueryPersisted: vi.fn()
}))
vi.mocked(useAppDefaults).mockImplementation(() => useAppDefaultsMock({}))

const selectors = {
  loadingSpinnerStub: 'app-loading-spinner-stub',
  spacesListStub: 'spaces-list-stub',
  noContentMessageStub: 'no-content-message-stub',
  batchActionsStub: 'batch-actions-stub'
}

describe('Spaces view', () => {
  describe('loading states', () => {
    it('should show loading spinner if loading', () => {
      const { wrapper } = getWrapper()
      expect(wrapper.find(selectors.loadingSpinnerStub).exists()).toBeTruthy()
    })
    it('should render spaces list after loading has been finished', async () => {
      const spaces = [{ id: '1', name: 'Some Space' }]
      const { wrapper } = getWrapper({ spaces })
      await wrapper.vm.loadResourcesTask.last
      expect(wrapper.html()).toMatchSnapshot()
      expect(wrapper.find(selectors.spacesListStub).exists()).toBeTruthy()
    })
  })
  it('should render no content message if no spaces found', async () => {
    const graph = mockDeep<Graph>()
    graph.drives.listAllDrives.mockResolvedValue(mockAxiosResolve({ value: [] }))
    const { wrapper } = getWrapper({ spaces: [] })
    await wrapper.vm.loadResourcesTask.last
    expect(wrapper.find(selectors.noContentMessageStub).exists()).toBeTruthy()
  })
  describe('batch actions', () => {
    it('do not display when no space selected', async () => {
      const { wrapper } = getWrapper()
      await wrapper.vm.loadResourcesTask.last
      expect(wrapper.find(selectors.batchActionsStub).exists()).toBeFalsy()
    })
    it('display when one space selected', async () => {
      const spaces = [{ id: '1', name: 'Some Space' }]
      const { wrapper } = getWrapper({ spaces, selectedSpaces: spaces })
      await wrapper.vm.loadResourcesTask.last
      await wrapper.vm.$nextTick()
      expect(wrapper.find(selectors.batchActionsStub).exists()).toBeTruthy()
    })
    it('display when more than one space selected', async () => {
      const spaces = [
        { id: '1', name: 'Some Space' },
        { id: '1', name: 'Some other Space' }
      ]
      const { wrapper } = getWrapper({ spaces, selectedSpaces: spaces })
      await wrapper.vm.loadResourcesTask.last
      await wrapper.vm.$nextTick()
      expect(wrapper.find(selectors.batchActionsStub).exists()).toBeTruthy()
    })
  })
})

function getWrapper({
  spaces = [
    {
      id: '1',
      name: 'space'
    }
  ],
  selectedSpaces = []
} = {}) {
  const $clientService = mockDeep<ClientService>()
  $clientService.graphAuthenticated.drives.listAllDrives.mockResolvedValue(
    mockAxiosResolve({ value: spaces })
  )
  const mocks = {
    ...defaultComponentMocks(),
    $clientService
  }

  return {
    wrapper: mount(Spaces, {
      global: {
        plugins: [
          ...defaultPlugins({
            piniaOptions: {
              spaceSettingsStore: {
                spaces: spaces.map((s) => mock<SpaceResource>(s)),
                selectedSpaces
              }
            }
          })
        ],
        mocks,
        provide: mocks,
        stubs: {
          AppLoadingSpinner: true,
          NoContentMessage: true,
          SpacesList: true,
          OcBreadcrumb: true,
          BatchActions: true,
          ViewOptions: true
        }
      }
    })
  }
}
