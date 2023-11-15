import SharedWithMe from '../../../../src/views/shares/SharedWithMe.vue'
import { useResourcesViewDefaults } from 'web-app-files/src/composables'
import {
  queryItemAsString,
  InlineFilterOption,
  useSort,
  useOpenWithDefaultApp
} from '@ownclouders/web-pkg'
import { useResourcesViewDefaultsMock } from 'web-app-files/tests/mocks/useResourcesViewDefaultsMock'
import { ref } from 'vue'
import { defaultStubs, RouteLocation } from 'web-test-helpers'
import { useSortMock } from 'web-app-files/tests/mocks/useSortMock'
import { mock } from 'jest-mock-extended'
import {
  createStore,
  defaultPlugins,
  mount,
  defaultStoreMockOptions,
  defaultComponentMocks
} from 'web-test-helpers'
import { Resource } from '@ownclouders/web-client'
import { ShareTypes } from '@ownclouders/web-client/src/helpers'

jest.mock('web-app-files/src/composables/resourcesViewDefaults')
jest.mock('@ownclouders/web-pkg', () => ({
  ...jest.requireActual('@ownclouders/web-pkg'),
  useSort: jest.fn().mockImplementation(() => useSortMock()),
  queryItemAsString: jest.fn(),
  useRouteQuery: jest.fn(),
  useOpenWithDefaultApp: jest.fn()
}))

describe('SharedWithMe view', () => {
  it('appBar always present', () => {
    const { wrapper } = getMountedWrapper()
    expect(wrapper.find('app-bar-stub').exists()).toBeTruthy()
  })
  it('sideBar always present', () => {
    const { wrapper } = getMountedWrapper()
    expect(wrapper.find('side-bar-stub').exists()).toBeTruthy()
  })
  describe('different files view states', () => {
    it('shows the loading spinner during loading', () => {
      const { wrapper } = getMountedWrapper({ loading: true })
      expect(wrapper.find('oc-spinner-stub').exists()).toBeTruthy()
    })
    it('does not show the loading spinner after loading finished', () => {
      const { wrapper } = getMountedWrapper()
      expect(wrapper.find('oc-spinner-stub').exists()).toBeFalsy()
    })
  })
  describe('open with default app', () => {
    it('gets called if given via route query param', async () => {
      const { wrapper, mocks } = getMountedWrapper({ openWithDefaultAppQuery: 'true' })
      await wrapper.vm.loadResourcesTask.last
      expect(mocks.openWithDefaultApp).toHaveBeenCalled()
    })
    it('gets not called if not given via route query param', async () => {
      const { wrapper, mocks } = getMountedWrapper()
      await wrapper.vm.loadResourcesTask.last
      expect(mocks.openWithDefaultApp).not.toHaveBeenCalled()
    })
  })
  describe('filter', () => {
    describe('share visibility', () => {
      it('shows filter', () => {
        const { wrapper } = getMountedWrapper()
        expect(wrapper.find('.share-visibility-filter').exists()).toBeTruthy()
        expect(wrapper.find('item-filter-inline-stub').exists()).toBeTruthy()
      })
      it('shows all visible shares', () => {
        const { wrapper } = getMountedWrapper()
        expect(wrapper.findAll('shared-with-me-section-stub').length).toBe(1)
        expect(wrapper.findComponent<any>('shared-with-me-section-stub').props('title')).toEqual(
          'Shares'
        )
      })
      it('shows all hidden shares', async () => {
        const { wrapper } = getMountedWrapper()
        wrapper.vm.setAreHiddenFilesShown(mock<InlineFilterOption>({ name: 'hidden' }))
        await wrapper.vm.$nextTick()
        expect(wrapper.findAll('shared-with-me-section-stub').length).toBe(1)
        expect(wrapper.findComponent<any>('shared-with-me-section-stub').props('title')).toEqual(
          'Hidden Shares'
        )
      })
    })
    describe('share type', () => {
      it('shows filter if more than one share types are present', () => {
        const { wrapper } = getMountedWrapper({
          files: [
            mock<Resource>({ share: { shareType: ShareTypes.user.value } }),
            mock<Resource>({ share: { shareType: ShareTypes.group.value } })
          ]
        })
        expect(wrapper.find('.share-type-filter').exists()).toBeTruthy()
      })
      it('does not show filter if only one share type is present', () => {
        const { wrapper } = getMountedWrapper({
          files: [mock<Resource>({ share: { shareType: ShareTypes.user.value } })]
        })
        expect(wrapper.find('.share-type-filter').exists()).toBeFalsy()
      })
    })
  })
})

function getMountedWrapper({
  mocks = {},
  loading = false,
  files = [],
  openWithDefaultAppQuery = ''
} = {}) {
  jest.mocked(useResourcesViewDefaults).mockImplementation(() =>
    useResourcesViewDefaultsMock({
      storeItems: ref(files),
      areResourcesLoading: ref(loading)
    })
  )
  jest.mocked(useSort).mockImplementation((options) => useSortMock({ items: ref(options.items) }))
  // selected share types
  jest.mocked(queryItemAsString).mockImplementationOnce(() => undefined)
  // openWithDefaultAppQuery
  jest.mocked(queryItemAsString).mockImplementationOnce(() => openWithDefaultAppQuery)

  const openWithDefaultApp = jest.fn()
  jest.mocked(useOpenWithDefaultApp).mockReturnValue({ openWithDefaultApp })

  const defaultMocks = {
    ...defaultComponentMocks({
      currentRoute: mock<RouteLocation>({ name: 'files-shares-with-me' })
    }),
    ...(mocks && mocks),
    openWithDefaultApp
  }
  const storeOptions = { ...defaultStoreMockOptions }
  const store = createStore(storeOptions)
  return {
    mocks: defaultMocks,
    storeOptions,
    wrapper: mount(SharedWithMe, {
      global: {
        plugins: [...defaultPlugins(), store],
        mocks: defaultMocks,
        stubs: { ...defaultStubs, itemFilterInline: true, ItemFilter: true }
      }
    })
  }
}
