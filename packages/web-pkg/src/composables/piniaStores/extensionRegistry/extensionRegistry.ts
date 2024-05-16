import { defineStore } from 'pinia'
import { ref, Ref, unref } from 'vue'
import { useConfigStore } from '../config'
import { Extension, ExtensionPoint, ExtensionType } from './types'

export const useExtensionRegistry = defineStore('extensionRegistry', () => {
  const configStore = useConfigStore()

  const extensions = ref<Ref<Extension[]>[]>([])

  const registerExtensions = (e: Ref<Extension[]>) => {
    extensions.value.push(e)
  }
  const requestExtensions = <T extends Extension>(extensionPoint: ExtensionPoint<T>) => {
    if (!extensionPoint.id || !extensionPoint.extensionType) {
      throw new Error('ExtensionPoint must have an id and an extensionType')
    }

    return unref(extensions).flatMap((e) =>
      unref(e).filter(
        (e) =>
          e.type === extensionPoint.extensionType &&
          !configStore.options.disabledExtensions.includes(e.id) &&
          (!e.extensionPointIds || e.extensionPointIds?.includes(extensionPoint.id))
      )
    ) as T[]
  }

  const extensionPoints = ref<Ref<ExtensionPoint<Extension>[]>[]>([])
  const registerExtensionPoints = <T extends Extension>(e: Ref<ExtensionPoint<T>[]>) => {
    extensionPoints.value.push(e)
  }
  const getExtensionPoints = <T extends ExtensionPoint<Extension>>(
    options: {
      extensionType?: ExtensionType
    } = {}
  ) => {
    return unref(extensionPoints).flatMap(
      (e) =>
        unref(e).filter((e) => {
          if (
            Object.hasOwn(options, 'extensionType') &&
            e.extensionType !== options.extensionType
          ) {
            return false
          }
          return true
        }) as T[]
    )
  }

  return {
    extensions,
    registerExtensions,
    requestExtensions,
    extensionPoints,
    registerExtensionPoints,
    getExtensionPoints
  }
})

export type ExtensionRegistry = ReturnType<typeof useExtensionRegistry>
