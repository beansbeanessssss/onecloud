import { mount } from '@vue/test-utils'
import Projects from '../../../../src/views/spaces/Projects.vue'
import { defaultStoreMockOptions } from 'web-test-helpers/src/mocks/store/defaultStoreMockOptions'
import { defaultComponentMocks } from 'web-test-helpers/src/mocks/defaultComponentMocks'
import { createStore } from 'vuex-extensions'
import { defaultLocalVue } from 'web-test-helpers/src/localVue/defaultLocalVue'
import Vuex from 'vuex'
import { defaultStubs } from 'web-test-helpers/src/mocks/defaultStubs'
import { mockDeep } from 'jest-mock-extended'
import { SpaceResource } from 'web-client/src/helpers'

describe('Projects view', () => {
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
      const { wrapper } = getMountedWrapper()
      expect(wrapper.find('oc-spinner-stub').exists()).toBeTruthy()
    })
    it('shows the no-content-message after loading', async () => {
      const { wrapper } = getMountedWrapper()
      await wrapper.vm.loadResourcesTask.last
      expect(wrapper.find('oc-spinner-stub').exists()).toBeFalsy()
      expect(wrapper.find('.no-content-message').exists()).toBeTruthy()
    })
    it('lists all available project spaces', async () => {
      const spaces = [
        mockDeep<SpaceResource>({
          id: '1',
          name: 'Some space',
          driveType: 'project',
          description: 'desc'
        }),
        mockDeep<SpaceResource>({
          id: '2',
          name: 'Some other space',
          driveType: 'project',
          description: 'desc'
        })
      ]
      const { wrapper } = getMountedWrapper({ spaces })
      await wrapper.vm.loadResourcesTask.last
      // "space" is undefined for "space-context-actions", seems to be a bug because it's definitely not
      // {{ space }} -> undefined, {{ space.id }} -> "1"
      expect(wrapper).toMatchSnapshot()
      expect(wrapper.find('.no-content-message').exists()).toBeFalsy()
      expect(wrapper.find('.spaces-list').exists()).toBeTruthy()
      expect(wrapper.findAll('.spaces-list-item').length).toEqual(spaces.length)
    })
  })
})

function getMountedWrapper({ mocks = {}, spaces = [] } = {}) {
  const defaultMocks = {
    ...defaultComponentMocks({
      currentRoute: { name: 'files-spaces-projects' }
    }),
    ...(mocks && mocks)
  }
  const storeOptions = { ...defaultStoreMockOptions }
  storeOptions.modules.runtime.modules.spaces.getters.spaces = jest.fn(() => spaces)
  const localVue = defaultLocalVue({ compositionApi: true })
  const store = createStore(Vuex.Store, storeOptions)
  return {
    mocks: defaultMocks,
    storeOptions,
    wrapper: mount(Projects, {
      localVue,
      mocks: defaultMocks,
      store,
      stubs: { ...defaultStubs, 'space-context-actions': true }
    })
  }
}
