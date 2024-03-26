import SpaceMembers from 'web-app-files/src/components/SideBar/Shares/SpaceMembers.vue'
import {
  ShareTypes,
  ShareRoleNG,
  CollaboratorShare,
  GraphShareRoleIdMap
} from '@ownclouders/web-client/src/helpers/share'
import { mock } from 'vitest-mock-extended'
import { ProjectSpaceResource, SpaceResource } from '@ownclouders/web-client/src/helpers'
import {
  defaultPlugins,
  mount,
  shallowMount,
  defaultComponentMocks,
  RouteLocation
} from 'web-test-helpers'
import { User } from '@ownclouders/web-client/src/generated'
import { useCanShare, useModals } from '@ownclouders/web-pkg'

vi.mock('@ownclouders/web-pkg', async (importOriginal) => ({
  ...(await importOriginal<any>()),
  useCanShare: vi.fn()
}))

const memberMocks = [
  {
    id: '1',
    shareType: ShareTypes.spaceUser.value,
    sharedWith: {
      id: 'alice',
      displayName: 'alice'
    },
    role: mock<ShareRoleNG>({ id: GraphShareRoleIdMap.SpaceManager }),
    permissions: [],
    resourceId: '1',
    indirect: false,
    sharedBy: { id: 'admin', displayName: 'admin' }
  },
  {
    id: '2',
    shareType: ShareTypes.spaceUser.value,
    sharedWith: {
      onPremisesSamAccountName: 'Einstein',
      displayName: 'einstein'
    },
    role: mock<ShareRoleNG>({ id: GraphShareRoleIdMap.SpaceEditor }),
    permissions: [],
    resourceId: '1',
    indirect: false,
    sharedBy: { id: 'admin', displayName: 'admin' }
  },
  {
    id: '3',
    shareType: ShareTypes.spaceUser.value,
    sharedWith: {
      onPremisesSamAccountName: 'Marie',
      displayName: 'marie'
    },
    role: mock<ShareRoleNG>({ id: GraphShareRoleIdMap.SpaceViewer }),
    permissions: [],
    resourceId: '1',
    indirect: false,
    sharedBy: { id: 'admin', displayName: 'admin' }
  }
] as CollaboratorShare[]

describe('SpaceMembers', () => {
  describe('invite collaborator form', () => {
    it('renders the form when the current user can share', () => {
      const wrapper = getWrapper({ canShare: true })
      expect(wrapper.find('invite-collaborator-form-stub').exists()).toBeTruthy()
    })
    it('does not render the form when the current user can not share', () => {
      const wrapper = getWrapper({ canShare: false })
      expect(wrapper.find('invite-collaborator-form-stub').exists()).toBeFalsy()
    })
  })

  describe('existing members', () => {
    it('can edit when current user can share', () => {
      const wrapper = getWrapper({ canShare: true })
      expect(
        wrapper.findAllComponents<any>('collaborator-list-item-stub').at(1).props().modifiable
      ).toEqual(true)
    })
    it('can not edit when current user can not share', () => {
      const wrapper = getWrapper({ canShare: false })
      expect(
        wrapper.findAllComponents<any>('collaborator-list-item-stub').at(1).props().modifiable
      ).toEqual(false)
    })
    it('can not edit current user when they are the only space manager', () => {
      const wrapper = getWrapper({ spaceMembers: [memberMocks[0]], canShare: true })
      expect(
        wrapper.findAllComponents<any>('collaborator-list-item-stub').at(0).props().modifiable
      ).toEqual(false)
    })
  })

  describe('deleting members', () => {
    it('reacts on delete events by collaborator list items', async () => {
      const user = mock<User>({ id: 'admin' })
      const wrapper = getWrapper({ user })
      wrapper.findComponent<any>('collaborator-list-item-stub').vm.$emit('onDelete')
      await wrapper.vm.$nextTick()

      const { dispatchModal } = useModals()
      expect(dispatchModal).toHaveBeenCalledTimes(1)
    })
  })

  describe('filter', () => {
    it('toggles the filter on click', async () => {
      const space = mock<ProjectSpaceResource>({ isManager: () => true })
      const wrapper = getWrapper({ mountType: mount, space })
      expect(wrapper.vm.isFilterOpen).toBeFalsy()
      await wrapper.find('.open-filter-btn').trigger('click')
      expect(wrapper.vm.isFilterOpen).toBeTruthy()
    })
  })
})

function getWrapper({
  mountType = shallowMount,
  space = mock<SpaceResource>(),
  spaceMembers = memberMocks,
  user = mock<User>(),
  currentRouteName = 'files-spaces-generic',
  canShare = true
} = {}) {
  vi.mocked(useCanShare).mockReturnValue({ canShare: () => canShare })

  const mocks = defaultComponentMocks({
    currentRoute: mock<RouteLocation>({ name: currentRouteName })
  })
  return mountType(SpaceMembers, {
    global: {
      plugins: [
        ...defaultPlugins({
          piniaOptions: {
            userState: { user },
            spacesState: { spaceMembers },
            configState: {
              options: { contextHelpers: true, sidebar: { shares: { showAllOnLoad: true } } }
            }
          }
        })
      ],
      mocks,
      provide: {
        ...mocks,
        space,
        resource: space
      },
      stubs: {
        OcButton: false,
        'oc-icon': true,
        'oc-spinner': true,
        'avatar-image': true,
        'role-dropdown': true,
        'edit-dropdown': true,
        'invite-collaborator-form': true,
        'collaborator-list-item': true
      }
    }
  })
}
