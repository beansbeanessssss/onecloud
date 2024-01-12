import { mock } from 'jest-mock-extended'
import { Resource } from '@ownclouders/web-client'
import { defaultPlugins, mount } from 'web-test-helpers'
import PrivateLinkItem from 'web-app-files/src/components/SideBar/PrivateLinkItem.vue'
import { useMessages } from '@ownclouders/web-pkg'

jest.useFakeTimers()

const folder = mock<Resource>({
  type: 'folder',
  ownerId: 'marie',
  ownerDisplayName: 'Marie',
  mdate: 'Wed, 21 Oct 2015 07:28:00 GMT',
  size: '740',
  name: 'lorem.txt',
  privateLink: 'https://example.com/fake-private-link'
})

describe('PrivateLinkItem', () => {
  it('should render a button', () => {
    const { wrapper } = getWrapper()
    expect(wrapper.html()).toMatchSnapshot()
  })
  it('upon clicking it should copy the private link to the clipboard button, render a success message and change icon for half a second', async () => {
    Object.assign(window.navigator, {
      clipboard: {
        writeText: jest.fn().mockImplementation(() => Promise.resolve())
      }
    })

    const { wrapper } = getWrapper()
    const { showMessage } = useMessages()
    expect(showMessage).not.toHaveBeenCalled()

    await wrapper.trigger('click')
    expect(wrapper.html()).toMatchSnapshot()
    expect(window.navigator.clipboard.writeText).toHaveBeenCalledWith(folder.privateLink)
    expect(showMessage).toHaveBeenCalledTimes(1)

    jest.advanceTimersByTime(550)

    wrapper.vm.$nextTick(() => {
      expect(wrapper.html()).toMatchSnapshot()
    })
  })
})

function getWrapper() {
  const capabilities = { files: { privateLinks: true } }

  return {
    wrapper: mount(PrivateLinkItem, {
      global: {
        plugins: [...defaultPlugins({ piniaOptions: { capabilityState: { capabilities } } })],
        provide: {
          resource: folder
        }
      }
    })
  }
}
