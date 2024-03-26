import ListItem from '../../../../../../src/components/SideBar/Shares/Collaborators/ListItem.vue'
import {
  CollaboratorShare,
  GraphSharePermission,
  ShareRoleNG,
  ShareTypes
} from '@ownclouders/web-client/src/helpers/share'
import {
  defaultPlugins,
  mount,
  defaultStubs,
  defaultComponentMocks,
  nextTicks,
  mockAxiosResolve
} from 'web-test-helpers'
import { useMessages, useSharesStore, useSpacesStore } from '@ownclouders/web-pkg'
import EditDropdown from '../../../../../../src/components/SideBar/Shares/Collaborators/EditDropdown.vue'
import RoleDropdown from '../../../../../../src/components/SideBar/Shares/Collaborators/RoleDropdown.vue'
import { mock } from 'vitest-mock-extended'
import { Resource, SpaceResource } from '@ownclouders/web-client'

vi.mock('@ownclouders/web-client/src/helpers/space/functions', () => ({
  buildSpace: vi.fn((space) => space)
}))

vi.mock('uuid', () => ({
  v4: () => {
    return '00000000-0000-0000-0000-000000000000'
  }
}))

const selectors = {
  userAvatarImage: 'avatar-image-stub.files-collaborators-collaborator-indicator',
  notUserAvatar: 'oc-avatar-item-stub.files-collaborators-collaborator-indicator',
  collaboratorAdditionalInfo: '.files-collaborators-collaborator-additional-info',
  collaboratorName: '.files-collaborators-collaborator-name',
  accessDetailsButton: '.files-collaborators-collaborator-access-details-button',
  collaboratorRole: '.files-collaborators-collaborator-role',
  collaboratorEdit: '.files-collaborators-collaborator-edit',
  shareInheritanceIndicators: '.oc-resource-indicators',
  expirationDateIcon: '[data-testid="recipient-info-expiration-date"]'
}

const getShareMock = ({
  sharedWith,
  shareType,
  expirationDateTime
}: Partial<CollaboratorShare> = {}): CollaboratorShare => ({
  id: '1',
  sharedWith: sharedWith || { id: '3', displayName: 'einstein' },
  sharedBy: { id: '2', displayName: 'marie' },
  permissions: [],
  shareType: shareType || ShareTypes.user.value,
  role: mock<ShareRoleNG>({ description: '', displayName: '' }),
  resourceId: '1',
  indirect: false,
  expirationDateTime: expirationDateTime || ''
})

describe('Collaborator ListItem component', () => {
  describe('displays the correct image/icon according to the shareType', () => {
    describe('user and spaceUser share type', () => {
      it.each([ShareTypes.user.value, ShareTypes.spaceUser.value])(
        'should display a users avatar',
        (shareType) => {
          const { wrapper } = createWrapper({ share: getShareMock({ shareType }) })
          expect(wrapper.find(selectors.userAvatarImage).exists()).toBeTruthy()
          expect(wrapper.find(selectors.notUserAvatar).exists()).toBeFalsy()
        }
      )
      it('sets user info on the avatar', () => {
        const share = getShareMock()
        const { wrapper } = createWrapper({ share })
        expect(wrapper.find(selectors.userAvatarImage).attributes('userid')).toEqual(
          share.sharedWith.id
        )
        expect(wrapper.find(selectors.userAvatarImage).attributes('user-name')).toEqual(
          share.sharedWith.displayName
        )
      })
    })
    describe('non-user share types', () => {
      it.each(
        ShareTypes.all.filter(
          (shareType) => ![ShareTypes.user, ShareTypes.spaceUser].includes(shareType)
        )
      )('should display an oc-avatar-item for any non-user share types', (shareType) => {
        const { wrapper } = createWrapper({ share: getShareMock({ shareType: shareType.value }) })
        expect(wrapper.find(selectors.userAvatarImage).exists()).toBeFalsy()
        expect(wrapper.find(selectors.notUserAvatar).exists()).toBeTruthy()
        expect(wrapper.find(selectors.notUserAvatar).attributes().name).toEqual(shareType.key)
      })
      it('should display an oc-avatar-item for space group shares', () => {
        const { wrapper } = createWrapper({
          share: getShareMock({
            shareType: ShareTypes.spaceGroup.value,
            sharedWith: { id: '1', displayName: 'someGroup' }
          })
        })
        expect(wrapper.find(selectors.userAvatarImage).exists()).toBeFalsy()
        expect(wrapper.find(selectors.notUserAvatar).exists()).toBeTruthy()
      })
    })
  })
  describe('share info', () => {
    it('shows the collaborator display name', () => {
      const share = getShareMock()
      const { wrapper } = createWrapper({ share })
      expect(wrapper.find(selectors.collaboratorName).text()).toEqual(share.sharedWith.displayName)
    })
    it('shows the share expiration date if given', () => {
      const { wrapper } = createWrapper({
        share: getShareMock({ expirationDateTime: '2000-01-01' })
      })
      expect(wrapper.find(selectors.expirationDateIcon).exists()).toBeTruthy()
    })
  })
  describe('modifiable property', () => {
    it('shows interactive elements when modifiable', () => {
      const { wrapper } = createWrapper({ modifiable: true })
      expect(wrapper.find(selectors.collaboratorRole).exists()).toBeTruthy()
    })
    it('hides interactive elements when not modifiable', () => {
      const { wrapper } = createWrapper({ modifiable: false })
      expect(wrapper.find(selectors.collaboratorRole).exists()).toBeFalsy()
    })
  })
  describe('share inheritance indicators', () => {
    it('show when sharedParentRoute is given', () => {
      const { wrapper } = createWrapper({
        sharedParentRoute: { params: { driveAliasAndItem: '/folder' } }
      })
      expect(wrapper.find(selectors.shareInheritanceIndicators).exists()).toBeTruthy()
      expect(wrapper.html()).toMatchSnapshot()
    })
    it('do not show when sharedParentRoute is not given', () => {
      const { wrapper } = createWrapper()
      expect(wrapper.find(selectors.shareInheritanceIndicators).exists()).toBeFalsy()
    })
  })
  describe('remove share', () => {
    it('emits the "removeShare" event', () => {
      const { wrapper } = createWrapper()
      wrapper.findComponent<typeof EditDropdown>('edit-dropdown-stub').vm.$emit('removeShare')
      expect(wrapper.emitted().onDelete).toBeTruthy()
    })
  })
  describe('change share role', () => {
    it('calls "changeShare" for regular resources', () => {
      const { wrapper } = createWrapper()
      wrapper.findComponent<typeof RoleDropdown>('role-dropdown-stub').vm.$emit('optionChange', {
        permissions: [GraphSharePermission.readBasic]
      })
      const sharesStore = useSharesStore()
      expect(sharesStore.updateShare).toHaveBeenCalled()
    })
    it('calls "upsertSpaceMember" for space resources', async () => {
      const resource = mock<SpaceResource>({ driveType: 'project' })
      const { wrapper } = createWrapper({
        share: getShareMock({ shareType: ShareTypes.spaceUser.value }),
        resource
      })
      wrapper.findComponent<typeof RoleDropdown>('role-dropdown-stub').vm.$emit('optionChange', {
        permissions: [GraphSharePermission.readBasic]
      })

      await nextTicks(4)

      const spacesStore = useSpacesStore()
      expect(spacesStore.upsertSpaceMember).toHaveBeenCalled()
    })
    it('shows a message on error', async () => {
      const resource = mock<SpaceResource>({ driveType: 'project' })
      vi.spyOn(console, 'error').mockImplementation(() => undefined)
      const { wrapper } = createWrapper()
      vi.spyOn(wrapper.vm, 'saveShareChanges').mockImplementation(() => {
        throw new Error()
      })
      wrapper.findComponent<typeof RoleDropdown>('role-dropdown-stub').vm.$emit('optionChange', {
        share: getShareMock({ shareType: ShareTypes.spaceUser.value }),
        resource
      })

      await nextTicks(4)

      const sharesStore = useSharesStore()
      expect(sharesStore.updateShare).not.toHaveBeenCalled()
      const messagesStore = useMessages()
      expect(messagesStore.showErrorMessage).toHaveBeenCalled()
    })
  })
  describe('change expiration date', () => {
    it('calls "changeShare" for regular resources', () => {
      const { wrapper } = createWrapper()
      wrapper
        .findComponent<typeof EditDropdown>('edit-dropdown-stub')
        .vm.$emit('expirationDateChanged', {
          shareExpirationChanged: new Date()
        })
      const sharesStore = useSharesStore()
      expect(sharesStore.updateShare).toHaveBeenCalled()
    })
    it('shows a message on error', () => {
      vi.spyOn(console, 'error').mockImplementation(() => undefined)
      const { wrapper } = createWrapper()
      vi.spyOn(wrapper.vm, 'saveShareChanges').mockImplementation(() => {
        throw new Error()
      })
      wrapper
        .findComponent<typeof EditDropdown>('edit-dropdown-stub')
        .vm.$emit('expirationDateChanged', {
          shareExpirationChanged: new Date()
        })
      const sharesStore = useSharesStore()
      expect(sharesStore.updateShare).not.toHaveBeenCalled()
      const messagesStore = useMessages()
      expect(messagesStore.showErrorMessage).toHaveBeenCalled()
    })
  })
})

function createWrapper({
  share = getShareMock(),
  modifiable = true,
  sharedParentRoute = null,
  resource = mock<Resource>()
} = {}) {
  const mocks = defaultComponentMocks()
  mocks.$clientService.graphAuthenticated.drives.getDrive.mockResolvedValue(
    mockAxiosResolve(undefined)
  )

  return {
    wrapper: mount(ListItem, {
      props: {
        share,
        modifiable,
        sharedParentRoute
      },
      global: {
        plugins: [...defaultPlugins()],
        mocks,
        provide: { ...mocks, resource },
        renderStubDefaultSlot: true,
        stubs: {
          ...defaultStubs,
          'oc-icon': true,
          'avatar-image': true,
          'router-link': true,
          'oc-info-drop': true,
          'oc-table-simple': true,
          'oc-tr': true,
          'oc-td': true,
          'oc-tag': true,
          'oc-pagination': true,
          'oc-avatar-item': true,
          'role-dropdown': true,
          'edit-dropdown': true,
          translate: false
        }
      }
    })
  }
}
