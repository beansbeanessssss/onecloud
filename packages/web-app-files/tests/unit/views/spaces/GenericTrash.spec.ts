import { mount } from '@vue/test-utils'
import GenericTrash from '../../../../src/views/spaces/GenericTrash.vue'
import { defaultStoreMockOptions } from 'web-test-helpers/src/mocks/store/defaultStoreMockOptions'
import { defaultComponentMocks } from 'web-test-helpers/src/mocks/defaultComponentMocks'
import { createStore } from 'vuex-extensions'
import { defaultLocalVue } from 'web-test-helpers/src/localVue/defaultLocalVue'
import Vuex from 'vuex'
import { useResourcesViewDefaults } from 'web-app-files/src/composables'
import { useResourcesViewDefaultsMock } from 'web-app-files/tests/mocks/useResourcesViewDefaultsMock'
import { ref } from '@vue/composition-api'
import { defaultStubs } from 'web-test-helpers/src/mocks/defaultStubs'
import { mockDeep } from 'jest-mock-extended'
import { Resource } from 'web-client'
import { SpaceResource } from 'web-client/src/helpers'

jest.mock('web-app-files/src/composables')

describe('GenericTrash view', () => {
  it('appBar always present', () => {
    const { wrapper } = getMountedWrapper()
    expect(wrapper.find('app-bar-stub').exists()).toBeTruthy()
  })
  it('sideBar always present', () => {
    const { wrapper } = getMountedWrapper()
    expect(wrapper.find('side-bar-stub').exists()).toBeTruthy()
  })
  it('shows the personal space breadcrumb', () => {
    const { wrapper } = getMountedWrapper()
    expect(wrapper.find('app-bar-stub').props().breadcrumbs[1].text).toEqual('Personal space')
  })
  it('shows the project space breadcrumb', () => {
    const space = mockDeep<SpaceResource>({ driveType: 'project' })
    const { wrapper } = getMountedWrapper({ props: { space } })
    expect(wrapper.find('app-bar-stub').props().breadcrumbs[1].text).toEqual(space.name)
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
      currentRoute: { name: 'files-trash-generic' }
    }),
    ...(mocks && mocks)
  }
  const storeOptions = { ...defaultStoreMockOptions }
  const propsData = {
    space: { id: 1, getDriveAliasAndItem: jest.fn(), name: 'Personal space' },
    ...props
  }
  const localVue = defaultLocalVue({ compositionApi: true })
  const store = createStore(Vuex.Store, storeOptions)
  return {
    mocks: defaultMocks,
    storeOptions,
    wrapper: mount(GenericTrash, {
      localVue,
      mocks: defaultMocks,
      store,
      stubs: defaultStubs,
      propsData
    })
  }
}
