import CreateSpace from '../../../../src/components/AppBar/CreateSpace.vue'
import { mockDeep } from 'jest-mock-extended'
import { Graph, Resource } from 'web-client'
import { Drive } from 'web-client/src/generated'
import {
  createStore,
  defaultPlugins,
  mount,
  defaultStoreMockOptions,
  defaultComponentMocks
} from 'web-test-helpers'

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
    const { wrapper, storeOptions } = getWrapper()
    await wrapper.find(selectors.newSpaceBtn).trigger('click')
    expect(storeOptions.actions.createModal).toHaveBeenCalledTimes(1)
  })
  describe('method "checkSpaceName"', () => {
    it('should not show an error message with a valid space name', () => {
      const { wrapper } = getWrapper()
      const spyInputErrorMessageStub = jest.spyOn(wrapper.vm, 'setModalInputErrorMessage')
      wrapper.vm.checkSpaceName('Space')
      expect(spyInputErrorMessageStub).toHaveBeenCalledWith(null)
    })
    it('should show an error message with an empty name', () => {
      const { wrapper } = getWrapper()
      const spyInputErrorMessageStub = jest.spyOn(wrapper.vm, 'setModalInputErrorMessage')
      wrapper.vm.checkSpaceName('')
      expect(spyInputErrorMessageStub).not.toHaveBeenCalledWith(null)
    })
    it('should show an error with an name longer than 255 characters', () => {
      const { wrapper } = getWrapper()
      const spyInputErrorMessageStub = jest.spyOn(wrapper.vm, 'setModalInputErrorMessage')
      wrapper.vm.checkSpaceName('n'.repeat(256))
      expect(spyInputErrorMessageStub).not.toHaveBeenCalledWith(null)
    })
    it.each(['/', '\\', '.', ':', '?', '*', '"', '>', '<', '|'])(
      'should show an error message with a name including a special character',
      (specialChar) => {
        const { wrapper } = getWrapper()
        const spyInputErrorMessageStub = jest.spyOn(wrapper.vm, 'setModalInputErrorMessage')
        wrapper.vm.checkSpaceName(specialChar)
        expect(spyInputErrorMessageStub).not.toHaveBeenCalledWith(null)
      }
    )
  })
  describe('method "addNewSpace"', () => {
    it('creates the space and updates the readme data after creation', async () => {
      const { wrapper, mocks, storeOptions } = getWrapper()
      const graphMock = mockDeep<Graph>()
      const drive = mockDeep<Drive>()
      graphMock.drives.createDrive.mockResolvedValue(drive as any)
      graphMock.drives.updateDrive.mockResolvedValue(drive as any)
      mocks.$clientService.graphAuthenticated.mockImplementation(() => graphMock)
      mocks.$clientService.webdav.putFileContents.mockResolvedValue(mockDeep<Resource>())
      await wrapper.vm.addNewSpace('New space')
      expect(storeOptions.modules.runtime.modules.spaces.mutations.UPSERT_SPACE).toHaveBeenCalled()
      expect(storeOptions.modules.Files.mutations.UPDATE_RESOURCE_FIELD).toHaveBeenCalled()
    })
    it('shows a message when an error occurred', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => undefined)
      const { wrapper, mocks, storeOptions } = getWrapper()
      const graphMock = mockDeep<Graph>()
      graphMock.drives.createDrive.mockRejectedValue({})
      mocks.$clientService.graphAuthenticated.mockImplementation(() => graphMock)
      await wrapper.vm.addNewSpace('New space')
      expect(storeOptions.actions.showMessage).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          status: 'danger',
          title: 'Creating space failed…'
        })
      )
    })
  })
})

function getWrapper() {
  const storeOptions = { ...defaultStoreMockOptions }
  const store = createStore(storeOptions)
  const mocks = defaultComponentMocks()
  return {
    storeOptions,
    mocks,
    wrapper: mount(CreateSpace, {
      global: {
        mocks,
        plugins: [...defaultPlugins(), store]
      }
    })
  }
}
