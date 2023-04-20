import { SharePermission, SharePermissions } from './permission'

// dummy to trick gettext string extraction into recognizing strings
const $gettext = (str) => {
  return str
}

export abstract class ShareRole {
  private readonly _name: string
  private readonly _folder: boolean
  private readonly _label: string
  private readonly _inlineLabel: string
  private readonly _icon: string
  private readonly _permissions: SharePermission[]

  constructor(
    name: string,
    folder: boolean,
    label: string,
    inlineLabel: string,
    icon: string,
    permissions: SharePermission[]
  ) {
    this._name = name
    this._folder = folder
    this._label = label
    this._inlineLabel = inlineLabel
    this._icon = icon
    this._permissions = permissions
  }

  get key(): string {
    return `${this._name}-${this._folder ? 'folder' : 'file'}`
  }

  get name(): string {
    return this._name
  }

  get folder(): boolean {
    return this._folder
  }

  get label(): string {
    return this._label
  }

  get inlineLabel(): string {
    return this._inlineLabel
  }

  get hasCustomPermissions(): boolean {
    return false
  }

  get icon(): string {
    return this._icon
  }

  public permissions(allowSharing: boolean): SharePermission[] {
    return this._permissions.filter((p: SharePermission) => {
      if (p === SharePermissions.share) {
        return allowSharing
      }
      return true
    })
  }

  public abstract description(allowSharing: boolean): string

  /**
   * Calculates a bitmask from this role combined with the additional permissions (optional).
   *
   * @param allowSharing {boolean} Asserts whether share permission of the role should be taken into account.
   */
  public bitmask(allowSharing: boolean): number {
    return SharePermissions.permissionsToBitmask(this.permissions(allowSharing))
  }

  /**
   * Checks if the given permission exists in the permissions of the role.
   *
   * @param permission {SharePermission} The permission to be checked
   * @param allowSharing {boolean} Asserts whether share permission of the role should be taken into account.
   */
  public hasPermission(permission: SharePermission, allowSharing = false): boolean {
    return this.permissions(allowSharing).filter((p) => p.bit === permission.bit).length > 0
  }
}

export class CustomShareRole extends ShareRole {
  get hasCustomPermissions(): boolean {
    return true
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public description(allowSharing: boolean): string {
    return $gettext('Set custom permissions')
  }
}

export class PeopleShareRole extends ShareRole {
  public description(allowSharing: boolean): string {
    return shareRoleDescriptions[this.bitmask(allowSharing)]
  }
}

export class SpaceShareRole extends ShareRole {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public description(allowSharing: boolean): string {
    switch (this.name) {
      case spaceRoleViewer.name:
        return $gettext('Recipient can view and download.')
      case spaceRoleEditor.name:
        return $gettext('Recipient can view, download, upload, edit, add, delete.')
      case spaceRoleManager.name:
        return $gettext('Recipient can view, download, upload, edit, add, delete and share.')
    }
  }
}

export class LinkShareRole extends ShareRole {
  public description(allowSharing: boolean): string {
    return linkRoleDescriptions[this.bitmask(allowSharing)]
  }
}

export const peopleRoleViewerFile = new PeopleShareRole(
  'viewer',
  false,
  $gettext('can view'),
  $gettext('can view'),
  'eye',
  [SharePermissions.read, SharePermissions.share]
)
export const peopleRoleViewerFolder = new PeopleShareRole(
  'viewer',
  true,
  $gettext('can view'),
  $gettext('can view'),
  'eye',
  [SharePermissions.read, SharePermissions.share]
)
export const peopleRoleEditorFile = new PeopleShareRole(
  'editor',
  false,
  $gettext('can edit'),
  $gettext('can edit'),
  'file-edit',
  [SharePermissions.read, SharePermissions.update, SharePermissions.share]
)
export const peopleRoleEditorFolder = new PeopleShareRole(
  'editor',
  true,
  $gettext('can edit'),
  $gettext('can edit'),
  'file-edit',
  [
    SharePermissions.read,
    SharePermissions.update,
    SharePermissions.create,
    SharePermissions.delete,
    SharePermissions.share
  ]
)
export const peopleRoleCustomFile = new CustomShareRole(
  'custom',
  false,
  $gettext('Custom permissions'),
  $gettext('custom permissions'),
  'file-settings',
  [SharePermissions.read, SharePermissions.update, SharePermissions.share]
)
export const peopleRoleCustomFolder = new CustomShareRole(
  'custom',
  true,
  $gettext('Custom permissions'),
  $gettext('custom permissions'),
  'file-settings',
  [
    SharePermissions.read,
    SharePermissions.update,
    SharePermissions.create,
    SharePermissions.delete,
    SharePermissions.share
  ]
)
export const peopleRoleDenyFolder = new PeopleShareRole(
  'denied',
  true,
  $gettext('No access'),
  $gettext('no access'),
  'user-unfollow',
  [SharePermissions.denied]
)
export const linkRoleInternalFile = new LinkShareRole(
  'internal',
  false,
  $gettext('Internal'),
  $gettext('internal'),
  'login-box',
  [SharePermissions.internal]
)
export const linkRoleInternalFolder = new LinkShareRole(
  'internal',
  true,
  $gettext('Internal'),
  $gettext('internal'),
  'login-box',
  [SharePermissions.internal]
)
export const linkRoleViewerFile = new LinkShareRole(
  'viewer',
  false,
  $gettext('can view'),
  $gettext('can view'),
  'eye',
  [SharePermissions.read]
)
export const linkRoleViewerFolder = new LinkShareRole(
  'viewer',
  true,
  $gettext('can view'),
  $gettext('can view'),
  'eye',
  [SharePermissions.read]
)
export const linkRoleContributorFolder = new LinkShareRole(
  'contributor',
  true,
  $gettext('can contribute'),
  $gettext('can contribute'),
  'file-add',
  [SharePermissions.read, SharePermissions.create]
)
export const linkRoleEditorFile = new LinkShareRole(
  'editor',
  false,
  $gettext('can edit'),
  $gettext('can edit'),
  'file-edit',
  [SharePermissions.read, SharePermissions.update]
)
export const linkRoleEditorFolder = new LinkShareRole(
  'editor',
  true,
  $gettext('can edit'),
  $gettext('can edit'),
  'file-edit',
  [SharePermissions.read, SharePermissions.update, SharePermissions.create, SharePermissions.delete]
)
export const linkRoleUploaderFolder = new LinkShareRole(
  'uploader',
  true,
  $gettext('can upload'),
  $gettext('can upload'),
  'file-upload',
  [SharePermissions.create]
)
export const spaceRoleViewer = new SpaceShareRole(
  'viewer',
  false,
  $gettext('can view'),
  $gettext('can view'),
  'eye',
  [SharePermissions.read]
)
export const spaceRoleEditor = new SpaceShareRole(
  'editor',
  false,
  $gettext('can edit'),
  $gettext('can edit'),
  'file-edit',
  [SharePermissions.read, SharePermissions.update, SharePermissions.create, SharePermissions.delete]
)
export const spaceRoleManager = new SpaceShareRole(
  'manager',
  false,
  $gettext('can manage'),
  $gettext('can manage'),
  'user-star',
  [
    SharePermissions.read,
    SharePermissions.update,
    SharePermissions.create,
    SharePermissions.delete,
    SharePermissions.share
  ]
)

export abstract class SpacePeopleShareRoles {
  static readonly all = [spaceRoleViewer, spaceRoleEditor, spaceRoleManager]

  static list(): ShareRole[] {
    return this.all
  }

  static getByBitmask(bitmask: number): ShareRole {
    return this.all // Retrieve all possible options always, even if deny is not enabled
      .find((r) => r.bitmask(true) === bitmask)
  }
}

export abstract class PeopleShareRoles {
  static readonly all = [
    peopleRoleViewerFile,
    peopleRoleViewerFolder,
    peopleRoleEditorFile,
    peopleRoleEditorFolder
  ]

  static readonly allWithCustom = [...this.all, peopleRoleCustomFile, peopleRoleCustomFolder]

  static list(isFolder: boolean, hasCustom = true, canDeny = false): ShareRole[] {
    return [
      ...(hasCustom ? this.allWithCustom : this.all),
      ...(canDeny ? [peopleRoleDenyFolder] : [])
    ].filter((r) => r.folder === isFolder)
  }

  static custom(isFolder: boolean): ShareRole {
    return this.allWithCustom.find((r) => r.folder === isFolder && r.hasCustomPermissions)
  }

  static getByBitmask(bitmask: number, isFolder: boolean, allowSharing: boolean): ShareRole {
    const role = [...this.allWithCustom, peopleRoleDenyFolder] // Retrieve all possible options always, even if deny is not enabled
      .filter((r) => !r.hasCustomPermissions)
      .find((r) => r.folder === isFolder && r.bitmask(allowSharing) === bitmask)
    return role || this.custom(isFolder)
  }

  /**
   * Filter all roles that have either exactly the permissions from the bitmask or a subset of them.
   * @param bitmask
   * @param isFolder
   * @param allowSharing
   * @param allowCustom
   */
  static filterByBitmask(
    bitmask: number,
    isFolder: boolean,
    allowSharing: boolean,
    allowCustom: boolean
  ): ShareRole[] {
    const roles = this.all.filter((r) => {
      return r.folder === isFolder && bitmask === (bitmask | r.bitmask(allowSharing))
    })

    if (allowCustom) {
      const customRoles = [peopleRoleCustomFile, peopleRoleCustomFolder]
      return [...roles, ...customRoles.filter((c) => c.folder === isFolder)]
    }

    return roles
  }
}

export abstract class LinkShareRoles {
  static list(
    isFolder: boolean,
    canEditFile = false,
    canContribute = false,
    hasAliasLinks = false,
    hasPassword = false,
    canCreatePublicLinks = true
  ): ShareRole[] {
    return [
      ...(hasAliasLinks && !hasPassword ? [linkRoleInternalFile, linkRoleInternalFolder] : []),
      ...(canCreatePublicLinks ? [linkRoleViewerFile] : []),
      ...(canCreatePublicLinks ? [linkRoleViewerFolder] : []),
      ...(canCreatePublicLinks && canContribute ? [linkRoleContributorFolder] : []),
      ...(canCreatePublicLinks ? [linkRoleEditorFolder] : []),
      ...(canCreatePublicLinks ? [linkRoleUploaderFolder] : []),
      ...(canCreatePublicLinks && canEditFile ? [linkRoleEditorFile] : [])
    ].filter((r) => r.folder === isFolder)
  }

  static getByBitmask(bitmask: number, isFolder: boolean): ShareRole {
    return this.list(isFolder, true, true, true, false).find((r) => r.bitmask(false) === bitmask)
  }

  /**
   * Filter all roles that have either exactly the permissions from the bitmask or a subset of them.
   * @param bitmask
   * @param isFolder
   * @param canEditFile
   * @param canContribute
   * @param hasAliasLinks
   * @param hasPassword
   * @param canCreatePublicLinks
   */
  static filterByBitmask(
    bitmask: number,
    isFolder: boolean,
    canEditFile = false,
    canContribute = false,
    hasAliasLinks = false,
    hasPassword = false,
    canCreatePublicLinks = true
  ): ShareRole[] {
    return this.list(
      isFolder,
      canEditFile,
      canContribute,
      hasAliasLinks,
      hasPassword,
      canCreatePublicLinks
    ).filter((r) => {
      return bitmask === (bitmask | r.bitmask(false))
    })
  }

  static getByName(
    name: string,
    isFolder: boolean,
    canEditFile: boolean,
    canContribute: boolean,
    hasAliasLinks: boolean
  ): ShareRole {
    return LinkShareRoles.list(isFolder, canEditFile, canContribute, hasAliasLinks).find(
      (role) => role.name.toLowerCase() === name.toLowerCase()
    )
  }
}

/**
 * Maps relevant permission bitmasks of people roles to descriptions
 */
const shareRoleDescriptions = {
  [peopleRoleViewerFile.bitmask(false)]: $gettext('Recipients can view and download.'),
  [peopleRoleViewerFile.bitmask(true)]: $gettext('Recipients can view, download and share.'),
  [peopleRoleViewerFolder.bitmask(false)]: $gettext('Recipients can view download.'),
  [peopleRoleViewerFolder.bitmask(true)]: $gettext('Recipients can view, download and share.'),
  [peopleRoleEditorFile.bitmask(false)]: $gettext('Recipients can view, download, and edit.'),
  [peopleRoleEditorFile.bitmask(true)]: $gettext(
    'Recipients can view, download, edit and share file.'
  ),
  [peopleRoleEditorFolder.bitmask(false)]: $gettext(
    'Recipients can view, download, upload, edit, add and delete.'
  ),
  [peopleRoleEditorFolder.bitmask(true)]: $gettext(
    'Recipients can view, download, upload, edit, add, delete and share.'
  ),
  [peopleRoleDenyFolder.bitmask(false)]: $gettext('Deny access')
}

/**
 * Maps relevant permission bitmasks of link roles to descriptions
 */
const linkRoleDescriptions = {
  [linkRoleInternalFile.bitmask(false)]: $gettext('Recipients needs to login to access file.'),
  [linkRoleInternalFolder.bitmask(false)]: $gettext(
    'Recipients needs to login to access contents.'
  ),
  [linkRoleViewerFile.bitmask(false)]: $gettext('Recipients can view and download.'),
  [linkRoleViewerFolder.bitmask(false)]: $gettext('Recipients can view and download.'),
  [linkRoleContributorFolder.bitmask(false)]: $gettext('Recipients can view, download and upload.'),
  [linkRoleEditorFile.bitmask(false)]: $gettext('Recipients can view, download and edit.'),
  [linkRoleEditorFolder.bitmask(false)]: $gettext(
    'Recipients can view, download, edit, add, delete and upload.'
  ),
  [linkRoleUploaderFolder.bitmask(false)]: $gettext(
    'Recipients can only upload, existing content is not revealed.'
  )
}
