import { Identity, SharingLinkType, UnifiedRoleDefinition } from '../../graph/generated'
import { Resource } from '../resource'

export enum GraphSharePermission {
  createUpload = 'libre.graph/driveItem/upload/create',
  createPermissions = 'libre.graph/driveItem/permissions/create',
  createChildren = 'libre.graph/driveItem/children/create',
  readBasic = 'libre.graph/driveItem/basic/read',
  readPath = 'libre.graph/driveItem/path/read',
  readQuota = 'libre.graph/driveItem/quota/read',
  readContent = 'libre.graph/driveItem/content/read',
  readChildren = 'libre.graph/driveItem/children/read',
  readDeleted = 'libre.graph/driveItem/deleted/read',
  updatePath = 'libre.graph/driveItem/path/update',
  updateDeleted = 'libre.graph/driveItem/deleted/update',
  deleteStandard = 'libre.graph/driveItem/standard/delete'
}

export interface ShareResource extends Resource {
  sharedWith: Array<{ shareType: number } & Identity>
  sharedBy: Identity[]
  outgoing: boolean
  driveId: string
}
export interface OutgoingShareResource extends ShareResource {}

export interface IncomingShareResource extends ShareResource {
  hidden: boolean
  syncEnabled: boolean
  shareRoles: UnifiedRoleDefinition[]
  sharePermissions: GraphSharePermission[]
}

export interface ShareRole extends UnifiedRoleDefinition {
  icon?: string
  label?: string
}

export interface Share {
  id: string
  resourceId: string
  indirect: boolean
  sharedBy: Identity
  shareType: number
  expirationDateTime?: string
}

export interface CollaboratorShare extends Share {
  permissions: GraphSharePermission[]
  sharedWith: Identity
  role: ShareRole
}

export interface LinkShare extends Share {
  displayName: string
  hasPassword: boolean
  isQuickLink: boolean
  type: SharingLinkType
  webUrl: string
  preventsDownload?: boolean
}

export interface CollaboratorAutoCompleteItem {
  id: string
  displayName: string
  shareType: number
  mail?: string
  onPremisesSamAccountName?: string
}
