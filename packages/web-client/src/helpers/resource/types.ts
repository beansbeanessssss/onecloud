import { DavFileInfoResponse } from '@ownclouders/web-client/webdav'
import { Identity, User } from '../../graph/generated'
import { MongoAbility, SubjectRawRule } from '@casl/ability'
import { DAVResultResponseProps, FileStat } from 'webdav'
import { Audio, GeoCoordinates } from '../../graph/generated'

export type AbilityActions =
  | 'create'
  | 'create-all'
  | 'delete'
  | 'delete-all'
  | 'read'
  | 'read-all'
  | 'set-quota'
  | 'set-quota-all'
  | 'update'
  | 'update-all'

export type AbilitySubjects =
  | 'Account'
  | 'Drive'
  | 'Favorite'
  | 'Group'
  | 'Language'
  | 'Logo'
  | 'PublicLink'
  | 'ReadOnlyPublicLinkPassword'
  | 'Role'
  | 'Setting'
  | 'Share'

export type Ability = MongoAbility<[AbilityActions, AbilitySubjects]>
export type AbilityRule = SubjectRawRule<AbilityActions, AbilitySubjects, any>

// FIXME: almost all of the properties are non-optional, the interface should reflect that
export interface Resource {
  id: string
  fileId?: string
  parentFolderId?: string
  storageId?: string
  readonly nodeId?: string
  name?: string
  tags?: string[]
  audio?: Audio
  location?: GeoCoordinates
  path: string
  webDavPath?: string
  downloadURL?: string
  type?: string
  thumbnail?: string
  processing?: boolean
  locked?: boolean
  lockOwnerName?: string
  lockTime?: string
  mimeType?: string
  isFolder?: boolean
  sdate?: string // FIXME: move to `ShareResource`
  mdate?: string
  indicators?: any[] // FIXME: add type
  size?: number | string // FIXME
  permissions?: string
  starred?: boolean
  etag?: string
  shareId?: string // FIXME: this originates from the old OCS api, should be removed in the future
  shareRoot?: string // FIXME: this originates from the old OCS api, should be removed in the future
  shareTypes?: number[]
  privateLink?: string
  owner?: Identity
  extension?: string
  ddate?: string

  canCreate?(): boolean
  canUpload?({ user }: { user?: User }): boolean
  canDownload?(): boolean
  canShare?(args?: { user?: User; ability?: Ability }): boolean
  canRename?(args?: { user?: User; ability?: Ability }): boolean
  canBeDeleted?(args?: { user?: User; ability?: Ability }): boolean
  canBeRestored?(): boolean
  canDeny?(): boolean
  canRemoveFromTrashbin?({ user }: { user?: User }): boolean
  canEditTags?(): boolean

  getDomSelector?(): string

  isReceivedShare?(): boolean
  isShareRoot?(): boolean
  isMounted?(): boolean
}

// These interfaces have empty (unused) __${type}SpaceResource properties which are only
// there to make the types differ, in order to make TypeScript type narrowing work correctly
// With empty types TypeScript does not accept this code
// ```
//   if(isPublicSpaceResource(resource)) { console.log(resource.id) } else { console.log(resource.id) }
// ```
// because in the else block resource gets the type never. If this is changed in a later TypeScript version
// or all types get different members, the underscored props can be removed.
export interface FolderResource extends Resource {
  __folderResource?: any
}

export interface FileResource extends Resource {
  __fileResource?: any
}

export interface WebDavResponseTusSupport {
  extension?: string[]
  maxSize?: number
  resumable?: string
  version?: string[]
}

export interface WebDavResponseResource extends Omit<FileStat, 'props'> {
  props?: Omit<DAVResultResponseProps, 'getcontentlength'> & DavFileInfoResponse
  processing?: boolean
  tusSupport?: WebDavResponseTusSupport
}

export interface SearchResource extends Resource {
  highlights: string
}
