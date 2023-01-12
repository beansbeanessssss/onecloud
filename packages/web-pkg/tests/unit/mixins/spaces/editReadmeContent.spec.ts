import editReadmeContent from 'web-pkg/src/mixins/spaces/editReadmeContent'
import { buildSpace } from 'web-client/src/helpers'
import { createStore, defaultPlugins, mount, defaultStoreMockOptions } from 'web-test-helpers'

const Component = {
  template: '<div></div>',
  mixins: [editReadmeContent]
}
afterEach(() => jest.clearAllMocks())

describe('editReadmeContent', () => {
  describe('isEnabled property', () => {
    it('should be true for space managers', () => {
      const spaceMock = {
        id: '1',
        root: { permissions: [{ roles: ['manager'], grantedToIdentities: [{ user: { id: 1 } }] }] },
        special: [{ specialFolder: { name: 'readme' } }]
      }

      const { wrapper } = getWrapper()
      expect(
        wrapper.vm.$_editReadmeContent_items[0].isEnabled({
          resources: [buildSpace(spaceMock)]
        })
      ).toBe(true)
    })
    it('should be false when not resource given', () => {
      const { wrapper } = getWrapper()
      expect(wrapper.vm.$_editReadmeContent_items[0].isEnabled({ resources: [] })).toBe(false)
    })
    it('should be false when spaceReadmeData does not exist', () => {
      const spaceMock = {
        id: '1',
        root: { permissions: [{ roles: ['manager'], grantedToIdentities: [{ user: { id: 1 } }] }] }
      }

      const { wrapper } = getWrapper()
      expect(
        wrapper.vm.$_editReadmeContent_items[0].isEnabled({
          resources: [buildSpace(spaceMock)]
        })
      ).toBe(false)
    })
    it('should be false when the current user is a viewer', () => {
      const spaceMock = {
        id: '1',
        root: { permissions: [{ roles: ['viewer'], grantedToIdentities: [{ user: { id: 1 } }] }] }
      }

      const { wrapper } = getWrapper()
      expect(
        wrapper.vm.$_editReadmeContent_items[0].isEnabled({
          resources: [buildSpace(spaceMock)]
        })
      ).toBe(false)
    })
  })
})

function getWrapper() {
  const storeOptions = {
    ...defaultStoreMockOptions,
    modules: { ...defaultStoreMockOptions.modules, user: { state: { id: 'alice', uuid: 1 } } }
  }
  const store = createStore(storeOptions)
  return {
    wrapper: mount(Component, {
      global: {
        plugins: [...defaultPlugins(), store]
      }
    })
  }
}
