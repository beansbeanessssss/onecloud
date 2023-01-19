import Users from '../../../src/views/Users.vue'
import { eventBus } from 'web-pkg/src/services/eventBus'
import { mock, mockDeep } from 'jest-mock-extended'
import { Graph } from 'web-client/src'
import { useLoadTasks } from '../../../src/composables/loadTasks/useLoadTasks'
import { Task } from 'vue-concurrency'
import { mockAxiosResolve, mockAxiosReject } from 'web-test-helpers/src/mocks'
import {
  createStore,
  defaultComponentMocks,
  defaultPlugins,
  defaultStoreMockOptions,
  shallowMount
} from 'web-test-helpers'
import { AxiosResponse } from 'axios'

const defaultGraphMock = () => {
  const defaultUser = {
    id: '1',
    memberOf: [],
    drive: {
      name: 'any'
    }
  }

  const graph = mockDeep<Graph>()
  graph.users.listUsers.mockResolvedValue(mock<AxiosResponse>({ data: { value: [defaultUser] } }))
  graph.users.getUser.mockResolvedValue(mock<AxiosResponse>({ data: defaultUser }))
  graph.groups.listGroups.mockResolvedValue(mock<AxiosResponse>({ data: { value: [] } }))

  return graph
}

jest.mock('../../../src/composables/loadTasks/useLoadTasks')
jest.mocked(useLoadTasks).mockImplementation(({ roles, userAssignments }) => {
  roles.value = []
  userAssignments.value = []

  return {
    loadRolesTask: mockDeep<Task<void, []>>(),
    loadUserRoleTask: mockDeep<Task<void, []>>(),
    addRoleAssignment: jest.fn()
  }
})

describe('Users view', () => {
  describe('method "createUser"', () => {
    it('should hide the modal and show message on success', async () => {
      const { wrapper } = getMountedWrapper()
      const showMessageStub = jest.spyOn(wrapper.vm, 'showMessage')
      const toggleCreateUserModalStub = jest.spyOn(wrapper.vm, 'toggleCreateUserModal')
      await wrapper.vm.createUser({ displayName: 'jan' })

      expect(showMessageStub).toHaveBeenCalled()
      expect(toggleCreateUserModalStub).toHaveBeenCalledTimes(1)
    })

    it('should show message on error', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => undefined)
      const graph = defaultGraphMock()
      graph.users.createUser.mockImplementation(() => mockAxiosReject())
      const { wrapper } = getMountedWrapper({ graph })
      const showMessageStub = jest.spyOn(wrapper.vm, 'showMessage')
      const toggleCreateUserModalStub = jest.spyOn(wrapper.vm, 'toggleCreateUserModal')
      await wrapper.vm.createUser({ displayName: 'jana' })

      expect(showMessageStub).toHaveBeenCalled()
      expect(toggleCreateUserModalStub).toHaveBeenCalledTimes(0)
    })
  })

  describe('method "editUser"', () => {
    it('should emit event on success', async () => {
      const editUser = {
        id: '1',
        displayName: 'jan',
        role: { id: '1', displayName: 'admin' },
        drive: { id: '1', quota: { total: 10000 } },
        passwordProfile: { password: 'newpassword' }
      }

      const graph = defaultGraphMock()
      graph.users.editUser.mockImplementation(() =>
        mockAxiosResolve({
          accountUuid: '1',
          id: '1',
          roleId: '1'
        })
      )
      graph.drives.updateDrive.mockImplementation(() => mockAxiosResolve({ name: 'any' }))
      const { wrapper } = getMountedWrapper({ graph })
      const busStub = jest.spyOn(eventBus, 'publish')
      const updateSpaceFieldStub = jest.spyOn(wrapper.vm, 'UPDATE_SPACE_FIELD')

      await wrapper.vm.loadResourcesTask.last
      await wrapper.vm.editUser(editUser)

      expect(wrapper.vm.selectedUsers[0]).toEqual(editUser)
      expect(busStub).toHaveBeenCalledWith('sidebar.entity.saved')
      expect(updateSpaceFieldStub).toHaveBeenCalled()
    })

    it('should show message on error', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => undefined)
      const graph = defaultGraphMock()
      graph.users.editUser.mockImplementation(() => mockAxiosReject())
      const { wrapper } = getMountedWrapper({ graph })
      const showMessageStub = jest.spyOn(wrapper.vm, 'showMessage')

      await wrapper.vm.loadResourcesTask.last
      await wrapper.vm.editUser({
        editUser: {}
      })

      expect(showMessageStub).toHaveBeenCalled()
    })
  })

  describe('method "editUserGroupAssignments"', () => {
    const editUser = {
      id: '1',
      memberOf: [
        {
          displayName: 'group',
          id: '04114ac6-f050-41d2-98db-6f016abccf2c'
        }
      ]
    }
    it('should emit event on success2', async () => {
      const { wrapper } = getMountedWrapper()
      const busStub = jest.spyOn(eventBus, 'publish')
      await wrapper.vm.loadResourcesTask.last
      await wrapper.vm.editUserGroupAssignments(editUser)

      expect(wrapper.vm.selectedUsers[0]).toEqual(editUser)
      expect(busStub).toHaveBeenCalledWith('sidebar.entity.saved')
    })

    it('should show message on error', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => undefined)

      const graph = defaultGraphMock()
      graph.groups.addMember.mockImplementation(() => mockAxiosReject())
      const { wrapper } = getMountedWrapper({ graph })
      const showMessageStub = jest
        .spyOn(wrapper.vm, 'showMessage')
        .mockImplementation(() => undefined)

      await wrapper.vm.loadResourcesTask.last
      await wrapper.vm.editUserGroupAssignments(editUser)

      expect(showMessageStub).toHaveBeenCalled()
    })
  })

  describe('method "deleteUsers"', () => {
    it('should hide the modal and show message on success', async () => {
      const { wrapper } = getMountedWrapper()
      const showMessageStub = jest.spyOn(wrapper.vm, 'showMessage')
      const toggleDeleteUserModalStub = jest.spyOn(wrapper.vm, 'toggleDeleteUserModal')
      await wrapper.vm.deleteUsers([{ id: '1' }])

      expect(showMessageStub).toHaveBeenCalled()
      expect(toggleDeleteUserModalStub).toHaveBeenCalledTimes(1)
    })
    it('should show message on error', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => undefined)
      const graph = defaultGraphMock()
      graph.users.deleteUser.mockImplementation(() => mockAxiosReject())
      const { wrapper } = getMountedWrapper({ graph })
      const graphDeleteUserStub = jest.spyOn(graph.users, 'deleteUser')
      const showMessageStub = jest.spyOn(wrapper.vm, 'showMessage')
      const toggleDeleteUserModalStub = jest.spyOn(wrapper.vm, 'toggleDeleteUserModal')
      await wrapper.vm.deleteUsers([{ id: '2' }])

      expect(graphDeleteUserStub).toHaveBeenCalledTimes(1)
      expect(showMessageStub).toHaveBeenCalled()
      expect(toggleDeleteUserModalStub).toHaveBeenCalledTimes(0)
    })
    it('should show message while user tries to delete own account', async () => {
      const { wrapper } = getMountedWrapper()
      const graph = defaultGraphMock()
      const graphDeleteUserStub = jest.spyOn(graph.users, 'deleteUser')
      const showMessageStub = jest.spyOn(wrapper.vm, 'showMessage')
      const toggleDeleteUserModalStub = jest.spyOn(wrapper.vm, 'toggleDeleteUserModal')
      await wrapper.vm.deleteUsers([{ id: '1' }])

      expect(graphDeleteUserStub).toHaveBeenCalledTimes(0)
      expect(showMessageStub).toHaveBeenCalled()
      expect(toggleDeleteUserModalStub).toHaveBeenCalled()
    })
  })

  describe('computed method "sideBarAvailablePanels"', () => {
    it('should contain EditPanel when one user is selected', () => {
      const { wrapper } = getMountedWrapper()
      wrapper.vm.selectedUsers = [{ id: '1' }]
      expect(
        wrapper.vm.sideBarAvailablePanels.find((panel) => panel.app === 'EditPanel').enabled
      ).toBeTruthy()
    })
    it('should contain DetailsPanel no user is selected', () => {
      const { wrapper } = getMountedWrapper()
      wrapper.vm.selectedUsers = []
      expect(
        wrapper.vm.sideBarAvailablePanels.find((panel) => panel.app === 'DetailsPanel').enabled
      ).toBeTruthy()
    })
    it('should not contain EditPanel when multiple users are selected', () => {
      const { wrapper } = getMountedWrapper()
      wrapper.vm.selectedUsers = [{ id: '1' }, { id: '2' }]
      expect(
        wrapper.vm.sideBarAvailablePanels.find((panel) => panel.app === 'EditPanel')
      ).toBeFalsy()
    })
  })

  describe('computed method "allUsersSelected"', () => {
    it('should be true if every user is selected', async () => {
      const { wrapper } = getMountedWrapper()
      wrapper.vm.selectedUsers = [{ id: '1' }]
      await wrapper.vm.loadResourcesTask.last
      expect(wrapper.vm.allUsersSelected).toBeTruthy()
    })
    it('should be false if not every user is selected', async () => {
      const graph = defaultGraphMock()
      graph.users.listUsers.mockImplementation(() =>
        mockAxiosResolve({ value: [{ id: '1' }, { id: '2' }] })
      )
      const { wrapper } = getMountedWrapper({ graph })
      wrapper.vm.selectedUsers = [{ id: '1' }]
      await wrapper.vm.loadResourcesTask.last
      expect(wrapper.vm.allUsersSelected).toBeFalsy()
    })
  })
})

function getMountedWrapper({ graph = defaultGraphMock() } = {}) {
  const mocks = {
    ...defaultComponentMocks()
  }
  mocks.$clientService.graphAuthenticated.mockImplementation(() => graph)

  const storeOptions = {
    ...defaultStoreMockOptions,
    state: {
      user: { id: '1', uuid: '1' }
    }
  }

  const store = createStore(storeOptions)

  return {
    mocks,
    wrapper: shallowMount(Users, {
      global: {
        plugins: [...defaultPlugins(), store],
        mocks
      }
    })
  }
}
