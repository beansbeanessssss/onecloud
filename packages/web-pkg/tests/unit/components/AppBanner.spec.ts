import {
  createStore,
  defaultComponentMocks,
  defaultPlugins,
  defaultStoreMockOptions,
  shallowMount
} from 'web-test-helpers'
import AppBanner from '../../../src/components/AppBanner.vue'
import { createRouter, createWebHashHistory, createWebHistory } from 'vue-router'
import { useSessionStorage } from '@vueuse/core'
import { ref } from 'vue'

jest.mock('@vueuse/core')

describe('AppBanner', () => {
  it('generates app url with correct app scheme', () => {
    const baseElement = document.createElement('base')
    baseElement.href = '/'
    document.getElementsByTagName('head')[0].appendChild(baseElement)
    delete window.location
    window.location = new URL('https://localhost') as any

    const { wrapper } = getWrapper({
      fileId: '1337',
      appScheme: 'owncloud',
      sessionStorageReturnValue: null
    })
    expect(wrapper.find('.app-banner-cta').attributes().href).toBe('owncloud://localhost/f/1337')
  })
  it('does not show when banner was closed', () => {
    const { wrapper } = getWrapper({
      fileId: '1337',
      appScheme: 'owncloud',
      sessionStorageReturnValue: '1'
    })
    expect(wrapper.find('.app-banner').attributes().hidden).toBe('')
  })

  it('shows when banner was not yet closed', () => {
    const { wrapper } = getWrapper({
      fileId: '1337',
      appScheme: 'owncloud',
      sessionStorageReturnValue: null
    })
    expect(wrapper.find('.app-banner').attributes().hidden).toBe(undefined)
  })
})

function getWrapper({ fileId, appScheme, sessionStorageReturnValue }) {
  const storeOptions = {
    ...defaultStoreMockOptions
  }

  storeOptions.getters.configuration.mockReturnValue({
    currentTheme: {
      appBanner: {
        title: 'ownCloud',
        publisher: 'ownCloud GmbH',
        additionalInformation: 'FREE',
        ctaText: 'VIEW',
        icon: 'themes/owncloud/assets/owncloud-app-icon.png',
        appScheme
      }
    }
  })

  const router = createRouter({
    routes: [
      {
        path: '/f',
        component: {}
      }
    ],
    history: ('/' && createWebHistory('/')) || createWebHashHistory()
  })

  jest.mocked(useSessionStorage).mockImplementation(() => {
    return ref<string>(sessionStorageReturnValue)
  })

  const mocks = { ...defaultComponentMocks(), $router: router }
  const store = createStore(storeOptions)

  return {
    wrapper: shallowMount(AppBanner, {
      props: {
        fileId
      },
      global: {
        plugins: [...defaultPlugins(), store],
        mocks,
        provide: mocks
      }
    })
  }
}
