import CreateSpace from '../../../../src/components/AppBar/CreateSpace.vue'
import { mockDeep } from 'vitest-mock-extended'
import { Resource } from '@ownclouders/web-client'
import { Drive } from '@ownclouders/web-client/graph/generated'
import { defaultPlugins, mount, defaultComponentMocks, mockAxiosResolve } from 'web-test-helpers'
import { useMessages, useModals, useSpacesStore } from '@ownclouders/web-pkg'
import { unref } from 'vue'

const selectors = {
  newSpaceBtn: '#new-space-menu-btn'
}

describe('CreateSpace component', () => {
  it('should show the "New Space" button', () => {
    const { wrapper } = getWrapper()
    expect(wrapper.find(selectors.newSpaceBtn).exists()).toBeTruthy()
    expect(wrapper.html()).toMatchSnapshot()
  })
  it('should show a modal when clicking the "New Space" button', async () => {
    const { wrapper } = getWrapper()
    const { dispatchModal } = useModals()
    await wrapper.find(selectors.newSpaceBtn).trigger('click')
    expect(dispatchModal).toHaveBeenCalledTimes(1)
  })
  describe('method "addNewSpace"', () => {
    it('creates the space and updates the readme data after creation', async () => {
      const { wrapper, mocks } = getWrapper()
      const { modals } = useModals()
      await wrapper.find(selectors.newSpaceBtn).trigger('click')

      const graphMock = mocks.$clientService.graphAuthenticated
      const drive = mockDeep<Drive>()
      graphMock.drives.createDrive.mockResolvedValue(mockAxiosResolve(drive))
      graphMock.drives.updateDrive.mockResolvedValue(mockAxiosResolve(drive))
      mocks.$clientService.webdav.putFileContents.mockResolvedValue(mockDeep<Resource>())
      await unref(modals)[0].onConfirm('New Space')

      const spacesStore = useSpacesStore()
      expect(spacesStore.upsertSpace).toHaveBeenCalled()
    })
    it('shows a message when an error occurred', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => undefined)
      const { wrapper, mocks } = getWrapper()
      const { modals } = useModals()
      await wrapper.find(selectors.newSpaceBtn).trigger('click')

      const graphMock = mocks.$clientService.graphAuthenticated
      graphMock.drives.createDrive.mockRejectedValue({})
      await unref(modals)[0].onConfirm('New Space')

      const { showErrorMessage } = useMessages()
      expect(showErrorMessage).toHaveBeenCalled()
    })
  })
})

function getWrapper() {
  const mocks = defaultComponentMocks()
  return {
    mocks,
    wrapper: mount(CreateSpace, {
      global: {
        mocks,
        provide: mocks,
        plugins: [...defaultPlugins({ piniaOptions: { stubActions: false } })]
      }
    })
  }
}
