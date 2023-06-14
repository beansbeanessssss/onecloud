import { createStore as _createStore, StoreOptions } from 'vuex'
import { mount } from '@vue/test-utils'
import { defineComponent, ref } from 'vue'
import { defaultPlugins, DefaultPluginsOptions } from 'web-test-helpers'
import { createRouter as _createRouter } from 'web-runtime/src/router'
import { createMemoryHistory, RouterOptions } from 'vue-router'

export { mount, shallowMount } from '@vue/test-utils'

jest.spyOn(console, 'warn').mockImplementation(() => undefined)

export const createStore = <T>(storeOptions: StoreOptions<T>) => {
  return _createStore(storeOptions)
}

export const getComposableWrapper = <T>(
  setup: any,
  {
    mocks = undefined,
    provide = undefined,
    store = undefined,
    template = undefined,
    pluginOptions = undefined
  }: {
    mocks?: Record<string, unknown>
    provide?: Record<string, unknown>
    store?: StoreOptions<T>
    template?: string
    pluginOptions?: DefaultPluginsOptions
  } = {}
) => {
  return mount(
    defineComponent({
      setup,
      template: template ? template : '<div></div>'
    }),
    {
      global: {
        plugins: [...defaultPlugins(pluginOptions), store],
        ...(mocks && { mocks }),
        ...(provide && { provide })
      }
    }
  )
}

export const getStoreInstance = <T>(storeOptions: StoreOptions<T>) => {
  return _createStore(storeOptions)
}

export type { RouteLocation } from 'vue-router'
export { RouterLinkStub } from '@vue/test-utils'
export const createRouter = (options?: Partial<RouterOptions>) =>
  _createRouter({
    history: createMemoryHistory(),
    routes: [],
    strict: false,
    ...options
  })

export const createMockActionComposables = (module) => {
  const mockModule: Record<string, any> = {}
  for (const m of Object.keys(module)) {
    mockModule[m] = jest.fn(() => ({ actions: ref([]) }))
  }
  return mockModule
}
