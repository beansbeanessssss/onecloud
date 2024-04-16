import { mock } from 'vitest-mock-extended'
import { nextTick, unref } from 'vue'
import { useFileActionsCreateNewFolder } from '../../../../../src/composables/actions'
import {
  useMessages,
  useModals,
  useResourcesStore
} from '../../../../../src/composables/piniaStores'
import { SpaceResource } from '@ownclouders/web-client'
import { FolderResource, Resource } from '@ownclouders/web-client'
import { RouteLocation, defaultComponentMocks, getComposableWrapper } from 'web-test-helpers/src'
import { useScrollToMock } from '../../../../mocks/useScrollToMock'
import { useScrollTo } from '../../../../../src/composables/scrollTo'

vi.mock('../../../../../src/composables/scrollTo')

describe('useFileActionsCreateNewFolder', () => {
  describe('checkFolderName', () => {
    it.each([
      { input: '', output: 'Folder name cannot be empty' },
      { input: '/', output: 'Folder name cannot contain "/"' },
      { input: '.', output: 'Folder name cannot be equal to "."' },
      { input: '..', output: 'Folder name cannot be equal to ".."' },
      { input: 'myfolder', output: null }
    ])('should validate folder name %s', (data) => {
      const space = mock<SpaceResource>({ id: '1' })
      getWrapper({
        space,
        setup: ({ checkNewFolderName }) => {
          checkNewFolderName(data.input, (str: string) => {
            expect(str).toBe(data.output)
          })
        }
      })
    })
  })
  describe('addNewFolder', () => {
    it('create new folder', () => {
      const space = mock<SpaceResource>({ id: '1' })
      getWrapper({
        space,
        setup: async ({ addNewFolder }) => {
          await addNewFolder('myfolder')
          await nextTick()

          const { upsertResource } = useResourcesStore()
          expect(upsertResource).toHaveBeenCalled()

          const { showMessage } = useMessages()
          expect(showMessage).toHaveBeenCalledWith({ title: '"myfolder" was created successfully' })

          // expect scrolltoresource to have been called
        }
      })
    })
    it('show error message if createFolder fails', () => {
      const consoleErrorMock = vi.spyOn(console, 'error').mockReturnThis()
      const space = mock<SpaceResource>({ id: '1' })
      getWrapper({
        resolveCreateFolder: false,
        space,
        setup: async ({ addNewFolder }) => {
          await addNewFolder('myfolder')
          await nextTick()
          const { showErrorMessage } = useMessages()
          expect(showErrorMessage).toHaveBeenCalledWith(
            expect.objectContaining({
              title: 'Failed to create folder'
            })
          )
          consoleErrorMock.mockRestore()
        }
      })
    })
  })
  describe('createNewFolderModal', () => {
    it('should show modal', () => {
      const space = mock<SpaceResource>({ id: '1' })
      getWrapper({
        space,
        setup: ({ actions }) => {
          const { dispatchModal } = useModals()
          unref(actions)[0].handler()

          expect(dispatchModal).toHaveBeenCalled()
        }
      })
    })
  })
})

function getWrapper({
  resolveCreateFolder = true,
  space = undefined,
  setup
}: {
  resolveCreateFolder?: boolean
  space?: SpaceResource
  setup: (instance: ReturnType<typeof useFileActionsCreateNewFolder>) => void
}) {
  vi.mocked(useScrollTo).mockImplementation(() => useScrollToMock())

  const mocks = {
    ...defaultComponentMocks({
      currentRoute: mock<RouteLocation>({ name: 'files-spaces-generic' })
    }),
    space
  }
  mocks.$clientService.webdav.createFolder.mockImplementation(() => {
    if (resolveCreateFolder) {
      return Promise.resolve({
        id: '1',
        type: 'folder',
        isReceivedShare: vi.fn(),
        path: '/'
      } as FolderResource)
    }
    return Promise.reject('error')
  })

  const currentFolder = mock<Resource>({ id: '1', path: '/' })

  return {
    wrapper: getComposableWrapper(
      () => {
        const instance = useFileActionsCreateNewFolder({ space })
        setup(instance)
      },
      {
        mocks,
        provide: mocks,
        pluginOptions: { piniaOptions: { resourcesStore: { currentFolder } } }
      }
    )
  }
}
