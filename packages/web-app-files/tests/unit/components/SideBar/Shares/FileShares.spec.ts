import FileShares from 'web-app-files/src/components/SideBar/Shares/FileShares.vue'
import { mockDeep } from 'jest-mock-extended'
import { Resource } from 'web-client'
import { SpaceResource } from 'web-client/src/helpers'
import { v4 as uuidV4 } from 'uuid'
import { Share, ShareTypes } from 'web-client/src/helpers/share'
import {
  createStore,
  defaultPlugins,
  mount,
  shallowMount,
  defaultStoreMockOptions,
  defaultComponentMocks,
  defaultStubs
} from 'web-test-helpers'

const getCollaborator = () => ({
  shareType: 0,
  id: uuidV4(),
  collaborator: {
    name: 'einstein',
    displayName: 'Albert Einstein',
    additionalInfo: 'einstein@example.org'
  },
  owner: {
    name: 'admin',
    displayName: 'Admin',
    additionalInfo: 'admin@example.org'
  },
  fileOwner: {
    name: 'admin',
    displayName: 'Admin',
    additionalInfo: 'admin@example.org'
  },
  file: {},
  stime: '1639152810',
  permissions: 15,
  path: "/Neuer Ordner-'singe'",
  key: 'collaborator-f5c28709-b921-4ec8-b39a-4c243709b514'
})

describe('FileShares', () => {
  describe('invite collaborator form', () => {
    it('renders the form when the resource can be shared', () => {
      const resource = mockDeep<Resource>({ isReceivedShare: () => false, canShare: () => true })
      const { wrapper } = getWrapper({ resource })
      expect(wrapper.find('invite-collaborator-form-stub').exists()).toBeTruthy()
    })
    it('does not render the form when the resource can not be shared', () => {
      const resource = mockDeep<Resource>({ isReceivedShare: () => false, canShare: () => false })
      const { wrapper } = getWrapper({ resource })
      expect(wrapper.find('invite-collaborator-form-stub').exists()).toBeFalsy()
    })
    it('does render the form when the resource is a received share and re-sharing is enabled', () => {
      const resource = mockDeep<Resource>({ isReceivedShare: () => true, canShare: () => true })
      const { wrapper } = getWrapper({ resource })
      expect(wrapper.find('invite-collaborator-form-stub').exists()).toBeTruthy()
    })
    it('does not render the form when the resource is a received share and re-sharing is disabled', () => {
      const resource = mockDeep<Resource>({ isReceivedShare: () => true, canShare: () => true })
      const { wrapper } = getWrapper({ resource, hasReSharing: false })
      expect(wrapper.find('invite-collaborator-form-stub').exists()).toBeFalsy()
    })
  })

  describe('collaborators list', () => {
    const collaborators = [
      getCollaborator(),
      getCollaborator(),
      getCollaborator(),
      getCollaborator()
    ]

    it('renders sharedWithLabel and sharee list', () => {
      const { wrapper } = getWrapper({ collaborators })
      expect(wrapper.find('#files-collaborators-list').exists()).toBeTruthy()
      expect(wrapper.findAll('#files-collaborators-list li').length).toBe(collaborators.length)
      expect(wrapper.html()).toMatchSnapshot()
    })
    it('reacts on delete events', async () => {
      const spyOnCollaboratorDeleteTrigger = jest
        .spyOn((FileShares as any).methods, '$_ocCollaborators_deleteShare_trigger')
        .mockImplementation()
      const { wrapper } = getWrapper({ collaborators })
      wrapper.find('collaborator-list-item-stub').vm.$emit('onDelete')
      await wrapper.vm.$nextTick()
      expect(spyOnCollaboratorDeleteTrigger).toHaveBeenCalledTimes(1)
    })
    it('correctly passes the shared parent route to the collaborator list item', () => {
      const indirectCollaborator = { ...getCollaborator(), indirect: true }
      const sharesTree = { [indirectCollaborator.path]: {} }
      const { wrapper } = getWrapper({ collaborators: [indirectCollaborator], sharesTree })
      expect(wrapper.find('collaborator-list-item-stub').props().sharedParentRoute).toBeDefined()
      expect(wrapper.html()).toMatchSnapshot()
    })
    it('lists indirect outgoing shares', () => {
      const parentPath = '/parent'
      const resource = mockDeep<Resource>({ path: `${parentPath}/child` })
      const sharesTree = {
        [parentPath]: [
          mockDeep<Share>({
            outgoing: true,
            shareType: ShareTypes.user.value,
            ...getCollaborator()
          })
        ]
      }
      const { wrapper } = getWrapper({ sharesTree, resource })
      expect(wrapper.find('collaborator-list-item-stub').props().sharedParentRoute).toBeDefined()
    })
    it('toggles the share list', async () => {
      const showAllOnLoad = true
      const { wrapper } = getWrapper({ mountType: mount, collaborators })
      expect(wrapper.vm.sharesListCollapsed).toBe(!showAllOnLoad)
      await wrapper.find('.toggle-shares-list-btn').trigger('click')
      expect(wrapper.vm.sharesListCollapsed).toBe(showAllOnLoad)
    })
  })

  describe('current space', () => {
    it('loads space members if a space is given and the current user is member', () => {
      const user = { id: '1' }
      const space = mockDeep<SpaceResource>({ driveType: 'project' })
      const spaceMembers = [{ collaborator: { name: user.id } }, { collaborator: { name: '2' } }]
      const collaborator = getCollaborator()
      collaborator.collaborator = { ...collaborator.collaborator, name: user.id }
      const { wrapper } = getWrapper({ space, collaborators: [collaborator], user, spaceMembers })
      expect(wrapper.find('#space-collaborators-list').exists()).toBeTruthy()
      expect(wrapper.findAll('#space-collaborators-list li').length).toBe(spaceMembers.length)
      expect(wrapper.html()).toMatchSnapshot()
    })
    it('does not load space members if a space is given but the current user not a member', () => {
      const user = { id: '1' }
      const space = mockDeep<SpaceResource>({ driveType: 'project' })
      const spaceMembers = [{ collaborator: { name: `${user}-2` } }]
      const collaborator = getCollaborator()
      collaborator.collaborator = { ...collaborator.collaborator, name: user.id }
      const { wrapper } = getWrapper({ space, collaborators: [collaborator], user, spaceMembers })
      expect(wrapper.find('#space-collaborators-list').exists()).toBeFalsy()
    })
  })

  describe('"$_ocCollaborators_deleteShare" method', () => {
    it('calls "deleteShare" when successful', async () => {
      const { wrapper } = getWrapper()
      const deleteShareSpy = jest.spyOn(wrapper.vm, 'deleteShare')
      const share = mockDeep<Share>()
      await wrapper.vm.$_ocCollaborators_deleteShare(share)
      expect(deleteShareSpy).toHaveBeenCalled()
    })
    it('shows a message when an error occurs', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => undefined)
      const { wrapper } = getWrapper()
      jest.spyOn(wrapper.vm, 'deleteShare').mockRejectedValue(new Error())
      const showMessageSpy = jest.spyOn(wrapper.vm, 'showMessage')
      const share = mockDeep<Share>()
      await wrapper.vm.$_ocCollaborators_deleteShare(share)
      expect(showMessageSpy).toHaveBeenCalled()
    })
    it('removes file when the last share on the "Shared with others"-page has been removed', async () => {
      const { wrapper } = getWrapper({
        collaborators: [getCollaborator()],
        currentRouteName: 'files-shares-with-others'
      })
      const deleteShareSpy = jest.spyOn(wrapper.vm, 'deleteShare')
      const removeFilesSpy = jest.spyOn(wrapper.vm, 'REMOVE_FILES')
      const share = mockDeep<Share>()
      await wrapper.vm.$_ocCollaborators_deleteShare(share)
      expect(deleteShareSpy).toHaveBeenCalled()
      expect(removeFilesSpy).toHaveBeenCalled()
    })
  })
})

function getWrapper({
  mountType = shallowMount,
  resource = mockDeep<Resource>({ isReceivedShare: () => false, canShare: () => true }),
  hasReSharing = true,
  space = mockDeep<SpaceResource>(),
  collaborators = [],
  sharesTree = {},
  spaceMembers = [],
  user = { id: '1' },
  showAllOnLoad = true,
  currentRouteName = 'files-spaces-generic'
} = {}) {
  const storeOptions = {
    ...defaultStoreMockOptions,
    state: { user },
    getters: {
      ...defaultStoreMockOptions.getters,
      user: () => user,
      capabilities: jest.fn(() => ({
        files_sharing: { resharing: hasReSharing }
      })),
      configuration: jest.fn(() => ({
        options: { contextHelpers: true, sidebar: { shares: { showAllOnLoad } } }
      }))
    }
  }
  storeOptions.modules.Files.state.sharesTree = sharesTree
  storeOptions.modules.runtime.modules.spaces.getters.spaceMembers.mockImplementation(
    () => spaceMembers
  )
  storeOptions.modules.Files.getters.highlightedFile.mockImplementation(() => resource)
  storeOptions.modules.Files.getters.currentFileOutgoingCollaborators.mockImplementation(
    () => collaborators
  )
  const store = createStore(storeOptions)
  return {
    wrapper: mountType(FileShares, {
      props: { space },
      global: {
        plugins: [...defaultPlugins(), store],
        mocks: defaultComponentMocks({ currentRoute: { name: currentRouteName } }),
        provide: {
          incomingParentShare: {}
        },
        stubs: {
          ...defaultStubs,
          'oc-button': false,
          'invite-collaborator-form': true,
          'collaborator-list-item': true
        }
      }
    })
  }
}
