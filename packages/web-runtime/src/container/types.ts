import { Store } from 'vuex'
import { Router, RouteRecordRaw } from 'vue-router'
import { App, Component } from 'vue'
import {
  AppNavigationItem,
  ApplicationQuickActions,
  ApplicationTranslations
} from 'web-pkg/src/apps'

/** shim configuration for now, should be typed in a later step */
export type RuntimeConfiguration = any

/** RuntimeApi defines the publicly available runtime api */
export interface RuntimeApi {
  announceRoutes: (routes: RouteRecordRaw[]) => void
  announceNavigationItems: (navigationItems: AppNavigationItem[]) => void
  announceTranslations: (appTranslations: ApplicationTranslations) => void
  announceQuickActions: (quickActions: ApplicationQuickActions) => void
  announceStore: (applicationStore: Store<unknown>) => void
  announceExtension: (extension: { [key: string]: unknown }) => void
  requestStore: () => Store<unknown>
  requestRouter: () => Router
  openPortal: (
    instance: App,
    toApp: string,
    toPortal: string,
    order: number,
    components: Component[]
  ) => void
}
