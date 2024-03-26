import AutocompleteItem from 'web-app-files/src/components/SideBar/Shares/Collaborators/InviteCollaborator/AutocompleteItem.vue'
import { ShareTypes } from '@ownclouders/web-client/src/helpers/share'
import { defaultPlugins, shallowMount } from 'web-test-helpers'

describe('AutocompleteItem component', () => {
  it.each(ShareTypes.all)('sets a class that reflects the share type', (shareType) => {
    const { wrapper } = createWrapper({ shareType: shareType.value })
    expect(wrapper.find('div').classes()).toContain(`files-collaborators-search-${shareType.key}`)
  })
  it.each(ShareTypes.all)(
    'displays the correct image/icon according to the shareType',
    (shareType) => {
      const { wrapper } = createWrapper({ shareType: shareType.value })
      const isUserShareType = [ShareTypes.user.key, ShareTypes.spaceUser.key].includes(
        shareType.key
      )
      if (isUserShareType) {
        expect(wrapper.find('avatar-image-stub').exists()).toBeTruthy()
        expect(wrapper.find('oc-avatar-item-stub').exists()).toBeFalsy()
      } else {
        expect(wrapper.find('avatar-image-stub').exists()).toBeFalsy()
        expect(wrapper.find('oc-avatar-item-stub').exists()).toBeTruthy()
        expect(wrapper.find('oc-avatar-item-stub').attributes().icon).toEqual(shareType.icon)
      }
    }
  )
  describe('avatar image', () => {
    it('sets the userId', () => {
      const { wrapper } = createWrapper({
        shareType: ShareTypes.user.value,
        id: 'the-user-id'
      })
      expect(wrapper.find('avatar-image-stub').attributes('userid')).toEqual('the-user-id')
    })
    it('sets the user-name', () => {
      const { wrapper } = createWrapper({
        shareType: ShareTypes.user.value,
        displayName: 'the-user-name'
      })
      expect(wrapper.find('avatar-image-stub').attributes('user-name')).toEqual('the-user-name')
    })
  })
  describe('autocomplete text', () => {
    it('shows the user name', () => {
      const { wrapper } = createWrapper({ displayName: 'Alice Hansen' })
      expect(wrapper.find('.files-collaborators-autocomplete-username').text()).toEqual(
        'Alice Hansen'
      )
    })
    it.each([
      ShareTypes.user.value,
      ShareTypes.spaceUser.value,
      ShareTypes.group.value,
      ShareTypes.spaceGroup.value
    ])('hides share type for users and groups', (shareType: number) => {
      const { wrapper } = createWrapper({ shareType })
      expect(wrapper.find('.files-collaborators-autocomplete-share-type').exists()).toBeFalsy()
    })
    it('shows share type for guests', () => {
      const { wrapper } = createWrapper({ shareType: ShareTypes.guest.value })
      expect(wrapper.find('.files-collaborators-autocomplete-share-type').text()).toEqual('(Guest)')
    })
  })
})

function createWrapper({ shareType = ShareTypes.user.value, id = '', displayName = '' } = {}) {
  return {
    wrapper: shallowMount(AutocompleteItem, {
      props: {
        item: { shareType, id, displayName }
      },
      global: {
        renderStubDefaultSlot: true,
        plugins: [...defaultPlugins()],
        stubs: { 'avatar-image': true }
      }
    })
  }
}
