import {
  DesignSystem as designSystem,
  pages,
  translations,
  supportedLanguages,
  store,
  Vue
} from './defaults'

import { router } from './router'
import { configurationManager } from 'web-pkg/src/configuration'
import { createHead } from '@vueuse/head'

import {
  announceConfiguration,
  initializeApplications,
  announceApplicationsReady,
  announceClient,
  announceDefaults,
  announceClientService,
  announceStore,
  announceTheme,
  announceTranslations,
  announceVersions,
  applicationStore,
  announceUppyService,
  announceAuthService,
  announcePermissionManager,
  startSentry
} from './container'
import {
  buildPublicSpaceResource,
  buildSpace,
  isPersonalSpaceResource,
  isPublicSpaceResource,
  Resource
} from 'web-client/src/helpers'
import { WebDAV } from 'web-client/src/webdav'
import { DavProperty } from 'web-client/src/webdav/constants'
import { configureCompat, createApp, h } from 'vue'
import { compatConfig } from './compatConfig'
import PortalVue, { createWormhole } from 'portal-vue'

configureCompat(compatConfig)

export const bootstrap = async (configurationPath: string): Promise<void> => {
  const runtimeConfiguration = await announceConfiguration(configurationPath)
  startSentry(runtimeConfiguration, Vue)
  await announceStore({ vue: Vue, store, runtimeConfiguration })
  await initializeApplications({
    runtimeConfiguration,
    configurationManager,
    store,
    supportedLanguages,
    router,
    translations
  })
  announceClientService({ vue: Vue, runtimeConfiguration })
  announceUppyService({ vue: Vue })
  announcePermissionManager({ vue: Vue, store })
  await announceClient(runtimeConfiguration)
  await announceAuthService({ vue: Vue, configurationManager, store, router })
  announceTranslations({ vue: Vue, supportedLanguages, translations })
  await announceTheme({ store, vue: Vue, designSystem, runtimeConfiguration })
  announceDefaults({ store, router })
}

export const renderSuccess = (): void => {
  Vue.prototype.$store = store

  const applications = Array.from(applicationStore.values())
  const instance = createApp({
    store,
    router,
    render() {
      return h(pages.success)
    }
  })

  // create wormhole
  instance.config.globalProperties.$wormhole = createWormhole()
  instance.use(PortalVue, {
    wormhole: instance.config.globalProperties.$wormhole
  })

  // @vueuse/head
  instance.use(createHead())

  // mount App
  instance.mount('#owncloud')
  applications.forEach((application) => application.mounted(instance))

  store.watch(
    (state, getters) =>
      getters['runtime/auth/isUserContextReady'] ||
      getters['runtime/auth/isPublicLinkContextReady'],
    async (newValue, oldValue) => {
      if (!newValue || newValue === oldValue) {
        return
      }
      announceVersions({ store })
      await announceApplicationsReady({ applications })
    },
    {
      immediate: true
    }
  )

  store.watch(
    (state, getters) => {
      return getters['runtime/auth/isUserContextReady']
    },
    async (userContextReady) => {
      if (!userContextReady) {
        return
      }
      const clientService = instance.config.globalProperties.$clientService

      // Load spaces to make them available across the application
      if (store.getters.capabilities?.spaces?.enabled) {
        const graphClient = clientService.graphAuthenticated(
          store.getters.configuration.server,
          store.getters['runtime/auth/accessToken']
        )
        await store.dispatch('runtime/spaces/loadSpaces', { graphClient })
        const personalSpace = store.getters['runtime/spaces/spaces'].find((space) =>
          isPersonalSpaceResource(space)
        )
        store.commit('runtime/spaces/UPDATE_SPACE_FIELD', {
          id: personalSpace.id,
          field: 'name',
          value: instance.config.globalProperties.$gettext('Personal')
        })
        return
      }

      // Spaces feature not available. Create a virtual personal space
      const user = store.getters.user
      const space = buildSpace({
        id: user.id,
        driveAlias: `personal/${user.id}`,
        driveType: 'personal',
        name: instance.config.globalProperties.$gettext('All files'),
        webDavPath: `/files/${user.id}`,
        webDavTrashPath: `/trash-bin/${user.id}`,
        serverUrl: configurationManager.serverUrl
      })
      const personalHomeInfo = await (clientService.webdav as WebDAV).getFileInfo(
        space,
        {
          path: ''
        },
        { davProperties: [DavProperty.FileId] }
      )
      space.fileId = personalHomeInfo.fileId
      store.commit('runtime/spaces/ADD_SPACES', [space])
      store.commit('runtime/spaces/SET_SPACES_INITIALIZED', true)
    },
    {
      immediate: true
    }
  )
  store.watch(
    (state, getters) => {
      return getters['runtime/auth/isPublicLinkContextReady']
    },
    (publicLinkContextReady) => {
      if (!publicLinkContextReady) {
        return
      }
      // Create virtual space for public link
      const publicLinkToken = store.getters['runtime/auth/publicLinkToken']
      const publicLinkPassword = store.getters['runtime/auth/publicLinkPassword']
      const space = buildPublicSpaceResource({
        id: publicLinkToken,
        name: instance.config.globalProperties.$gettext('Public files'),
        ...(publicLinkPassword && { publicLinkPassword }),
        serverUrl: configurationManager.serverUrl
      })
      store.commit('runtime/spaces/ADD_SPACES', [space])
      store.commit('runtime/spaces/SET_SPACES_INITIALIZED', true)
    },
    {
      immediate: true
    }
  )
  store.watch(
    // only needed if a public link gets re-resolved with a changed password prop (changed or removed).
    // don't need to set { immediate: true } on the watcher.
    (state, getters) => {
      return getters['runtime/auth/publicLinkPassword']
    },
    (publicLinkPassword: string | undefined) => {
      const publicLinkToken = store.getters['runtime/auth/publicLinkToken']
      const space = store.getters['runtime/spaces/spaces'].find((space: Resource) => {
        return isPublicSpaceResource(space) && space.id === publicLinkToken
      })
      if (!space) {
        return
      }
      space.publicLinkPassword = publicLinkPassword
    }
  )
}

export const renderFailure = async (err: Error): Promise<void> => {
  Vue.prototype.$store = store

  announceVersions({ store })
  await announceTranslations({ vue: Vue, supportedLanguages, translations })
  await announceTheme({ store, vue: Vue, designSystem })
  console.error(err)
  createApp({
    store,
    render() {
      return h(pages.failure)
    }
  }).mount('#owncloud')
}
;(window as any).runtimeLoaded({
  bootstrap,
  renderSuccess,
  renderFailure
})
