import { describe } from '@jest/globals'
import { shallowMount } from '@vue/test-utils'
import List from 'web-app-files/src/components/Search/List.vue'
import { useResourcesViewDefaults } from 'web-app-files/src/composables'
import { useResourcesViewDefaultsMock } from 'web-app-files/tests/mocks/useResourcesViewDefaultsMock'
import {
  createStore,
  defaultComponentMocks,
  defaultPlugins,
  defaultStoreMockOptions,
  mockAxiosResolve
} from 'web-test-helpers/src'
import { queryItemAsString } from 'web-pkg'
import { ref } from 'vue'
import { Resource } from 'web-client/src'
import { mock } from 'jest-mock-extended'

jest.mock('web-app-files/src/composables')
jest.mock('web-pkg/src/composables/appDefaults')

const selectors = {
  noContentMessageStub: 'no-content-message-stub',
  resourceTableStub: 'resource-table-stub',
  tagFilter: '.files-search-filter-tags'
}

describe('List component', () => {
  it('should render no-content-message if no resources found', () => {
    const { wrapper } = getWrapper()
    expect(wrapper.find(selectors.noContentMessageStub).exists()).toBeTruthy()
  })
  it('should render resource table if resources found', () => {
    const { wrapper } = getWrapper({ resources: [mock<Resource>()] })
    expect(wrapper.find(selectors.resourceTableStub).exists()).toBeTruthy()
  })
  it('should emit search event on mount', async () => {
    const { wrapper } = getWrapper()
    await wrapper.vm.loadAvailableTagsTask.last
    expect(wrapper.emitted('search').length).toBeGreaterThan(0)
  })
  describe('filter', () => {
    describe('tags', () => {
      it('should show all available tags', async () => {
        const tag = 'tag1'
        const { wrapper } = getWrapper({ availableTags: [tag] })
        await wrapper.vm.loadAvailableTagsTask.last
        expect(wrapper.find(selectors.tagFilter).exists()).toBeTruthy()
        expect(wrapper.findComponent<any>(selectors.tagFilter).props('items')).toEqual([
          { label: tag, id: tag }
        ])
      })
      it('should set initial filter when tags are given via query param', async () => {
        const tagFilterQuery = 'tag1'
        const { wrapper } = getWrapper({
          availableTags: ['tag1'],
          tagFilterQuery
        })
        await wrapper.vm.loadAvailableTagsTask.last
        expect(wrapper.emitted('search')[0][0]).toEqual(tagFilterQuery)
      })
    })
  })
})

function getWrapper({ availableTags = [], resources = [], tagFilterQuery = null } = {}) {
  jest.mocked(queryItemAsString).mockImplementationOnce(() => tagFilterQuery)

  const resourcesViewDetailsMock = useResourcesViewDefaultsMock({
    paginatedResources: ref(resources)
  })
  jest.mocked(useResourcesViewDefaults).mockImplementation(() => resourcesViewDetailsMock)

  const mocks = defaultComponentMocks()
  mocks.$clientService.graphAuthenticated.tags.getTags.mockReturnValue(
    mockAxiosResolve({ value: availableTags })
  )
  const storeOptions = defaultStoreMockOptions
  storeOptions.getters.capabilities.mockReturnValue({ files: { tags: true } })
  const store = createStore(storeOptions)
  return {
    mocks,
    wrapper: shallowMount(List, {
      global: {
        mocks,
        stubs: {
          FilesViewWrapper: false
        },
        plugins: [...defaultPlugins(), store]
      }
    })
  }
}
