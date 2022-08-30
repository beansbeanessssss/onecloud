import GetTextPlugin from 'vue-gettext'
import { mount } from '@vue/test-utils'
import { getStore, localVue } from './views.setup'
import Personal from '@files/src/views/Personal.vue'
import MixinAccessibleBreadcrumb from '@files/src/mixins/accessibleBreadcrumb'
import { accentuatesTableRowTest } from './views.shared'
import { createLocationSpaces } from '../../../src/router'
import { move } from '@files/src/helpers/resource'

localVue.use(GetTextPlugin, {
  translations: 'does-not-matter.json',
  silent: true
})

const router = {
  push: jest.fn(),
  afterEach: jest.fn(),
  currentRoute: {
    ...createLocationSpaces('files-spaces-personal'),
    params: { storageId: '1234' },
    query: {}
  },
  resolve: (r) => {
    return { href: r.name }
  }
}

const user = {
  id: 1,
  quota: 1
}

localVue.prototype.$client = {
  files: {
    move: jest.fn(),
    list: jest.fn(() => [])
  },
  users: {
    getUser: jest.fn(() => user)
  }
}

jest.unmock('axios')

const copyMove = { move }

const stubs = {
  'app-bar': true,
  'progress-bar': true,
  'create-and-upload': true,
  translate: true,
  'oc-pagination': true,
  'list-loader': true,
  'resource-table': true,
  'not-found-message': true,
  'quick-actions': true,
  'list-info': true,
  'side-bar': true
}

const resourceForestJpg = {
  id: 'forest',
  name: 'forest.jpg',
  path: 'images/nature/forest.jpg',
  webDavPath: 'images/nature/forest.jpg',
  thumbnail: 'https://cdn.pixabay.com/photo/2015/09/09/16/05/forest-931706_960_720.jpg',
  type: 'file',
  size: '111000234',
  mdate: 'Thu, 01 Jul 2021 08:34:04 GMT'
}
const resourceNotesTxt = {
  id: 'notes',
  name: 'notes.txt',
  path: '/Documents/notes.txt',
  webDavPath: '/Documents/notes.txt',
  icon: 'text',
  type: 'file',
  size: '1245',
  mdate: 'Thu, 01 Jul 2021 08:45:04 GMT'
}
const resourceDocumentsFolder = {
  id: 'documents',
  name: 'Documents',
  path: '/Documents',
  webDavPath: '/Documents',
  icon: 'folder',
  type: 'folder',
  size: '5324435',
  mdate: 'Sat, 09 Jan 2021 14:34:04 GMT'
}
const resourcePdfsFolder = {
  id: 'pdfs',
  name: 'Pdfs',
  path: '/pdfs',
  webDavPath: '/pdfs',
  icon: 'folder',
  type: 'folder',
  size: '53244',
  mdate: 'Sat, 09 Jan 2021 14:34:04 GMT'
}

const resourcesFiles = [resourceForestJpg, resourceNotesTxt]
const resourcesFolders = [resourceDocumentsFolder, resourcePdfsFolder]
const resources = [...resourcesFiles, ...resourcesFolders]

window.ResizeObserver =
  window.ResizeObserver ||
  jest.fn().mockImplementation(() => ({
    disconnect: jest.fn(),
    observe: jest.fn(),
    unobserve: jest.fn()
  }))

describe('Personal view', () => {
  describe('file move with drag & drop', () => {
    it('should exit if target is also selected', async () => {
      const spyOnGetFolderItems = jest.spyOn(copyMove, 'move')
      const wrapper = createWrapper([resourceForestJpg, resourcePdfsFolder])
      await wrapper.vm.fileDropped(resourcePdfsFolder.id)
      expect(spyOnGetFolderItems).not.toBeCalled()
      spyOnGetFolderItems.mockReset()
    })
    it('should exit if target is not a folder', async () => {
      const spyOnGetFolderItems = jest.spyOn(copyMove, 'move')
      const wrapper = createWrapper([resourceDocumentsFolder])
      await wrapper.vm.fileDropped(resourceForestJpg.id)
      expect(spyOnGetFolderItems).not.toBeCalled()
      spyOnGetFolderItems.mockReset()
    })
    it('should move a file', async () => {
      const spyOnGetFolderItems = jest.spyOn(copyMove, 'move').mockResolvedValueOnce([])
      const spyOnMoveFilesMove = jest
        .spyOn(localVue.prototype.$client.files, 'move')
        .mockImplementation()

      const wrapper = createWrapper([resourceDocumentsFolder])
      await wrapper.vm.fileDropped(resourcePdfsFolder.id)
      expect(spyOnMoveFilesMove).toBeCalled()

      spyOnMoveFilesMove.mockReset()
      spyOnGetFolderItems.mockReset()
    })
  })

  describe('accentuate new files and folders', () => {
    // eslint-disable-next-line jest/expect-expect
    it('accentuates table row for new files, folders and versions [Files/UPSERT_RESOURCE]', async () => {
      await accentuatesTableRowTest(Personal)
    })
  })
})

function createWrapper(selectedFiles = [resourceForestJpg]) {
  jest
    .spyOn(MixinAccessibleBreadcrumb.methods, 'accessibleBreadcrumb_focusAndAnnounceBreadcrumb')
    .mockImplementation()
  const component = {
    ...Personal,
    created: jest.fn(),
    mounted: jest.fn(),
    setup: () => ({
      ...Personal.setup(),
      paginatedResources: [...resources],
      areResourcesLoading: false,
      loadResourcesTask: {
        perform: jest.fn()
      },
      handleSort: jest.fn()
    })
  }
  return mount(component, {
    store: getStore({
      selectedFiles: [...selectedFiles],
      highlightedFile: resourceForestJpg,
      pages: 4
    }),
    localVue,
    stubs,
    mocks: {
      $route: router.currentRoute,
      $router: router
    }
  })
}
