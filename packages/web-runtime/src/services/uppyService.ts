import Uppy, { BasePlugin, UppyFile, UIPlugin } from '@uppy/core'
import Tus from '@uppy/tus'
import { TusOptions } from '@uppy/tus'
import XHRUpload, { XHRUploadOptions } from '@uppy/xhr-upload'
import { Language } from 'vue3-gettext'
import { eventBus } from 'web-pkg/src/services/eventBus'
import DropTarget from '@uppy/drop-target'
import getFileType from '@uppy/utils/lib/getFileType'
import generateFileID from '@uppy/utils/lib/generateFileID'
import { urlJoin } from 'web-client/src/utils'

type UppyServiceTopics =
  | 'uploadStarted'
  | 'uploadCancelled'
  | 'uploadCompleted'
  | 'uploadSuccess'
  | 'uploadError'
  | 'filesSelected'
  | 'progress'
  | 'addedForUpload'
  | 'upload-progress'
  | 'drag-over'
  | 'drag-out'
  | 'drop'

export type uppyHeaders = {
  [name: string]: string | number
}

interface UppyServiceOptions {
  language: Language
}

export class UppyService {
  uppy: Uppy
  uploadInputs: HTMLInputElement[] = []

  constructor({ language }: UppyServiceOptions) {
    const { $gettext } = language
    this.uppy = new Uppy({
      autoProceed: false,
      onBeforeFileAdded: (file, files) => {
        if (file.id in files) {
          file.meta.retry = true
        }
        file.meta.relativePath = this.getRelativeFilePath(file)
        // id needs to be generated after the relative path has been set.
        file.id = generateFileID(file)
        return file
      },
      locale: {
        strings: {
          // for some reason this string is required and missing in uppy
          addedNumFiles: $gettext('Added %{numFiles} file(s)'),
          loadedXFiles: $gettext('Loaded %{numFiles} files')
        }
      }
    })

    this.setUpEvents()
  }

  getRelativeFilePath = (file: UppyFile): string | undefined => {
    const _file = file as any
    const relativePath =
      _file.webkitRelativePath ||
      _file.relativePath ||
      _file.data.relativePath ||
      _file.data.webkitRelativePath
    return relativePath ? urlJoin(relativePath) : undefined
  }

  addPlugin(plugin: any, opts: any) {
    this.uppy.use(plugin, opts)
  }

  removePlugin(plugin: UIPlugin | BasePlugin) {
    this.uppy.removePlugin(plugin)
  }

  getPlugin(name: string): UIPlugin | BasePlugin {
    return this.uppy.getPlugin(name)
  }

  useTus({
    tusMaxChunkSize,
    tusHttpMethodOverride,
    tusExtension,
    onBeforeRequest
  }: {
    tusMaxChunkSize: number
    tusHttpMethodOverride: boolean
    tusExtension: string
    onBeforeRequest: () => void
  }) {
    const chunkSize = tusMaxChunkSize || Infinity
    const uploadDataDuringCreation = tusExtension.includes('creation-with-upload')

    const tusPluginOptions = {
      chunkSize: chunkSize,
      removeFingerprintOnSuccess: true,
      overridePatchMethod: !!tusHttpMethodOverride,
      retryDelays: [0, 500, 1000],
      uploadDataDuringCreation,
      limit: 5,
      onBeforeRequest,
      onShouldRetry: (err, retryAttempt, options, next) => {
        // status code 5xx means the upload is gone on the server side
        if (err?.originalResponse?.getStatus() >= 500) {
          return false
        }
        if (err?.originalResponse?.getStatus() === 401) {
          return true
        }
        return next(err)
      }
    }

    const xhrPlugin = this.uppy.getPlugin('XHRUpload')
    if (xhrPlugin) {
      this.uppy.removePlugin(xhrPlugin)
    }

    const tusPlugin = this.uppy.getPlugin('Tus')
    if (tusPlugin) {
      tusPlugin.setOptions(tusPluginOptions)
      return
    }

    this.uppy.use(Tus, tusPluginOptions as unknown as TusOptions)
  }

  useXhr({ headers, xhrTimeout }: { headers: () => uppyHeaders; xhrTimeout: number }) {
    const xhrPluginOptions: XHRUploadOptions = {
      endpoint: '',
      method: 'put',
      headers,
      formData: false,
      timeout: xhrTimeout,
      getResponseData() {
        return {}
      }
    }

    const tusPlugin = this.uppy.getPlugin('Tus')
    if (tusPlugin) {
      this.uppy.removePlugin(tusPlugin)
    }

    const xhrPlugin = this.uppy.getPlugin('XHRUpload')
    if (xhrPlugin) {
      xhrPlugin.setOptions(xhrPluginOptions)
      return
    }

    this.uppy.use(XHRUpload, xhrPluginOptions)
  }

  tusActive() {
    return !!this.uppy.getPlugin('Tus')
  }

  useDropTarget({ targetSelector }: { targetSelector: string }) {
    if (this.uppy.getPlugin('DropTarget')) {
      return
    }
    this.uppy.use(DropTarget, {
      target: targetSelector,
      onDragOver: (event) => {
        this.publish('drag-over', event)
      },
      onDragLeave: (event) => {
        this.publish('drag-out', event)
      },
      onDrop: (event) => {
        this.publish('drop', event)
      }
    })
  }

  removeDropTarget() {
    const dropTargetPlugin = this.uppy.getPlugin('DropTarget')
    if (dropTargetPlugin) {
      this.uppy.removePlugin(dropTargetPlugin)
    }
  }

  subscribe(topic: UppyServiceTopics, callback: (data?: unknown) => void): string {
    return eventBus.subscribe(topic, callback)
  }

  unsubscribe(topic: UppyServiceTopics, token: string): void {
    eventBus.unsubscribe(topic, token)
  }

  publish(topic: UppyServiceTopics, data?: unknown): void {
    eventBus.publish(topic, data)
  }

  private setUpEvents() {
    this.uppy.on('progress', (value) => {
      this.publish('progress', value)
    })
    this.uppy.on('upload-progress', (file, progress) => {
      this.publish('upload-progress', { file, progress })
    })
    this.uppy.on('cancel-all', () => {
      this.publish('uploadCancelled')
      this.clearInputs()
    })
    this.uppy.on('complete', (result) => {
      this.publish('uploadCompleted', result)
      result.successful.forEach((file) => {
        this.uppy.removeFile(file.id)
      })
      this.clearInputs()
    })
    this.uppy.on('upload-success', (file) => {
      this.publish('uploadSuccess', file)
    })
    this.uppy.on('upload-error', (file, error) => {
      this.publish('uploadError', { file, error })
    })
  }

  registerUploadInput(el: HTMLInputElement) {
    const listenerRegistered = el.getAttribute('listener')
    if (listenerRegistered !== 'true') {
      el.setAttribute('listener', 'true')
      el.addEventListener('change', (event) => {
        const target = event.target as HTMLInputElement
        const files = Array.from(target.files) as unknown as UppyFile[]
        this.addFiles(files)
      })
      this.uploadInputs.push(el)
    }
  }

  removeUploadInput(el: HTMLInputElement) {
    this.uploadInputs = this.uploadInputs.filter((input) => input !== el)
  }

  generateUploadId(file: File): string {
    return generateFileID({
      name: file.name,
      size: file.size,
      type: getFileType(file as unknown as UppyFile),
      data: file
    } as unknown as UppyFile)
  }

  addFiles(files: UppyFile[]) {
    this.uppy.addFiles(files)
  }

  uploadFiles() {
    return this.uppy.upload()
  }

  retryAllUploads() {
    return this.uppy.retryAll()
  }

  pauseAllUploads() {
    return this.uppy.pauseAll()
  }

  resumeAllUploads() {
    return this.uppy.resumeAll()
  }

  cancelAllUploads() {
    return this.uppy.cancelAll()
  }

  clearInputs() {
    this.uploadInputs.forEach((item) => {
      item.value = null
    })
  }
}
