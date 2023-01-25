import UsersList from '../../../../src/components/Users/UsersList.vue'
import { defaultPlugins, shallowMount } from 'web-test-helpers'

describe('UsersList', () => {
  describe('computed method "allUsersSelected"', () => {
    it('should be true if all users are selected', () => {
      const { wrapper } = getWrapper({
        propsData: {
          users: [{ id: '1', displayName: 'jan' }],
          selectedUsers: [{ id: '1', displayName: 'jan' }]
        }
      })
      expect(wrapper.vm.allUsersSelected).toBeTruthy()
    })
    it('should be false if not every user is selected', () => {
      const { wrapper } = getWrapper({
        propsData: {
          users: [{ id: '1', displayName: 'jan' }],
          selectedUsers: []
        }
      })
      expect(wrapper.vm.allUsersSelected).toBeFalsy()
    })
  })

  describe('method "orderBy"', () => {
    it('should return an ascending ordered list while desc is set to false', () => {
      const { wrapper } = getWrapper()

      expect(
        wrapper.vm.orderBy(
          [{ displayName: 'user' }, { displayName: 'admin' }],
          'displayName',
          false
        )
      ).toEqual([{ displayName: 'admin' }, { displayName: 'user' }])
    })
    it('should return an descending ordered list based on role while desc is set to true', () => {
      const { wrapper } = getWrapper()

      expect(
        wrapper.vm.orderBy([{ displayName: 'admin' }, { displayName: 'user' }], 'displayName', true)
      ).toEqual([{ displayName: 'user' }, { displayName: 'admin' }])
    })

    it('should return ascending ordered list based on role while desc is set to false', () => {
      const { wrapper } = getWrapper()

      expect(
        wrapper.vm.orderBy(
          [
            { appRoleAssignments: [{ appRoleId: '1' }] },
            { appRoleAssignments: [{ appRoleId: '2' }] }
          ],
          'role',
          false
        )
      ).toEqual([
        { appRoleAssignments: [{ appRoleId: '1' }] },
        { appRoleAssignments: [{ appRoleId: '2' }] }
      ])
    })
    it('should return an role based descending ordered list while desc is set to true', () => {
      const { wrapper } = getWrapper()

      expect(
        wrapper.vm.orderBy(
          [
            { appRoleAssignments: [{ appRoleId: '1' }] },
            { appRoleAssignments: [{ appRoleId: '2' }] }
          ],
          'role',
          true
        )
      ).toEqual([
        { appRoleAssignments: [{ appRoleId: '2' }] },
        { appRoleAssignments: [{ appRoleId: '1' }] }
      ])
    })
  })

  describe('method "filter"', () => {
    it('should return a list containing record admin if search term is "ad"', () => {
      const { wrapper } = getWrapper()

      expect(wrapper.vm.filter([{ displayName: 'user' }, { displayName: 'admin' }], 'ad')).toEqual([
        { displayName: 'admin' }
      ])
    })
    it('should return an an empty list if search term does not match any entry', () => {
      const { wrapper } = getWrapper()

      expect(
        wrapper.vm.filter([{ displayName: 'admin' }, { displayName: 'user' }], 'jana')
      ).toEqual([])
    })
  })
})

function getWrapper({ propsData = {} } = {}) {
  return {
    wrapper: shallowMount(UsersList, {
      props: {
        users: [],
        selectedUsers: [],
        roles: [
          {
            displayName: 'Admin',
            id: '1'
          },
          {
            displayName: 'Guest',
            id: '2'
          },
          {
            displayName: 'Space Admin',
            id: '3'
          },
          {
            displayName: 'User',
            id: '4'
          }
        ],
        headerPosition: 0,
        ...propsData
      },
      global: {
        plugins: [...defaultPlugins()]
      }
    })
  }
}
