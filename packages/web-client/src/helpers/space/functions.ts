import { User } from '../user'
import { extractDomSelector, extractNodeId, Resource, SpaceRole } from '../resource'
import { SpacePeopleShareRoles, spaceRoleEditor, spaceRoleManager, spaceRoleViewer } from '../share'
import { PublicSpaceResource, ShareSpaceResource, SpaceResource, SHARE_JAIL_ID } from './types'

import { DavProperty } from '../../webdav/constants'
import { buildWebDavPublicPath } from '../publicLink'
import { urlJoin } from '../../utils'
import { Drive, DriveItem } from '@ownclouders/web-client/src/generated'

export function buildWebDavSpacesPath(storageId: string | number, path?: string) {
  return urlJoin('spaces', storageId, path, {
    leadingSlash: true
  })
}

export function buildWebDavSpacesTrashPath(storageId: string, path = '') {
  return urlJoin('spaces', 'trash-bin', storageId, path, {
    leadingSlash: true
  })
}

export function getRelativeSpecialFolderSpacePath(space: SpaceResource, type: 'image' | 'readme') {
  const typeMap = { image: 'spaceImageData', readme: 'spaceReadmeData' }
  const webDavPathComponents = decodeURI(space[typeMap[type]].webDavUrl).split('/')
  const idComponent = webDavPathComponents.find((c) => c.startsWith(space.id.toString()))
  if (!idComponent) {
    return ''
  }
  return webDavPathComponents.slice(webDavPathComponents.indexOf(idComponent) + 1).join('/')
}

export function buildPublicSpaceResource(data): PublicSpaceResource {
  const publicLinkPassword = data.publicLinkPassword

  const fileId = data.fileInfo?.[DavProperty.FileId]
  const publicLinkItemType = data.fileInfo?.[DavProperty.PublicLinkItemType]
  const publicLinkPermission = data.fileInfo?.[DavProperty.PublicLinkPermission]
  const publicLinkExpiration = data.fileInfo?.[DavProperty.PublicLinkExpiration]
  const publicLinkShareDate = data.fileInfo?.[DavProperty.PublicLinkShareDate]
  const publicLinkShareOwner = data.fileInfo?.[DavProperty.PublicLinkShareOwner]

  return Object.assign(
    buildSpace({
      ...data,
      driveType: 'public',
      driveAlias: `public/${data.id}`,
      webDavPath: buildWebDavPublicPath(data.id)
    }),
    {
      ...(fileId && { fileId }),
      ...(publicLinkPassword && { publicLinkPassword }),
      ...(publicLinkItemType && { publicLinkItemType }),
      ...(publicLinkPermission && { publicLinkPermission: parseInt(publicLinkPermission) }),
      ...(publicLinkExpiration && { publicLinkExpiration }),
      ...(publicLinkShareDate && { publicLinkShareDate }),
      ...(publicLinkShareOwner && { publicLinkShareOwner })
    }
  )
}

export function buildShareSpaceResource({
  shareId,
  shareName,
  serverUrl
}: {
  shareId: string | number
  shareName: string
  serverUrl: string
}): ShareSpaceResource {
  const space = buildSpace({
    id: [SHARE_JAIL_ID, shareId].join('!'),
    driveAlias: `share/${shareName}`,
    driveType: 'share',
    name: shareName,
    shareId,
    serverUrl
  }) as ShareSpaceResource
  space.rename = (newName: string) => {
    space.driveAlias = `share/${newName}`
    space.name = newName
  }
  return space
}

export function buildSpace(
  data: Drive & {
    path?: string
    serverUrl?: string
    shareId?: string | number
    webDavPath?: string
    webDavTrashPath?: string
  }
): SpaceResource {
  let spaceImageData: DriveItem, spaceReadmeData: DriveItem
  let disabled = false
  const spaceRoles = Object.fromEntries(SpacePeopleShareRoles.list().map((role) => [role.name, []]))

  if (data.special) {
    spaceImageData = data.special.find((el) => el.specialFolder.name === 'image')
    spaceReadmeData = data.special.find((el) => el.specialFolder.name === 'readme')

    if (spaceImageData) {
      spaceImageData.webDavUrl = decodeURI(spaceImageData.webDavUrl)
    }

    if (spaceReadmeData) {
      spaceReadmeData.webDavUrl = decodeURI(spaceReadmeData.webDavUrl)
    }
  }

  if (data.root?.permissions) {
    for (const permission of data.root.permissions) {
      spaceRoles[permission.roles[0]].push(
        ...permission.grantedToIdentities.reduce((acc, info) => {
          const kind = info.hasOwnProperty('group') ? 'group' : 'user'
          const spaceRole: SpaceRole = {
            kind,
            id: info[kind].id,
            displayName: info[kind].displayName,
            expirationDate: permission.expirationDateTime,
            isMember(u?: any): boolean {
              if (!u) {
                return false
              }

              switch (this.kind) {
                case 'user':
                  return this.id == u.uuid
                case 'group':
                  return u.groups.map((g) => g.id).includes(this.id)
                default:
                  return false
              }
            }
          }
          return [...acc, spaceRole]
        }, [])
      )
    }

    if (data.root?.deleted) {
      disabled = data.root.deleted?.state === 'trashed'
    }
  }

  const webDavPath = urlJoin(data.webDavPath || buildWebDavSpacesPath(data.id), {
    leadingSlash: true
  })
  const webDavUrl = urlJoin(data.serverUrl, 'remote.php/dav', webDavPath)
  const webDavTrashPath = urlJoin(data.webDavTrashPath || buildWebDavSpacesTrashPath(data.id), {
    leadingSlash: true
  })
  const webDavTrashUrl = urlJoin(data.serverUrl, 'remote.php/dav', webDavTrashPath)

  const s = {
    id: data.id,
    fileId: data.id,
    storageId: data.id,
    mimeType: '',
    name: data.name,
    description: data.description,
    extension: '',
    path: '/',
    webDavPath,
    webDavTrashPath,
    driveAlias: data.driveAlias,
    driveType: data.driveType,
    type: 'space',
    isFolder: true,
    mdate: data.lastModifiedDateTime,
    size: data.quota?.used,
    indicators: [],
    tags: [],
    permissions: '',
    starred: false,
    etag: '',
    shareId: data.shareId?.toString(),
    sharePermissions: '',
    shareTypes: (function () {
      return []
    })(),
    privateLink: '',
    downloadURL: '',
    ownerDisplayName: '',
    ownerId: data.owner?.user?.id,
    disabled,
    root: data.root,
    spaceQuota: data.quota,
    spaceRoles,
    spaceImageData,
    spaceReadmeData,
    canUpload: function ({ user }: { user?: User } = {}): boolean {
      return this.isManager(user) || this.isEditor(user)
    },
    canDownload: function () {
      return true
    },
    canBeDeleted: function ({ user, ability }: { user?: User; ability?: any } = {}) {
      return this.disabled && (ability?.can('delete-all', 'Drive') || this.isManager(user))
    },
    canRename: function ({ user, ability }: { user?: User; ability?: any } = {}) {
      return ability?.can('update-all', 'Drive') || this.isManager(user)
    },
    canEditDescription: function ({ user, ability }: { user?: User; ability?: any } = {}) {
      return ability?.can('update-all', 'Drive') || this.isManager(user)
    },
    canRestore: function ({ user, ability }: { user?: User; ability?: any } = {}) {
      return this.disabled && (ability?.can('update-all', 'Drive') || this.isManager(user))
    },
    canDisable: function ({ user, ability }: { user?: User; ability?: any } = {}) {
      return !this.disabled && (ability?.can('delete-all', 'Drive') || this.isManager(user))
    },
    canShare: function ({ user }: { user?: User } = {}) {
      return this.isManager(user)
    },
    canEditImage: function ({ user }: { user?: User } = {}) {
      return !this.disabled && (this.isManager(user) || this.isEditor(user))
    },
    canEditReadme: function ({ user }: { user?: User } = {}) {
      return this.isManager(user) || this.isEditor(user)
    },
    canRemoveFromTrashbin: function ({ user }: { user?: User } = {}) {
      return this.isManager(user)
    },
    canCreate: function () {
      return true
    },
    canEditTags: function () {
      return false
    },
    isMounted: function () {
      return true
    },
    isReceivedShare: function () {
      return false
    },
    isShareRoot: function () {
      return ['share', 'mountpoint', 'public'].includes(data.driveType)
    },
    canDeny: () => false,
    getDomSelector: () => extractDomSelector(data.id),
    getDriveAliasAndItem({ path }: Resource): string {
      return urlJoin(this.driveAlias, path, {
        leadingSlash: false
      })
    },
    getWebDavUrl({ path }: { path: string }): string {
      return urlJoin(webDavUrl, path)
    },
    getWebDavTrashUrl({ path }: { path: string }): string {
      return urlJoin(webDavTrashUrl, path)
    },
    isViewer(user: User): boolean {
      return this.spaceRoles[spaceRoleViewer.name].map((r) => r.isMember(user)).some(Boolean)
    },
    isEditor(user: User): boolean {
      return this.spaceRoles[spaceRoleEditor.name].map((r) => r.isMember(user)).some(Boolean)
    },
    isManager(user: User): boolean {
      return this.spaceRoles[spaceRoleManager.name].map((r) => r.isMember(user)).some(Boolean)
    },
    isMember(user: User): boolean {
      return this.isViewer(user) || this.isEditor(user) || this.isManager(user)
    },
    isOwner({ uuid }: User): boolean {
      return uuid === this.ownerId
    }
  }
  Object.defineProperty(s, 'nodeId', {
    get() {
      return extractNodeId(this.id)
    }
  })
  return s
}
