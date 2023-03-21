import {
  defaultPlugins,
  defaultStoreMockOptions,
  getActionMixinMocks,
  mount
} from 'web-test-helpers'
import { mock } from 'jest-mock-extended'
import { Resource } from 'web-client/src/helpers'
import ContextActions from '../../../../src/components/Groups/ContextActions.vue'
import { ref } from 'vue'

function createMockActionComposables(module) {
  const mockModule: Record<string, any> = {}
  for (const m of Object.keys(module)) {
    mockModule[m] = jest.fn(() => ({ actions: ref([]) }))
  }
  return mockModule
}

jest.mock('web-pkg/src/composables/actions/useActionsShowDetails', () =>
  createMockActionComposables(
    jest.requireActual('web-pkg/src/composables/actions/useActionsShowDetails')
  )
)

const mixins = ['$_delete_items']
const selectors = {
  actionMenuItemStub: 'action-menu-item-stub'
}

describe('ContextActions', () => {
  describe('menu sections', () => {
    it('do not render when no action enabled', () => {
      const { wrapper } = getWrapper()
      expect(wrapper.findAll(selectors.actionMenuItemStub).length).toBe(0)
    })

    it('render enabled actions', () => {
      const enabledActions = ['$_delete_items']
      const { wrapper } = getWrapper({ enabledActions })
      expect(wrapper.findAll(selectors.actionMenuItemStub).length).toBe(enabledActions.length)
    })
  })
})

function getWrapper({ enabledActions = [] } = {}) {
  const storeOptions = { ...defaultStoreMockOptions }
  const mocks = getActionMixinMocks({ actions: mixins, enabledActions })
  return {
    storeOptions,
    mocks,
    wrapper: mount(
      { ...ContextActions, mixins },
      {
        props: {
          items: [mock<Resource>()]
        },
        global: {
          mocks,
          stubs: { 'action-menu-item': true },
          plugins: [...defaultPlugins()]
        }
      }
    )
  }
}
