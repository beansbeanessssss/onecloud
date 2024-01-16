import { useRouteQuery } from '../../../src/composables/router'
import SearchBarFilter from '../../../src/components/SearchBarFilter.vue'
import { defaultComponentMocks, defaultPlugins, shallowMount } from 'web-test-helpers'

jest.mock('../../../src/composables/router')

const selectors = {
  filterChipStub: 'oc-filter-chip-stub'
}

describe('SearchBarFilter', () => {
  it('shows "All files" as default option', () => {
    const { wrapper } = getWrapper({ currentFolderAvailable: true })
    const filterLabel = wrapper.findComponent<any>(selectors.filterChipStub).props('filterLabel')
    expect(filterLabel).toBe('All files')
  })
  it('shows "All files" as current option if no Current folder available', () => {
    const { wrapper } = getWrapper()
    const filterLabel = wrapper.findComponent<any>(selectors.filterChipStub).props('filterLabel')
    expect(filterLabel).toBe('All files')
  })
  it('shows "Current folder" as current option if given via scope', () => {
    const { wrapper } = getWrapper({ useScope: 'true' })
    const filterLabel = wrapper.findComponent<any>(selectors.filterChipStub).props('filterLabel')
    expect(filterLabel).toBe('Current folder')
  })
})

function getWrapper({ currentFolderAvailable = false, useScope = null } = {}) {
  jest.mocked(useRouteQuery).mockImplementationOnce(() => useScope)

  const mocks = defaultComponentMocks()
  return {
    mocks,
    wrapper: shallowMount(SearchBarFilter, {
      props: {
        currentFolderAvailable
      },
      global: {
        plugins: [...defaultPlugins()],
        mocks,
        provide: mocks
      }
    })
  }
}
