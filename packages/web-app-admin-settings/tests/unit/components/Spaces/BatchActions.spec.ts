import {
  createStore,
  defaultComponentMocks,
  defaultPlugins,
  defaultStoreMockOptions,
  defaultStubs,
  mount
} from 'web-test-helpers'
import { mock } from 'jest-mock-extended'
import { Resource } from 'web-client/src/helpers'
import BatchActions from '../../../../src/components/Spaces/BatchActions.vue'

const mixins = ['$_disable_items', '$_restore_items', '$_delete_items']

const Component = {
  ...BatchActions,
  mixins
}

describe('BatchActions', () => {
  describe('menu sections', () => {
    it('do not render when no action enabled', () => {
      const { wrapper } = getWrapper()
      expect(wrapper.findAll('action-menu-item-stub').length).toBe(0)
    })

    it('render enabled actions', () => {
      const enabledActions = ['$_disable_items', '$_restore_items', '$_delete_items']
      const { wrapper } = getWrapper({ enabledActions })
      expect(wrapper.findAll('action-menu-item-stub').length).toBe(enabledActions.length)
    })
  })
})

function getWrapper({ enabledActions = [] } = {}) {
  const storeOptions = { ...defaultStoreMockOptions }
  const store = createStore(storeOptions)
  const mocks = {
    ...defaultComponentMocks(),
    ...getMixinMocks(enabledActions)
  }
  return {
    storeOptions,
    mocks,
    wrapper: mount(Component, {
      props: {
        items: [mock<Resource>()]
      },
      global: {
        mocks,
        stubs: { ...defaultStubs, 'action-menu-item': true },
        plugins: [...defaultPlugins(), store]
      }
    })
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
