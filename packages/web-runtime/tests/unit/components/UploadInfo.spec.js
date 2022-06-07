import { createLocalVue, shallowMount } from '@vue/test-utils'
import UploadInfo from '../../../src/components/UploadInfo'
import Vuex from 'vuex'
import DesignSystem from 'owncloud-design-system'
import GetTextPlugin from 'vue-gettext'

const localVue = createLocalVue()
localVue.use(Vuex)
localVue.use(DesignSystem)
localVue.use(GetTextPlugin, {
  translations: 'does-not-matter.json',
  silent: true
})

describe('UploadInfo component', () => {
  it('should render the component in a hidden state per default', () => {
    const wrapper = getShallowWrapper()
    const overlay = wrapper.find('#upload-info')
    expect(overlay.exists()).toBeFalsy()
  })
  it('should show the component', () => {
    const wrapper = getShallowWrapper({ showInfo: true })
    const overlay = wrapper.find('#upload-info')
    expect(overlay.exists()).toBeTruthy()
  })
  describe('title', () => {
    it('should show that an upload is in progress', () => {
      const wrapper = getShallowWrapper({
        showInfo: true,
        filesInProgressCount: 1,
        runningUploads: 1
      })
      const uploadTitle = wrapper.find('.upload-info-title span').text()
      expect(uploadTitle).toBe('1 item uploading...')
    })
    it('should show that an upload was successful', () => {
      const wrapper = getShallowWrapper({
        showInfo: true,
        filesInProgressCount: 0,
        runningUploads: 0,
        successful: [{ name: 'file', type: 'file' }],
        errors: []
      })
      const uploadTitle = wrapper.find('.upload-info-title span').text()
      expect(uploadTitle).toBe('Upload complete')
    })
    it('should show that an upload failed', () => {
      const wrapper = getShallowWrapper({
        showInfo: true,
        filesInProgressCount: 0,
        runningUploads: 0,
        errors: [{ name: 'file', type: 'file' }],
        successful: []
      })
      const uploadTitle = wrapper.find('.upload-info-title span').text()
      expect(uploadTitle).toBe('Upload failed')
    })
    it('should show that an upload was cancelled', () => {
      const wrapper = getShallowWrapper({
        showInfo: true,
        filesInProgressCount: 0,
        runningUploads: 0,
        errors: [],
        successful: [],
        uploadsCancelled: true
      })
      const uploadTitle = wrapper.find('.upload-info-title span').text()
      expect(uploadTitle).toBe('Upload cancelled')
    })
  })
  describe('progress bar', () => {
    it('should show the progress bar when an upload is in progress', () => {
      const wrapper = getShallowWrapper({
        showInfo: true,
        filesInProgressCount: 1,
        runningUploads: 1
      })
      const progressBar = wrapper.find('.upload-info-progress')
      expect(progressBar.exists()).toBeTruthy()
    })
  })
  describe('info', () => {
    it('should show the number of successful items', () => {
      const wrapper = getShallowWrapper({
        showInfo: true,
        filesInProgressCount: 0,
        runningUploads: 0,
        errors: [],
        successful: [
          { name: 'file', type: 'file' },
          { name: 'file2', type: 'file' }
        ]
      })
      const info = wrapper.find('.upload-info-success').text()
      expect(info).toBe('2 items uploaded')
    })
    it('should show the number of failed items', () => {
      const wrapper = getShallowWrapper({
        showInfo: true,
        filesInProgressCount: 0,
        runningUploads: 0,
        errors: [{ name: 'file', type: 'file' }],
        successful: [{ name: 'file2', type: 'file2' }]
      })
      const info = wrapper.find('.upload-info-danger').text()
      expect(info).toBe('1 of 2 items failed')
    })
  })
  describe('details', () => {
    it('should hide the info by default', () => {
      const wrapper = getShallowWrapper({
        showInfo: true
      })
      const info = wrapper.find('.upload-info-items')
      expect(info.exists()).toBeFalsy()
    })
    it('should list all the uploaded files when the info is displayed', () => {
      const wrapper = getShallowWrapper({
        showInfo: true,
        infoExpanded: true,
        uploads: [
          { name: 'file', type: 'file' },
          { name: 'file2', type: 'file' }
        ]
      })
      const info = wrapper.find('.upload-info-items')
      expect(info.exists()).toBeTruthy()

      const uploadedItems = wrapper.findAll('.upload-info-items li')
      expect(uploadedItems.length).toBe(2)
    })
  })
})

function createStore() {
  return new Vuex.Store({
    getters: {
      configuration: () => ({
        options: {
          disablePreviews: false
        }
      })
    }
  })
}

function getShallowWrapper({
  showInfo = false,
  infoExpanded = false,
  uploads = [],
  filesInProgressCount = 0,
  runningUploads = 0,
  successful = [],
  errors = [],
  uploadsCancelled = false
} = {}) {
  return shallowMount(UploadInfo, {
    localVue,
    store: createStore(),
    data() {
      return {
        showInfo,
        infoExpanded,
        uploads,
        filesInProgressCount,
        runningUploads,
        successful,
        errors,
        uploadsCancelled
      }
    },
    mocks: {
      $uppyService: {
        subscribe: jest.fn(),
        tusActive: jest.fn()
      }
    }
  })
}
