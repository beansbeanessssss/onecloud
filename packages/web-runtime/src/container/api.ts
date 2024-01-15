import { RouteRecordRaw, Router } from 'vue-router'
import clone from 'lodash-es/clone'
import { RuntimeApi } from './types'
import { ApiError, ExtensionRegistry, SidebarNavExtension } from '@ownclouders/web-pkg'
import { get, isEqual, isObject, isArray, merge } from 'lodash-es'
import { Module, Store } from 'vuex'
import { App, Component, computed, h } from 'vue'
import { ApplicationTranslations, AppNavigationItem } from '@ownclouders/web-pkg'
import type { Language } from 'vue3-gettext'

/**
 * inject application specific routes into runtime
 *
 * @param applicationId
 * @param router
 * @param routes
 */
const announceRoutes = (applicationId: string, router: Router, routes: RouteRecordRaw[]): void => {
  if (!isArray(routes)) {
    throw new ApiError("routes can't be blank")
  }
  const namespaceRouteName = (name: string) => {
    return name.startsWith(`${applicationId}-`) ? name : `${applicationId}-${name}`
  }
  routes
    .map((applicationRoute) => {
      if (!isObject(applicationRoute)) {
        throw new ApiError("route can't be blank", applicationRoute)
      }

      const route = clone(applicationRoute)
      if (route.name) {
        route.name =
          applicationId === route.name ? route.name : namespaceRouteName(String(route.name))
      }

      route.path = `/${encodeURI(applicationId)}${route.path}`

      if (route.children) {
        route.children = route.children.map((childRoute) => {
          if (!isObject(applicationRoute)) {
            throw new ApiError("route children can't be blank", applicationRoute, childRoute)
          }

          const r = clone(childRoute)
          if (childRoute.name) {
            r.name = namespaceRouteName(String(childRoute.name))
          }
          return r
        })
      }

      return route
    })
    .forEach((route) => {
      router.addRoute(route)
    })
}

/**
 * inject application specific navigation items into runtime
 *
 * @param applicationId
 * @param extensionRegistry
 * @param navigationItems
 */
const announceNavigationItems = (
  applicationId: string,
  extensionRegistry: ExtensionRegistry,
  navigationItems: AppNavigationItem[]
): void => {
  if (!isObject(navigationItems)) {
    throw new ApiError("navigationItems can't be blank")
  }

  const navExtensions = navigationItems.map((navItem) => ({
    type: 'sidebarNav',
    navItem,
    scopes: [applicationId, `app.${applicationId}`]
  })) as SidebarNavExtension[]

  extensionRegistry.registerExtensions(computed(() => navExtensions))
}

/**
 * inject application specific extension into runtime
 *
 * @param applicationId
 * @param store
 * @param extension
 */
const announceExtension = (
  applicationId: string,
  store: Store<unknown>,
  extension: { [key: string]: unknown }
): void => {
  store.commit('REGISTER_EXTENSION', { app: applicationId, extension })
}

/**
 * inject application specific translations into runtime
 *
 * @param translations
 * @param appTranslations
 * @param supportedLanguages
 */
const announceTranslations = (
  supportedLanguages: { [key: string]: string },
  gettext: Language,
  appTranslations: ApplicationTranslations
): void => {
  if (!isObject(gettext.translations)) {
    throw new ApiError("translations can't be blank")
  }

  Object.keys(supportedLanguages).forEach((lang) => {
    if (gettext.translations[lang] && appTranslations[lang]) {
      gettext.translations = merge(gettext.translations, { [lang]: appTranslations[lang] })
    }
  })
}

/**
 * inject application specific store into runtime
 *
 * @param applicationName
 * @param store
 * @param applicationStore
 */
const announceStore = (
  applicationName: string,
  store: Store<unknown>,
  applicationStore: Module<unknown, unknown>
): void => {
  const obtainedStore: Module<unknown, unknown> = get(applicationStore, 'default', applicationStore)

  if (!isObject(obtainedStore)) {
    throw new ApiError("store can't be blank")
  }

  store.registerModule(applicationName, obtainedStore)
}

/**
 * open a wormhole portal, this wraps vue-portal
 *
 * @param instance
 * @param applicationId
 * @param toApp
 * @param toPortal
 * @param order
 * @param components
 */
const openPortal = (
  applicationId: string,
  instance: App,
  toApp: string,
  toPortal: string,
  order: number,
  components: Component[]
): void => {
  instance.config.globalProperties.$wormhole.open({
    to: ['app', toApp, toPortal].filter(Boolean).join('.'),
    from: ['app', applicationId, toPortal, order].filter(Boolean).join('.'),
    order: order,
    content: () => components.map((c) => h(c))
  })
}

/**
 * expose store to the application
 *
 * @deprecated use with caution
 *
 * @param store
 */
const requestStore = (store: Store<unknown>): Store<unknown> => {
  if (isEqual(process.env.NODE_ENV, 'development')) {
    console.warn('requestStore // store api is deprecated, use with caution')
  }

  return store
}

/**
 * expose router to the application
 *
 * @deprecated use with caution
 *
 * @param router
 */
const requestRouter = (router: Router): Router => {
  if (isEqual(process.env.NODE_ENV, 'development')) {
    console.warn('requestRouter // router api is deprecated, use with caution')
  }

  return router
}

/**
 * exposed runtime api, this wraps all available api actions in a closure and provides application
 * specific data to the implementations.
 *
 * each application get its own provisioned api!
 *
 * @param applicationName
 * @param applicationId
 * @param store
 * @param router
 * @param translations
 * @param supportedLanguages
 */
export const buildRuntimeApi = ({
  applicationName,
  applicationId,
  store,
  router,
  gettext,
  supportedLanguages,
  extensionRegistry
}: {
  applicationName: string
  applicationId: string
  store: Store<unknown>
  gettext: Language
  router: Router
  supportedLanguages: { [key: string]: string }
  extensionRegistry: ExtensionRegistry
}): RuntimeApi => {
  if (!applicationName) {
    throw new ApiError("applicationName can't be blank")
  }

  if (!applicationId) {
    throw new ApiError("applicationId can't be blank")
  }

  return {
    announceRoutes: (routes: RouteRecordRaw[]): void =>
      announceRoutes(applicationId, router, routes),
    announceNavigationItems: (navigationItems: AppNavigationItem[]): void =>
      announceNavigationItems(applicationId, extensionRegistry, navigationItems),
    announceTranslations: (appTranslations: ApplicationTranslations): void =>
      announceTranslations(supportedLanguages, gettext, appTranslations),
    announceStore: (applicationStore: Module<unknown, unknown>): void =>
      announceStore(applicationName, store, applicationStore),
    announceExtension: (extension: { [key: string]: unknown }): void =>
      announceExtension(applicationId, store, extension),
    requestStore: (): Store<unknown> => requestStore(store),
    requestRouter: (): Router => requestRouter(router),
    openPortal: (
      instance: App,
      toApp: string,
      toPortal: string,
      order: number,
      components: Component[]
    ): void => openPortal(applicationId, instance, toApp, toPortal, order, components)
  }
}
