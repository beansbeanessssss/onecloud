import { createTestingPinia } from '@pinia/testing'
import defaultTheme from '../../../web-runtime/themes/owncloud/theme.json'
import { User, Group } from '../../../web-client/src/generated'
import { Message, Modal, WebThemeType } from '../../../web-pkg/src/composables/piniaStores'
import { Capabilities } from '../../../web-client/src/ocs'
import { mock } from 'vitest-mock-extended'
import { SpaceResource } from '../../../web-client/src'
import { OptionsConfig } from '../../../web-pkg/src/composables/piniaStores/config/types'
import { Resource, CollaboratorShare, LinkShare, ShareRole } from '../../../web-client/src/helpers'
import {
  AncestorMetaData,
  AppConfigObject,
  ApplicationFileExtension,
  ApplicationInformation,
  ClipboardActions
} from '../../../web-pkg/types'
import { ref } from 'vue'

export { createTestingPinia }

export type PiniaMockOptions = {
  stubActions?: boolean
  appsState?: { fileExtensions?: ApplicationFileExtension[] }
  authState?: {
    accessToken?: string
    idpContextReady?: boolean
    userContextReady?: boolean
    publicLinkContextReady?: boolean
  }
  themeState?: { availableThemes?: WebThemeType[]; currentTheme?: WebThemeType }
  clipboardState?: { action?: ClipboardActions; resources?: Resource[] }
  configState?: {
    server?: string
    options?: OptionsConfig
  }
  messagesState?: { messages?: Message[] }
  modalsState?: { modals?: Modal[] }
  spaceSettingsStore?: {
    spaces?: SpaceResource[]
    selectedSpaces?: SpaceResource[]
  }
  groupSettingsStore?: {
    groups?: Group[]
    selectedGroups?: Group[]
  }
  userSettingsStore?: {
    users?: User[]
    selectedUsers?: User[]
  }
  resourcesStore?: {
    resources?: Resource[]
    currentFolder?: Resource
    ancestorMetaData?: AncestorMetaData
    selectedIds?: string[]
    areFileExtensionsShown?: boolean
  }
  sharesState?: {
    collaboratorShares?: CollaboratorShare[]
    linkShares?: LinkShare[]
    graphRoles?: ShareRole[]
    loading?: boolean
  }
  spacesState?: { spaces?: SpaceResource[]; spaceMembers?: CollaboratorShare[] }
  userState?: { user?: User }
  capabilityState?: {
    capabilities?: Partial<Capabilities['capabilities']>
    isInitialized?: boolean
  }
  appsStore?: {
    apps?: ApplicationInformation
    externalAppConfig?: AppConfigObject
    fileExtensions?: ApplicationFileExtension[]
  }
}

export function createMockStore({
  stubActions = true,
  appsState = {},
  authState = {},
  clipboardState = {},
  configState = {},
  themeState = {},
  messagesState = {},
  modalsState = {},
  resourcesStore = {},
  userSettingsStore = {},
  groupSettingsStore = {},
  spaceSettingsStore = {},
  appsStore = {},
  sharesState = {},
  spacesState = {},
  userState = {},
  capabilityState = {}
}: PiniaMockOptions = {}) {
  const defaultOwnCloudTheme = {
    defaults: {
      ...defaultTheme.clients.web.defaults,
      common: {
        ...defaultTheme.common,
        urls: ['https://imprint.url.theme', 'https://privacy.url.theme']
      }
    },
    themes: defaultTheme.clients.web.themes
  }

  return createTestingPinia({
    stubActions,
    initialState: {
      apps: { ...appsState },
      auth: { ...authState },
      clipboard: { resources: [], ...clipboardState },
      config: {
        apps: [],
        external_apps: [],
        customTranslations: [],
        oAuth2: {},
        openIdConnect: {},
        options: {},
        server: '',
        ...configState
      },
      messages: { messages: [], ...messagesState },
      modals: {
        modals: [],
        ...modalsState
      },
      theme: {
        currentTheme: {
          ...defaultOwnCloudTheme.defaults,
          ...defaultOwnCloudTheme.themes[0]
        },
        availableThemes: defaultOwnCloudTheme.themes,
        ...themeState
      },
      resources: { resources: [], ...resourcesStore },
      apps: { fileExtensions: [], apps: {}, ...appsStore },
      shares: { collaboratorShares: [], linkShares: [], ...sharesState },
      spaces: { spaces: [], spaceMembers: [], ...spacesState },
      userSettings: { users: [], selectedUsers: [], ...userSettingsStore },
      groupSettings: { groups: [], selectedGroups: [], ...groupSettingsStore },
      spaceSettings: { spaces: [], selectedSpaces: [], ...spaceSettingsStore },
      user: { user: { ...mock<User>({ id: '1' }), ...(userState?.user && { ...userState.user }) } },
      capabilities: {
        isInitialized: capabilityState?.isInitialized ? capabilityState.isInitialized : true,
        capabilities: {
          ...mock<Capabilities['capabilities']>(),
          ...(capabilityState?.capabilities && { ...capabilityState.capabilities })
        }
      }
    }
  })
}
