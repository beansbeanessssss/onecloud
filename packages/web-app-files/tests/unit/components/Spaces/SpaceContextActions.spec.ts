import SpaceContextActions from '../../../../src/components/Spaces/SpaceContextActions.vue'
import { buildSpace } from '@ownclouders/web-client/src/helpers'
import {
  createStore,
  defaultComponentMocks,
  defaultPlugins,
  mount,
  defaultStoreMockOptions,
  RouteLocation
} from 'web-test-helpers'
import { mock } from 'jest-mock-extended'
import { Drive } from '@ownclouders/web-client/src/generated'

const spaceMock = mock<Drive>({
  id: '1',
  root: { permissions: [{ roles: ['manager'], grantedToIdentities: [{ user: { id: '1' } }] }] },
  driveType: 'project',
  special: null
})

describe('SpaceContextActions', () => {
  describe('action handlers', () => {
    it('renders actions that are always available: "Members", "Edit Quota", "Details"', () => {
      const { wrapper } = getWrapper(buildSpace(spaceMock))

      expect(
        wrapper.findAll('[data-testid="action-label"]').some((el) => el.text() === 'Members')
      ).toBeDefined()
      expect(
        wrapper.findAll('[data-testid="action-label"]').some((el) => el.text() === 'Edit quota')
      ).toBeDefined()
      expect(
        wrapper.findAll('[data-testid="action-label"]').some((el) => el.text() === 'Details')
      ).toBeDefined()
    })
  })
})

function getWrapper(space) {
  const mocks = defaultComponentMocks({ currentRoute: mock<RouteLocation>({ path: '/files' }) })
  mocks.$previewService.getSupportedMimeTypes.mockReturnValue([])
  const store = createStore(defaultStoreMockOptions)
  return {
    wrapper: mount(SpaceContextActions, {
      props: {
        actionOptions: {
          resources: [space]
        }
      },
      global: {
        mocks,
        provide: mocks,
        plugins: [
          ...defaultPlugins({
            abilities: [{ action: 'set-quota-all', subject: 'Drive' }]
          }),
          store
        ]
      }
    })
  }
}
