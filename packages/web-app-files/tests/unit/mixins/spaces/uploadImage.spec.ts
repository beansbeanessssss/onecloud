import Vuex from 'vuex'
import { createStore } from 'vuex-extensions'
import { mount, createLocalVue } from '@vue/test-utils'
import uploadImage from 'web-app-files/src/mixins/spaces/actions/uploadImage.js'
import { thumbnailService } from '../../../../src/services'
import { mockDeep } from 'jest-mock-extended'
import { OwnCloudSdk } from 'web-client/src/types'
import { Graph } from 'web-client'
import { clientService } from 'web-pkg'
import { defaultComponentMocks } from 'web-test-helpers/src/mocks/defaultComponentMocks'
import { defaultStoreMockOptions } from 'web-test-helpers/src/mocks/store/defaultStoreMockOptions'

const localVue = createLocalVue()
localVue.use(Vuex)

describe('uploadImage', () => {
  const Component = {
    template: '<div></div>',
    mixins: [uploadImage]
  }

  function getWrapper(resolvePutFileContents = true) {
    const clientMock = mockDeep<OwnCloudSdk>()
    const defaultMocks = defaultComponentMocks({ currentRoute: { name: 'files-spaces-generic' } })
    return mount(Component, {
      localVue,
      data: () => ({
        $_uploadImage_selectedSpace: {
          id: '1fe58d8b-aa69-4c22-baf7-97dd57479f22'
        }
      }),
      mocks: {
        ...defaultMocks,
        $client: {
          ...clientMock,
          files: {
            ...clientMock.files,
            putFileContents: jest.fn().mockImplementation(() => {
              if (resolvePutFileContents) {
                return Promise.resolve({
                  'OC-FileId':
                    'YTE0ODkwNGItNTZhNy00NTQ4LTk2N2MtZjcwZjhhYTY0Y2FjOmQ4YzMzMmRiLWUxNWUtNDRjMy05NGM2LTViYjQ2MGMwMWJhMw=='
                })
              }
              return Promise.reject(new Error(''))
            })
          }
        }
      },
      store: createStore(Vuex.Store, defaultStoreMockOptions)
    })
  }

  beforeAll(() => {
    thumbnailService.initialize({
      enabled: true,
      version: '0.1',
      supportedMimeTypes: ['image/png', 'image/jpg', 'image/jpeg', 'image/gif', 'text/plain']
    })
  })

  afterEach(() => jest.clearAllMocks())

  describe('method "$_uploadImage_uploadImageSpace"', () => {
    it('should show message on success', async () => {
      const responseMock = { data: { special: [{ specialFolder: { name: 'image' } }] } }
      const graphMock = mockDeep<Graph>({
        drives: { updateDrive: jest.fn().mockResolvedValue(responseMock) }
      })
      jest.spyOn(clientService, 'graphAuthenticated').mockImplementation(() => graphMock)

      const wrapper = getWrapper()
      const showMessageStub = jest.spyOn(wrapper.vm, 'showMessage')
      await wrapper.vm.$_uploadImage_uploadImageSpace({
        currentTarget: {
          files: [{ name: 'image.png', lastModifiedDate: new Date(), type: 'image/png' }]
        }
      })

      expect(showMessageStub).toHaveBeenCalledTimes(1)
    })

    it('should show message on error', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => undefined)
      const wrapper = getWrapper(false)
      const showMessageStub = jest.spyOn(wrapper.vm, 'showMessage')
      await wrapper.vm.$_uploadImage_uploadImageSpace({
        currentTarget: {
          files: [{ name: 'image.png', lastModifiedDate: new Date(), type: 'image/png' }]
        }
      })

      expect(showMessageStub).toHaveBeenCalledTimes(1)
    })
  })
})
