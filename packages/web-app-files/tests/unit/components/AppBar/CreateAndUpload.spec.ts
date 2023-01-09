import CreateAndUpload from 'web-app-files/src/components/AppBar/CreateAndUpload.vue'
import { mock, mockDeep } from 'jest-mock-extended'
import { Resource, SpaceResource } from 'web-client/src/helpers'
import { UppyResource } from 'web-runtime/src/composables/upload'
import { Graph } from 'web-client'
import { Drive } from 'web-client/src/generated'
import { eventBus, useRequest } from 'web-pkg'
import {
  createStore,
  defaultPlugins,
  shallowMount,
  defaultStoreMockOptions,
  defaultComponentMocks
} from 'web-test-helpers'

jest.mock('web-pkg/src/composables/authContext')

const elSelector = {
  component: '#create-and-upload-actions',
  newFileButton: '#new-file-menu-btn',
  uploadBtn: '#upload-menu-btn',
  resourceUpload: 'resource-upload-stub',
  newFolderBtn: '#new-folder-btn',
  clipboardBtns: '#clipboard-btns',
  pasteFilesBtn: '.paste-files-btn',
  clearClipboardBtn: '.clear-clipboard-btn'
}

const fileHandlerMocks = [
  {
    ext: 'txt',
    action: {
      app: 'text-editor',
      newTab: false,
      extension: 'txt'
    },
    menuTitle: () => 'Plain text file'
  },
  {
    ext: 'md',
    action: {
      app: 'text-editor',
      newTab: false,
      extension: 'md'
    },
    menuTitle: () => 'Mark-down file'
  },
  {
    ext: 'drawio',
    action: {
      app: 'draw-io',
      newTab: true,
      routeName: 'draw-io-edit',
      extension: 'drawio'
    },
    menuTitle: () => 'Draw.io document'
  }
]

describe('CreateAndUpload component', () => {
  describe('action buttons', () => {
    it('should show and be enabled if file creation is possible', () => {
      const { wrapper } = getWrapper()
      expect(wrapper.findComponent<any>(elSelector.uploadBtn).props().disabled).toBeFalsy()
      expect(wrapper.findComponent<any>(elSelector.newFolderBtn).props().disabled).toBeFalsy()
      expect(wrapper.html()).toMatchSnapshot()
    })
    it('should be disabled if file creation is not possible', () => {
      const currentFolder = mockDeep<Resource>({ canUpload: () => false })
      const { wrapper } = getWrapper({ currentFolder })
      expect(wrapper.findComponent<any>(elSelector.uploadBtn).props().disabled).toBeTruthy()
      expect(wrapper.findComponent<any>(elSelector.newFolderBtn).props().disabled).toBeTruthy()
    })
    it('should not be visible if file creation is not possible on a public page', () => {
      const currentFolder = mockDeep<Resource>({ canUpload: () => false })
      const { wrapper } = getWrapper({ currentFolder, currentRouteName: 'files-public-link' })
      expect(wrapper.find(elSelector.component).exists()).toBeFalsy()
    })
  })
  describe('file handlers', () => {
    it('should always show for uploading files and folders', () => {
      const { wrapper } = getWrapper()
      expect(wrapper.findAll(elSelector.resourceUpload).length).toBe(2)
    })
    it('should show additional handlers', () => {
      const { wrapper } = getWrapper({ newFileHandlers: fileHandlerMocks })
      expect(wrapper.html()).toMatchSnapshot()
    })
  })
  describe('clipboard buttons', () => {
    it('should show if clipboard is empty', () => {
      const { wrapper } = getWrapper()
      expect(
        wrapper.findComponent<any>(`${elSelector.clipboardBtns} oc-button-stub`).exists()
      ).toBeFalsy()
    })
    it('should show if clipboard is not empty', () => {
      const { wrapper } = getWrapper({ clipboardResources: [mockDeep<Resource>()] })
      expect(wrapper.findAll(`${elSelector.clipboardBtns} .oc-button`).length).toBe(2)
    })
    it('call the "paste files"-action', async () => {
      const { wrapper, storeOptions } = getWrapper({ clipboardResources: [mockDeep<Resource>()] })
      await wrapper.find(elSelector.pasteFilesBtn).trigger('click')
      expect(storeOptions.modules.Files.actions.pasteSelectedFiles).toHaveBeenCalled()
    })
    it('call "clear clipboard"-action', async () => {
      const { wrapper, storeOptions } = getWrapper({ clipboardResources: [mockDeep<Resource>()] })
      await wrapper.find(elSelector.clearClipboardBtn).trigger('click')
      expect(storeOptions.modules.Files.actions.clearClipboardFiles).toHaveBeenCalled()
    })
  })
  describe('button triggers', () => {
    it('should create a modal if "New folder" button is clicked', async () => {
      const { wrapper } = getWrapper()
      const createModalSpy = jest.spyOn(wrapper.vm, 'createModal')
      await wrapper.find(elSelector.newFolderBtn).trigger('click')
      expect(createModalSpy).toHaveBeenCalled()
    })
    it.each(fileHandlerMocks)(
      'should create a modal if "New file" button is clicked',
      async (fileHandler) => {
        const { wrapper } = getWrapper({ newFileHandlers: fileHandlerMocks })
        const createModalSpy = jest.spyOn(wrapper.vm, 'createModal')
        const showCreateResourceModal = jest.spyOn(wrapper.vm, 'showCreateResourceModal')
        await wrapper.find(`.new-file-btn-${fileHandler.ext}`).trigger('click')
        expect(createModalSpy).toHaveBeenCalled()
        expect(showCreateResourceModal).toHaveBeenCalledWith(
          false,
          fileHandler.ext,
          fileHandler.action
        )
      }
    )
  })
  describe('method "onUploadComplete"', () => {
    it.each([
      { driveType: 'personal', updated: 1 },
      { driveType: 'project', updated: 1 },
      { driveType: 'share', updated: 0 },
      { driveType: 'public', updated: 0 }
    ])('updates the space quota for supported drive types', async (data) => {
      const { driveType, updated } = data
      const { wrapper, mocks, storeOptions } = getWrapper()
      const file = mockDeep<UppyResource>({ meta: { driveType } })
      const graphMock = mockDeep<Graph>()
      graphMock.drives.getDrive.mockResolvedValue(mockDeep<Drive>() as any)
      mocks.$clientService.graphAuthenticated.mockImplementation(() => graphMock)
      await wrapper.vm.onUploadComplete({ successful: [file] })
      expect(
        storeOptions.modules.runtime.modules.spaces.mutations.UPDATE_SPACE_FIELD
      ).toHaveBeenCalledTimes(updated)
    })
    it('reloads the file list if files were uploaded to the current path', async () => {
      const eventSpy = jest.spyOn(eventBus, 'publish')
      const itemId = 'itemId'
      const space = mock<SpaceResource>({ id: '1' })
      const { wrapper, mocks } = getWrapper({ itemId, space })
      const file = mockDeep<UppyResource>({
        meta: { driveType: 'project', spaceId: space.id, currentFolderId: itemId }
      })
      const graphMock = mockDeep<Graph>()
      graphMock.drives.getDrive.mockResolvedValue(mockDeep<Drive>() as any)
      mocks.$clientService.graphAuthenticated.mockImplementation(() => graphMock)
      await wrapper.vm.onUploadComplete({ successful: [file] })
      expect(eventSpy).toHaveBeenCalled()
    })
  })
  describe('methods "addNewFolder" & "addNewFile"', () => {
    it.each(['addNewFolder', 'addNewFile'])(
      'updates the resource after the folder as been created successfully',
      async (method) => {
        const createMethod = method === 'addNewFolder' ? 'createFolder' : 'putFileContents'
        const { wrapper, mocks, storeOptions } = getWrapper({ item: '/' })
        mocks.$clientService.webdav[createMethod].mockResolvedValue(mockDeep<Resource>())
        await wrapper.vm[method]('New resource')
        expect(storeOptions.modules.Files.mutations.UPSERT_RESOURCE).toHaveBeenCalled()
      }
    )
    it.each(['addNewFolder', 'addNewFile'])(
      'shows a message when an error occurres',
      async (method) => {
        const createMethod = method === 'addNewFolder' ? 'createFolder' : 'putFileContents'
        jest.spyOn(console, 'error').mockImplementation(() => undefined)
        const { wrapper, mocks, storeOptions } = getWrapper({ item: '/' })
        mocks.$clientService.webdav[createMethod].mockRejectedValue(new Error())
        await wrapper.vm[method]('New resource')
        expect(storeOptions.actions.showMessage).toHaveBeenCalled()
      }
    )
    it('opens the file editor after a file has been created and a supported editor is available', async () => {
      const { wrapper, mocks } = getWrapper({
        newFileAction: true,
        item: '/',
        newFileHandlers: fileHandlerMocks
      })
      const openEditorSpy = jest.spyOn(wrapper.vm, '$_fileActions_openEditor').mockImplementation()
      mocks.$clientService.webdav.putFileContents.mockResolvedValue(mockDeep<Resource>())
      await wrapper.vm.addNewFile('New resource.txt')
      expect(openEditorSpy).toHaveBeenCalled()
    })
  })
  describe('methods "checkNewFolderName" & "checkNewFileName"', () => {
    it.each([
      { name: '', valid: false },
      { name: '/name', valid: false },
      { name: '.', valid: false },
      { name: '..', valid: false },
      { name: 'name ', valid: false },
      { name: 'name', valid: true }
    ])('verifies the resource name', (data) => {
      const { name, valid } = data
      const { wrapper } = getWrapper()
      const folderResult = wrapper.vm.checkNewFolderName(name)
      expect(folderResult === null).toBe(valid)
      const fileResult = wrapper.vm.checkNewFileName(name)
      expect(fileResult === null).toBe(valid)
    })
    it('shows error when the resource name already exists', () => {
      const existingFile = mockDeep<Resource>({ name: 'someFile.txt' })
      const { wrapper } = getWrapper({ files: [existingFile] })
      const folderResult = wrapper.vm.checkNewFolderName(existingFile.name)
      expect(folderResult).not.toBeNull()
      const fileResult = wrapper.vm.checkNewFileName(existingFile.name)
      expect(fileResult).not.toBeNull()
    })
  })
  describe('method "addAppProviderFile"', () => {
    it('triggers the default file action', async () => {
      const { wrapper, mocks } = getWrapper({ item: '/' })
      const defaultActionSpy = jest
        .spyOn(wrapper.vm, '$_fileActions_triggerDefaultAction')
        .mockImplementation(() => undefined)
      mocks.$clientService.webdav.getFileInfo.mockResolvedValue(mockDeep<Resource>())
      await wrapper.vm.addAppProviderFile('someFile.txt')
      expect(defaultActionSpy).toHaveBeenCalled()
    })
    it('shows a message when an error occurred', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => undefined)
      const { wrapper, mocks, storeOptions } = getWrapper({ item: '/' })
      mocks.$clientService.webdav.getFileInfo.mockRejectedValue(new Error())
      await wrapper.vm.addAppProviderFile('someFile.txt')
      expect(storeOptions.actions.showMessage).toHaveBeenCalled()
    })
  })
})

function getWrapper({
  newFileHandlers = [],
  clipboardResources = [],
  files = [],
  currentFolder = mockDeep<Resource>({ canUpload: () => true }),
  currentRouteName = 'files-spaces-generic',
  space = mock<SpaceResource>(),
  item = undefined,
  itemId = undefined,
  newFileAction = false
} = {}) {
  jest.mocked(useRequest).mockImplementation(() => ({
    makeRequest: jest.fn().mockResolvedValue({ status: 200 })
  }))
  const storeOptions = {
    ...defaultStoreMockOptions,
    getters: {
      ...defaultStoreMockOptions.getters,
      newFileHandlers: () => newFileHandlers,
      user: () => ({ id: '1' }),
      capabilities: () => ({
        spaces: { enabled: true },
        files: { app_providers: [{ new_url: '/' }] }
      })
    }
  }
  storeOptions.getters.apps.mockImplementation(() => ({
    fileEditors: []
  }))
  storeOptions.modules.Files.getters.currentFolder.mockImplementation(() => currentFolder)
  storeOptions.modules.Files.getters.clipboardResources.mockImplementation(() => clipboardResources)
  storeOptions.modules.Files.getters.files.mockImplementation(() => files)
  const store = createStore(storeOptions)
  const mocks = { ...defaultComponentMocks({ currentRoute: { name: currentRouteName } }) }
  return {
    storeOptions,
    mocks,
    wrapper: shallowMount(CreateAndUpload as any, {
      data: () => ({ newFileAction }),
      props: { space: space as any, item, itemId },
      global: {
        stubs: { OcButton: false },
        renderStubDefaultSlot: true,
        mocks,
        plugins: [...defaultPlugins(), store]
      }
    })
  }
}
