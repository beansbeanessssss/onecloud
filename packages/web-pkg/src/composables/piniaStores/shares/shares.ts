import {
  CollaboratorShare,
  LinkShare,
  Share,
  GraphShareRoleIdMap,
  ShareRoleNG,
  ShareTypes,
  isProjectSpaceResource,
  getGraphItemId
} from '@ownclouders/web-client/src/helpers'
import { defineStore } from 'pinia'
import { Ref, ref, unref } from 'vue'
import {
  AddLinkOptions,
  AddShareOptions,
  DeleteLinkOptions,
  DeleteShareOptions,
  UpdateLinkOptions,
  UpdateShareOptions
} from './types'
import { useResourcesStore } from '../resources'
import { Permission, UnifiedRoleDefinition } from '@ownclouders/web-client/src/generated'
import { useUserStore } from '../user'
import {
  buildLinkShare,
  buildCollaboratorShare
} from '@ownclouders/web-client/src/helpers/share/functionsNG'

export const useSharesStore = defineStore('shares', () => {
  const resourcesStore = useResourcesStore()
  const userStore = useUserStore()

  const loading = ref(false)
  const collaboratorShares = ref<CollaboratorShare[]>([]) as Ref<CollaboratorShare[]>
  const linkShares = ref<LinkShare[]>([]) as Ref<LinkShare[]>
  const graphRoles = ref<ShareRoleNG[]>([]) as Ref<ShareRoleNG[]>

  const setGraphRoles = (values: UnifiedRoleDefinition[]) => {
    const ShareRoleIconMap = {
      [GraphShareRoleIdMap.Viewer]: 'eye',
      [GraphShareRoleIdMap.SpaceViewer]: 'eye',
      [GraphShareRoleIdMap.FileEditor]: 'pencil',
      [GraphShareRoleIdMap.FolderEditor]: 'pencil',
      [GraphShareRoleIdMap.SpaceEditor]: 'pencil',
      [GraphShareRoleIdMap.SpaceManager]: 'user-star'
    }

    const $gettext = (str: string) => str // dummy
    const ShareRoleLabelMap = {
      [GraphShareRoleIdMap.Viewer]: $gettext('Can view'),
      [GraphShareRoleIdMap.SpaceViewer]: $gettext('Can view'),
      [GraphShareRoleIdMap.FileEditor]: $gettext('Can edit'),
      [GraphShareRoleIdMap.FolderEditor]: $gettext('Can edit'),
      [GraphShareRoleIdMap.SpaceEditor]: $gettext('Can edit'),
      [GraphShareRoleIdMap.SpaceManager]: $gettext('Can manage')
    }

    graphRoles.value = values.map((v) => ({
      ...v,
      icon: ShareRoleIconMap[v.id] || 'user',
      label: ShareRoleLabelMap[v.id] || v.displayName
    }))
  }

  const upsertCollaboratorShare = (share: CollaboratorShare) => {
    const existingShare = unref(collaboratorShares).find(({ id }) => id === share.id)

    if (existingShare) {
      Object.assign(existingShare, share)
      return
    }

    unref(collaboratorShares).push(share)
  }

  const setCollaboratorShares = (values: CollaboratorShare[]) => {
    collaboratorShares.value = values
  }

  const addCollaboratorShares = (values: CollaboratorShare[]) => {
    unref(collaboratorShares).push(...values)
  }

  const removeCollaboratorShare = (share: CollaboratorShare) => {
    collaboratorShares.value = unref(collaboratorShares).filter(({ id }) => id !== share.id)
  }

  const pruneShares = () => {
    collaboratorShares.value = []
    linkShares.value = []
    loading.value = undefined
  }

  // remove loaded shares that are not within the current path
  const removeOrphanedShares = () => {
    const ancestorIds = Object.values(resourcesStore.ancestorMetaData).map(({ id }) => id)

    if (!ancestorIds.length) {
      collaboratorShares.value = []
      linkShares.value = []
      return
    }

    unref(collaboratorShares).forEach((share) => {
      if (!ancestorIds.includes(share.resourceId)) {
        removeCollaboratorShare(share)
      }
    })

    unref(linkShares).forEach((share) => {
      if (!ancestorIds.includes(share.resourceId)) {
        removeLinkShare(share)
      }
    })
  }

  const setLinkShares = (values: LinkShare[]) => {
    linkShares.value = values
  }

  const upsertLinkShare = (share: LinkShare) => {
    const existingShare = unref(linkShares).find(({ id }) => id === share.id)

    if (existingShare) {
      Object.assign(existingShare, share)
      return
    }

    // FIXME: use push as soon as we have a share date
    unref(linkShares).unshift(share)
  }

  const removeLinkShare = (share: LinkShare) => {
    linkShares.value = unref(linkShares).filter(({ id }) => id !== share.id)
  }

  const setLoading = (value: boolean) => {
    loading.value = value
  }

  const updateFileShareTypes = (path: string) => {
    const computeShareTypes = (shares: Share[]): any => {
      const shareTypes = new Set()
      shares.forEach((share) => {
        shareTypes.add(share.shareType)
      })
      return Array.from(shareTypes)
    }

    const file = [...resourcesStore.resources, resourcesStore.currentFolder].find(
      (f) => f?.path === path
    )
    if (!file || isProjectSpaceResource(file)) {
      return
    }

    const allShares = [...unref(collaboratorShares), ...unref(linkShares)]
    resourcesStore.updateResourceField({
      id: file.id,
      field: 'shareTypes',
      value: computeShareTypes(allShares.filter((s) => !s.indirect))
    })

    const ancestorEntry = resourcesStore.ancestorMetaData[file.path] ?? null
    if (ancestorEntry) {
      resourcesStore.updateAncestorField({
        path: ancestorEntry.path,
        field: 'shareTypes',
        value: computeShareTypes(allShares.filter((s) => !s.indirect))
      })
    }
  }

  const addShare = async ({
    clientService,
    space,
    resource,
    options
  }: AddShareOptions): Promise<CollaboratorShare[]> => {
    const { data } = await clientService.graphAuthenticated.permissions.invite(
      space.id,
      getGraphItemId(resource),
      options
    )

    const permissions = (data as any).value as Permission[]
    const builtShares = []

    permissions.forEach((graphPermission) => {
      builtShares.push(
        buildCollaboratorShare({
          graphPermission,
          graphRoles: unref(graphRoles),
          resourceId: resource.id,
          spaceId: space.id,
          user: userStore.user
        })
      )
    })

    addCollaboratorShares(builtShares)
    updateFileShareTypes(resource.path)
    resourcesStore.loadIndicators(resource.path)
    return builtShares
  }

  const updateShare = async ({
    clientService,
    space,
    resource,
    collaboratorShare,
    options
  }: UpdateShareOptions) => {
    const { data } = await clientService.graphAuthenticated.permissions.updatePermission(
      space.id,
      getGraphItemId(resource),
      collaboratorShare.id,
      {
        roles: options.roles,
        expirationDateTime: options.expirationDateTime
      }
    )

    const share = buildCollaboratorShare({
      graphPermission: data,
      graphRoles: unref(graphRoles),
      resourceId: resource.id,
      spaceId: space.id,
      user: userStore.user
    })
    upsertCollaboratorShare(share)
    return share
  }

  const deleteShare = async ({
    clientService,
    space,
    resource,
    collaboratorShare,
    loadIndicators = false
  }: DeleteShareOptions) => {
    await clientService.graphAuthenticated.permissions.deletePermission(
      space.id,
      getGraphItemId(resource),
      collaboratorShare.id
    )

    removeCollaboratorShare(collaboratorShare)
    updateFileShareTypes(resource.path)
    if (loadIndicators) {
      resourcesStore.loadIndicators(resource.path)
    }
  }

  const addLink = async ({ clientService, space, resource, options }: AddLinkOptions) => {
    const { data } = await clientService.graphAuthenticated.permissions.createLink(
      space.id,
      resource.id,
      options
    )

    const link = buildLinkShare({
      graphPermission: data,
      user: userStore.user,
      resourceId: resource.id
    })

    const selectedFiles = resourcesStore.selectedResources
    const fileIsSelected =
      selectedFiles.some(({ fileId }) => fileId === resource.fileId) ||
      (selectedFiles.length === 0 && resourcesStore.currentFolder.fileId === resource.fileId)

    upsertLinkShare(link)
    updateFileShareTypes(resource.path)

    if (!fileIsSelected) {
      // we might need to update the share types for the ancestor resource as well
      const ancestor = resourcesStore.ancestorMetaData[resource.path] ?? null
      if (ancestor) {
        const { shareTypes } = ancestor
        if (!shareTypes.includes(ShareTypes.link.value)) {
          resourcesStore.updateAncestorField({
            path: ancestor.path,
            field: 'shareTypes',
            value: [...shareTypes, ShareTypes.link.value]
          })
        }
      }
    }

    resourcesStore.loadIndicators(resource.path)
    return link
  }

  const updateLink = async ({
    clientService,
    space,
    resource,
    linkShare,
    options
  }: UpdateLinkOptions) => {
    if (Object.hasOwn(options, 'password')) {
      await clientService.graphAuthenticated.permissions.setPermissionPassword(
        space.id,
        resource.id,
        linkShare.id,
        { password: options.password }
      )

      linkShare.hasPassword = !!options.password
    }

    const { data } = await clientService.graphAuthenticated.permissions.updatePermission(
      space.id,
      resource.id,
      linkShare.id,
      {
        link: {
          ...linkShare.link,
          ...(options.type && { type: options.type }),
          ...(options.displayName && {
            '@libre.graph.displayName': options.displayName
          })
        },
        expirationDateTime: options.expirationDateTime
      }
    )

    const link = buildLinkShare({
      graphPermission: data,
      user: userStore.user,
      resourceId: resource.id
    })
    upsertLinkShare(link)
    return link
  }

  const deleteLink = async ({
    clientService,
    space,
    resource,
    linkShare,
    loadIndicators = false
  }: DeleteLinkOptions) => {
    await clientService.graphAuthenticated.permissions.deletePermission(
      space.id,
      resource.id,
      linkShare.id
    )

    removeLinkShare(linkShare)
    updateFileShareTypes(resource.path)
    if (loadIndicators) {
      resourcesStore.loadIndicators(resource.path)
    }
  }

  return {
    loading,
    collaboratorShares,
    linkShares,
    graphRoles,

    setGraphRoles,
    setLoading,
    setCollaboratorShares,
    setLinkShares,
    removeOrphanedShares,

    pruneShares,
    addShare,
    updateShare,
    deleteShare,

    addLink,
    updateLink,
    deleteLink
  }
})

export type SharesStore = ReturnType<typeof useSharesStore>
