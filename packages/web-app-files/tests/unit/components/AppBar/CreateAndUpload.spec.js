import { shallowMount, mount, createLocalVue } from '@vue/test-utils'
import Vuex from 'vuex'
import DesignSystem from 'owncloud-design-system'
import GetTextPlugin from 'vue-gettext'

import stubs from '@/tests/unit/stubs'
import CreateAndUpload from 'files/src/components/AppBar/CreateAndUpload'
import { createLocationSpaces } from '../../../../src/router'

const localVue = createLocalVue()
localVue.use(Vuex)
localVue.use(DesignSystem)
localVue.use(GetTextPlugin, {
  translations: 'does-not-matter.json',
  silent: true
})

const elSelector = {
  newFileButton: '#new-file-menu-btn',
  newFileDrop: 'oc-drop-stub #new-file-menu-drop',
  newFileMenuList: '#create-list > li',
  uploadButton: '#upload-menu-btn',
  uploadDrop: 'oc-drop-stub #upload-menu-drop',
  uploadMenuList: '#upload-list > li',
  fileUpload: 'resource-upload-stub',
  folderUpload: 'resource-upload-stub',
  newFolderBtn: '#new-folder-btn',
  newTextFileBtn: '.new-file-btn-txt',
  newMdFileBtn: '.new-file-btn-md',
  newDrawioFileBtn: '.new-file-btn-drawio'
}

const personalHomeLocation = createLocationSpaces('files-spaces-personal')

const newFileHandlers = [
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

const currentFolder = {
  path: '/',
  canUpload: jest.fn(() => true),
  canCreate: jest.fn(() => true),
  canBeDeleted: jest.fn(() => true)
}

describe('CreateAndUpload component', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  const route = {
    name: personalHomeLocation.name,
    params: {
      item: ''
    }
  }

  let wrapper

  const spyShowCreateResourceModal = jest
    .spyOn(CreateAndUpload.methods, 'showCreateResourceModal')
    .mockImplementation()

  beforeEach(() => {
    const store = createStore({ currentFolder })
    wrapper = getShallowWrapper(route, store)
  })

  it('should show default file menu items', () => {
    const fileUpload = wrapper.find(elSelector.fileUpload)
    const folderUpload = wrapper.find(elSelector.folderUpload)
    const newFolderBtn = wrapper.find(elSelector.newFolderBtn)

    expect(fileUpload.exists()).toBeTruthy()
    expect(folderUpload.exists()).toBeTruthy()
    expect(newFolderBtn.exists()).toBeTruthy()
  })

  describe('no file handlers available', () => {
    it('should show the create folder button standalone (no dropdown)', () => {
      const newFileMenuList = wrapper.findAll(elSelector.newFileMenuList)
      expect(newFileMenuList.exists()).toBeFalsy()
    })
  })

  describe('some file handlers available', () => {
    it('should show the create folder button in a dropdown', () => {
      const store = createStore({ currentFolder }, newFileHandlers)
      wrapper = getShallowWrapper(route, store)
      const newFileMenuList = wrapper.findAll(elSelector.newFileMenuList)
      expect(newFileMenuList.exists()).toBeTruthy()
    })

    it('should show extra file menu items for file handlers', () => {
      const store = createStore({ currentFolder }, newFileHandlers)
      wrapper = getShallowWrapper(route, store)
      const newTextFileBtn = wrapper.find(elSelector.newTextFileBtn)
      const newMdFileBtn = wrapper.find(elSelector.newMdFileBtn)
      const newDrawioFileBtn = wrapper.find(elSelector.newDrawioFileBtn)
      const newFileMenuList = wrapper.findAll(elSelector.newFileMenuList)

      expect(newTextFileBtn.exists()).toBeTruthy()
      expect(newMdFileBtn.exists()).toBeTruthy()
      expect(newDrawioFileBtn.exists()).toBeTruthy()
      expect(newFileMenuList.length).toBe(newFileHandlers.length + 1) // + 1 for "create folder"
    })
  })

  describe('button triggers', () => {
    it('should trigger "showCreateResourceModal" if new-folder button is clicked', async () => {
      const store = createStore({ currentFolder }, newFileHandlers)
      wrapper = getWrapper(route, store)

      const newFolderBtn = wrapper.find(elSelector.newFolderBtn)
      expect(newFolderBtn.exists()).toBeTruthy()
      await newFolderBtn.trigger('click')

      expect(spyShowCreateResourceModal).toHaveBeenCalled()
    })
    it.each(newFileHandlers)(
      'should trigger "showCreateResourceModal" if new file button is clicked',
      async (fileHandler) => {
        const store = createStore({ currentFolder }, newFileHandlers)
        wrapper = getWrapper(route, store)

        const button = wrapper.find(getFileHandlerSelector(fileHandler.ext))
        expect(button.exists()).toBeTruthy()
        await button.trigger('click')

        expect(spyShowCreateResourceModal).toHaveBeenCalled()
        expect(spyShowCreateResourceModal).toHaveBeenCalledWith(
          false,
          fileHandler.ext,
          fileHandler.action
        )
      }
    )
  })

  describe('method "checkQuotaExceeded"', () => {
    it('should be true if space quota exceeded', () => {
      const store = createStore({ currentFolder }, newFileHandlers)
      const wrapper = getShallowWrapper(route, store)
      const showMessageStub = jest.spyOn(wrapper.vm, 'showMessage')
      expect(
        wrapper.vm.checkQuotaExceeded([
          {
            data: {
              size: 1001
            },
            meta: {
              routeName: 'files-spaces-personal'
            }
          }
        ])
      ).toBeTruthy()
      expect(showMessageStub).toHaveBeenCalledTimes(1)
    })

    it('should be false if space quota not exceeded', () => {
      const store = createStore({ currentFolder }, newFileHandlers)
      const wrapper = getShallowWrapper(route, store)
      const showMessageStub = jest.spyOn(wrapper.vm, 'showMessage')
      expect(
        wrapper.vm.checkQuotaExceeded([
          {
            data: {
              size: 999
            },
            meta: {
              route: {
                params: {
                  storage: 'home'
                }
              }
            }
          }
        ])
      ).toBeFalsy()
      expect(showMessageStub).toHaveBeenCalledTimes(0)
    })
  })
})

function getFileHandlerSelector(extension) {
  const ext = extension.toLowerCase()
  if (ext === 'txt') {
    return elSelector.newTextFileBtn
  } else if (ext === 'md') {
    return elSelector.newMdFileBtn
  } else if (ext === 'drawio') {
    return elSelector.newDrawioFileBtn
  }
  return null
}

function getWrapper(route = {}, store = {}) {
  return mount(CreateAndUpload, {
    localVue,
    mocks: {
      $route: route,
      $router: {
        currentRoute: route,
        resolve: (r) => {
          return { href: r.name }
        }
      },
      isUserContext: jest.fn(() => false)
    },
    propsData: {
      currentPath: ''
    },
    stubs: {
      ...stubs,
      'oc-button': false,
      'resource-upload': true
    },
    store
  })
}

function getShallowWrapper(route = {}, store = {}) {
  return shallowMount(CreateAndUpload, {
    localVue,
    mocks: {
      $route: route,
      $router: {
        currentRoute: route,
        resolve: (r) => {
          return { href: r.name }
        }
      },
      isUserContext: jest.fn(() => false)
    },
    propsData: {
      currentPath: ''
    },
    store
  })
}

function createStore(state = { currentFolder: {} }, fileHandlers = []) {
  return new Vuex.Store({
    actions: {
      createModal: jest.fn(),
      hideModal: jest.fn(),
      showMessage: jest.fn()
    },
    getters: {
      user: function () {
        return { id: 'alice' }
      },
      newFileHandlers: jest.fn(() => fileHandlers)
    },
    modules: {
      runtime: {
        namespaced: true,
        modules: {
          spaces: {
            namespaced: true,
            getters: {
              spaces: () => [
                {
                  id: '1',
                  name: 'admin',
                  driveType: 'personal',
                  spaceQuota: {
                    remaining: 1000
                  }
                }
              ]
            }
          }
        }
      },
      Files: {
        namespaced: true,
        state: {
          currentFolder: {
            path: '/'
          },
          ...state
        },
        getters: {
          currentFolder: () => state.currentFolder,
          clipboardResources: () => [],
          selectedFiles: () => []
        }
      }
    }
  })
}
