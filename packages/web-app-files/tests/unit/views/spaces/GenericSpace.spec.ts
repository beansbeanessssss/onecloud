import { mount } from '@vue/test-utils'
import GenericSpace from '../../../../src/views/spaces/GenericSpace.vue'
import { defaultStoreMockOptions } from 'web-test-helpers/src/mocks/store/defaultStoreMockOptions'
import { defaultComponentMocks } from 'web-test-helpers/src/mocks/defaultComponentMocks'
import { createStore } from 'vuex-extensions'
import { defaultLocalVue } from 'web-test-helpers/src/localVue/defaultLocalVue'
import Vuex from 'vuex'
import { files, spaces } from '../../../__fixtures__'
import { useResourcesViewDefaults } from 'web-app-files/src/composables'
import { useResourcesViewDefaultsMock } from 'web-app-files/tests/mocks/useResourcesViewDefaultsMock'
import { ref } from '@vue/composition-api'
import { defaultStubs } from 'web-test-helpers/src/mocks/defaultStubs'

jest.mock('web-app-files/src/composables')

describe('GenericSpace view', () => {
  it('appBar always present', () => {
    const { wrapper } = getMountedWrapper()
    expect(wrapper.find('app-bar-stub').exists()).toBeTruthy()
  })
  it('sideBar always present', () => {
    const { wrapper } = getMountedWrapper()
    expect(wrapper.find('side-bar-stub').exists()).toBeTruthy()
  })
  describe('space header', () => {
    it('does not render the space header in the personal space', () => {
      const { wrapper } = getMountedWrapper()
      expect(wrapper.find('space-header-stub').exists()).toBeFalsy()
    })
    it('does not render the space header in a nested project space', () => {
      const { wrapper } = getMountedWrapper({
        props: {
          item: '/someFolder',
          space: spaces[0]
        }
      })
      expect(wrapper.find('space-header-stub').exists()).toBeFalsy()
    })
    it('renders the space header on a space frontpage', () => {
      const { wrapper } = getMountedWrapper({
        props: {
          space: spaces[0]
        }
      })
      expect(wrapper.find('space-header-stub').exists()).toBeTruthy()
    })
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
      const { wrapper } = getMountedWrapper({ files })
      expect(wrapper.find('.no-content-message').exists()).toBeFalsy()
      expect(wrapper.find('resource-table-stub').exists()).toBeTruthy()
    })
  })
})

function getMountedWrapper({ mocks = {}, props = {}, files = [], loading = false } = {}) {
  jest.mocked(useResourcesViewDefaults).mockImplementation(() =>
    useResourcesViewDefaultsMock({
      paginatedResources: ref(files),
      areResourcesLoading: ref(loading)
    })
  )
  const defaultMocks = {
    ...defaultComponentMocks({
      currentRoute: { name: 'files-spaces-generic', path: '/' }
    }),
    ...(mocks && mocks)
  }
  const storeOptions = { ...defaultStoreMockOptions }
  const propsData = {
    space: { id: 1, getDriveAliasAndItem: jest.fn(), name: 'Personal space' },
    item: '/',
    ...props
  }
  const localVue = defaultLocalVue({ compositionApi: true })
  const store = createStore(Vuex.Store, storeOptions)
  return {
    mocks: defaultMocks,
    storeOptions,
    wrapper: mount(GenericSpace, {
      localVue,
      mocks: defaultMocks,
      store,
      stubs: defaultStubs,
      propsData
    })
  }
}
