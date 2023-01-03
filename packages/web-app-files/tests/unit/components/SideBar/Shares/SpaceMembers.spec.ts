import SpaceMembers from 'web-app-files/src/components/SideBar/Shares/SpaceMembers.vue'
import {
  spaceRoleManager,
  spaceRoleViewer,
  ShareTypes,
  spaceRoleEditor,
  Share
} from 'web-client/src/helpers/share'
import { mock } from 'jest-mock-extended'
import { ProjectSpaceResource, SpaceResource, User } from 'web-client/src/helpers'
import {
  createStore,
  defaultPlugins,
  mount,
  shallowMount,
  defaultStoreMockOptions,
  defaultComponentMocks
} from 'web-test-helpers'

const memberMocks = {
  [spaceRoleManager.name]: {
    id: '1',
    shareType: ShareTypes.space.value,
    collaborator: {
      name: 'alice',
      displayName: 'alice'
    },
    role: {
      name: spaceRoleManager.name
    }
  },
  [spaceRoleEditor.name]: {
    id: '2',
    shareType: ShareTypes.space.value,
    collaborator: {
      onPremisesSamAccountName: 'Einstein',
      displayName: 'einstein'
    },
    role: {
      name: spaceRoleEditor.name
    }
  },
  [spaceRoleViewer.name]: {
    id: '3',
    shareType: ShareTypes.space.value,
    collaborator: {
      onPremisesSamAccountName: 'Marie',
      displayName: 'marie'
    },
    role: {
      name: spaceRoleViewer.name
    }
  }
}

describe('SpaceMembers', () => {
  describe('invite collaborator form', () => {
    it('renders the form when the current user is a manager of the space', () => {
      const space = mock<ProjectSpaceResource>({ isManager: () => true })
      const wrapper = getWrapper({ space })
      expect(wrapper.find('invite-collaborator-form-stub').exists()).toBeTruthy()
      expect(wrapper.html()).toMatchSnapshot()
    })
    it('does not render the form when the current user is no manager of the space', () => {
      const space = mock<ProjectSpaceResource>({ isManager: () => false })
      const wrapper = getWrapper({ space })
      expect(wrapper.find('invite-collaborator-form-stub').exists()).toBeFalsy()
    })
  })

  describe('existing members', () => {
    it('can edit when current user is manager of the space', () => {
      const space = mock<ProjectSpaceResource>({ isManager: () => true })
      const wrapper = getWrapper({ space })
      expect(wrapper.findAll('collaborator-list-item-stub').at(1).props().modifiable).toEqual(true)
      expect(wrapper.html()).toMatchSnapshot()
    })
    it('can not edit when current user is not a manager of the space', () => {
      const space = mock<ProjectSpaceResource>({ isManager: () => false })
      const wrapper = getWrapper({ space })
      expect(wrapper.findAll('collaborator-list-item-stub').at(1).props().modifiable).toEqual(false)
    })
  })

  describe('deleting members', () => {
    it('reacts on delete events by collaborator list items', async () => {
      const spyOnCollaboratorDeleteTrigger = jest.spyOn(
        (SpaceMembers as any).methods,
        '$_ocCollaborators_deleteShare_trigger'
      )

      const user = mock<User>({ id: memberMocks.manager.collaborator.name })
      const wrapper = getWrapper({ user })
      wrapper.find('collaborator-list-item-stub').vm.$emit('onDelete')
      await wrapper.vm.$nextTick()
      expect(spyOnCollaboratorDeleteTrigger).toHaveBeenCalledTimes(1)
    })
    it('calls "deleteSpaceMember" when successful', async () => {
      const wrapper = getWrapper()
      const deleteSpaceMemberSpy = jest.spyOn(wrapper.vm, 'deleteSpaceMember')
      const share = mock<Share>()
      await wrapper.vm.$_ocCollaborators_deleteShare(share)
      expect(deleteSpaceMemberSpy).toHaveBeenCalled()
    })
    it('shows a message when an error occurs', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => undefined)
      const wrapper = getWrapper()
      jest.spyOn(wrapper.vm, 'deleteSpaceMember').mockRejectedValue(new Error())
      const showMessageSpy = jest.spyOn(wrapper.vm, 'showMessage')
      const share = mock<Share>()
      await wrapper.vm.$_ocCollaborators_deleteShare(share)
      expect(showMessageSpy).toHaveBeenCalled()
    })
    it('redirects to the "files-spaces-projects"-page when the current user has been removed', async () => {
      const user = mock<User>({ id: memberMocks.manager.collaborator.name })
      const wrapper = getWrapper({ user })
      jest.spyOn(wrapper.vm, 'deleteSpaceMember')
      await wrapper.vm.$_ocCollaborators_deleteShare(memberMocks.manager)
      expect(wrapper.vm.$router.push).toHaveBeenCalled()
    })
    it('refreshes the page when the current user has been removed on the "files-spaces-projects"-page', async () => {
      const user = mock<User>({ id: memberMocks.manager.collaborator.name })
      const wrapper = getWrapper({ user, currentRouteName: 'files-spaces-projects' })
      jest.spyOn(wrapper.vm, 'deleteSpaceMember')
      await wrapper.vm.$_ocCollaborators_deleteShare(memberMocks.manager)
      expect(wrapper.vm.$router.go).toHaveBeenCalled()
    })
  })

  describe('filter', () => {
    it('toggles the filter on click', async () => {
      const space = mock<ProjectSpaceResource>({ isManager: () => true })
      const wrapper = getWrapper({ mountType: mount, space })
      expect(wrapper.vm.isFilterOpen).toBeFalsy()
      await wrapper.find('.open-filter-btn').trigger('click')
      expect(wrapper.vm.isFilterOpen).toBeTruthy()
      expect(wrapper.html()).toMatchSnapshot()
    })
  })
})

function getWrapper({
  mountType = shallowMount,
  space = mock<SpaceResource>(),
  spaceMembers = [memberMocks.manager, memberMocks.editor, memberMocks.viewer],
  user = mock<User>(),
  currentRouteName = 'files-spaces-generic'
} = {}) {
  const storeOptions = {
    ...defaultStoreMockOptions,
    state: { user },
    getters: {
      ...defaultStoreMockOptions.getters,
      user: () => user,
      configuration: jest.fn(() => ({
        options: { contextHelpers: true, sidebar: { shares: { showAllOnLoad: true } } }
      }))
    }
  }
  storeOptions.modules.runtime.modules.spaces.getters.spaceMembers.mockImplementation(
    () => spaceMembers
  )
  storeOptions.modules.Files.getters.highlightedFile.mockImplementation(() => space)
  const store = createStore(storeOptions)
  return mountType(SpaceMembers, {
    props: {
      space
    },
    global: {
      plugins: [...defaultPlugins(), store],
      mocks: defaultComponentMocks({ currentRoute: { name: currentRouteName } }),
      provide: {
        displayedItem: space
      },
      stubs: {
        'oc-button': false,
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
