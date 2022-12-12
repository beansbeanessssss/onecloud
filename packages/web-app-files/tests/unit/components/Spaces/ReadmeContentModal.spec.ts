import Vuex from 'vuex'
import { mount, createLocalVue } from '@vue/test-utils'
import ReadmeContentModal from 'web-app-files/src/components/Spaces/ReadmeContentModal.vue'
import { createStore } from 'vuex-extensions'
import { mockDeep } from 'jest-mock-extended'
import { OwnCloudSdk } from 'web-client/src/types'
import { defaultStubs } from 'web-test-helpers/src/mocks/defaultStubs'
import { defaultComponentMocks } from 'web-test-helpers/src/mocks/defaultComponentMocks'
import { defaultStoreMockOptions } from 'web-test-helpers/src/mocks/store/defaultStoreMockOptions'

const localVue = createLocalVue()
localVue.use(Vuex)

afterEach(() => jest.clearAllMocks())

describe('ReadmeContentModal', () => {
  describe('method "editReadme"', () => {
    it('should show message on success', async () => {
      const wrapper = getWrapper()
      const showMessageStub = jest.spyOn(wrapper.vm, 'showMessage')
      await wrapper.vm.editReadme()

      expect(showMessageStub).toHaveBeenCalledTimes(1)
    })

    it('should show message on error', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => undefined)
      const wrapper = getWrapper(false)
      const showMessageStub = jest.spyOn(wrapper.vm, 'showMessage')
      await wrapper.vm.editReadme()

      expect(showMessageStub).toHaveBeenCalledTimes(1)
    })
  })
})

function getWrapper(resolvePutFileContents = true) {
  const clientMock = mockDeep<OwnCloudSdk>()
  return mount(ReadmeContentModal, {
    localVue,
    mocks: {
      ...defaultComponentMocks(),
      $client: {
        ...clientMock,
        files: {
          ...clientMock.files,
          putFileContents: jest.fn().mockImplementation(() => {
            if (resolvePutFileContents) {
              return Promise.resolve('readme')
            }
            return Promise.reject(new Error(''))
          }),
          getFileContents: jest.fn().mockImplementation(() => {
            return Promise.resolve('readme')
          })
        }
      }
    },
    store: createStore(Vuex.Store, defaultStoreMockOptions),
    propsData: {
      cancel: jest.fn(),
      space: {
        id: '1fe58d8b-aa69-4c22-baf7-97dd57479f22',
        spaceReadmeData: {
          webDavUrl:
            'https://localhost:9200/dav/spaces/1fe58d8b-aa69-4c22-baf7-97dd57479f22/.space/readme.md'
        }
      }
    },
    stubs: { ...defaultStubs, portal: true, 'oc-modal': true }
  })
}
