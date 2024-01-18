import {
  Share,
  ShareTypes,
  buildCollaboratorShare,
  buildShare
} from '@ownclouders/web-client/src/helpers'
import { defineStore } from 'pinia'
import { Ref, computed, ref, unref } from 'vue'
import { useConfigStore } from './../config'
import PQueue from 'p-queue'
import { getParentPaths } from '../../../helpers'
import { useCapabilityStore } from './../capabilities'
import {
  AddLinkOptions,
  AddShareOptions,
  DeleteLinkOptions,
  DeleteShareOptions,
  LoadSharesOptions,
  UpdateLinkOptions,
  UpdateShareOptions
} from './types'

export const useSharesStore = defineStore('shares', () => {
  const configStore = useConfigStore()
  const capabilityStore = useCapabilityStore()

  const loading = ref<Promise<unknown>>()
  const shares = ref<Share[]>([]) as Ref<Share[]>

  const incomingShares = computed(() => unref(shares).filter(({ outgoing }) => !outgoing) || [])
  const incomingCollaborators = computed(
    () =>
      unref(incomingShares).filter(({ shareType }) =>
        ShareTypes.containsAnyValue(ShareTypes.authenticated, [shareType])
      ) || []
  )

  const outgoingShares = computed(() => unref(shares).filter(({ outgoing }) => outgoing) || [])
  const outgoingLinks = computed(
    () =>
      unref(outgoingShares).filter(({ shareType }) =>
        ShareTypes.containsAnyValue(ShareTypes.unauthenticated, [shareType])
      ) || []
  )
  const outgoingCollaborators = computed(
    () =>
      unref(outgoingShares).filter(({ shareType }) =>
        ShareTypes.containsAnyValue(ShareTypes.authenticated, [shareType])
      ) || []
  )

  const allowResharing = computed(
    () => capabilityStore.sharingResharing && capabilityStore.sharingResharingDefault
  )

  const upsertShare = (share: Share) => {
    const existingShare = unref(shares).find(({ id }) => id === share.id)

    if (existingShare) {
      Object.assign(existingShare, share)
      return
    }

    unref(shares).push(share)
  }

  const removeShare = (share: Share) => {
    shares.value = unref(shares).filter(({ id }) => id !== share.id)
  }

  const pruneShares = () => {
    shares.value = []
    loading.value = undefined
  }

  const awaitLoading = async () => {
    if (unref(loading)) {
      await unref(loading)
    }
  }

  const setLoading = () => {
    let resolvePromise: (value: unknown) => void
    const promise = new Promise((resolve) => {
      resolvePromise = resolve
    })
    loading.value = promise
    promise.then(() => {
      loading.value = undefined
    })

    return resolvePromise
  }
  const loadShares = async ({
    clientService,
    resource,
    path,
    storageId,
    ancestorMetaData,
    useCached = true
  }: LoadSharesOptions) => {
    await awaitLoading()
    const resolvePromise = setLoading()

    const parentPaths = path === '/' ? ['/'] : getParentPaths(path, true)
    const currentlyLoadedShares = [...unref(shares)]
    const loadedShares = []

    const shareQueriesQueue = new PQueue({
      concurrency: configStore.options.concurrentRequests.shares.list
    })
    const shareQueriesPromises = []

    const getShares = (subPath: string, indirect: boolean, options, outgoing: boolean) => {
      const buildMethod = outgoing ? buildShare : buildCollaboratorShare
      const res = indirect || !resource ? { type: 'folder' } : resource

      return clientService.owncloudSdk.shares
        .getShares(subPath, options)
        .then((data) => {
          data.forEach((element) => {
            loadedShares.push({
              ...buildMethod(element.shareInfo, res, unref(allowResharing)),
              outgoing,
              indirect
            })
          })
        })
        .catch((error) => {
          console.error('SHARESTREE_ERROR', error)
        })
    }

    if (!path) {
      // space shares
      shareQueriesPromises.push(
        getShares(path, false, { reshares: true, spaceRef: storageId }, true)
      )
    }

    parentPaths.forEach((queryPath) => {
      const ancestorMeta = unref(ancestorMetaData)[queryPath] ?? null
      const indirect = path !== queryPath
      const spaceRef = indirect ? ancestorMeta?.id : storageId
      // no need to fetch cached shares again, only adjust the "indirect" state
      if (useCached && currentlyLoadedShares.length) {
        const cached = currentlyLoadedShares.filter((s) => s.path === queryPath)
        if (cached.length) {
          loadedShares.push(...cached.map((c) => ({ ...c, indirect })))
          return
        }
      }

      // query the outgoing share information for each of the parent paths
      shareQueriesPromises.push(
        shareQueriesQueue.add(() =>
          getShares(queryPath, indirect, { reshares: true, spaceRef }, true)
        )
      )
      // query the incoming share information for each of the parent paths
      // TODO: skip in project spaces and personal space'
      shareQueriesPromises.push(
        shareQueriesQueue.add(() =>
          getShares(queryPath, indirect, { shared_with_me: true, spaceRef }, false)
        )
      )
    })

    return Promise.allSettled(shareQueriesPromises).then(() => {
      shares.value = loadedShares
      resolvePromise(undefined)
    })
  }

  const addShare = async ({
    clientService,
    resource,
    vuexStore,
    path,
    shareWith,
    shareType,
    permissions,
    role,
    storageId,
    expirationDate = undefined,
    notify = undefined,
    shareWithUser = undefined,
    shareWithProvider = undefined
  }: AddShareOptions) => {
    const isGroupShare = shareType === ShareTypes.group.value
    const options = {
      permissions,
      role: role.name,
      expirationDate,
      spaceRef: storageId,
      remoteUser: undefined,
      ...(notify && { notify }),
      ...(shareWithUser && { shareWithUser }),
      ...(shareWithProvider && { shareWithProvider })
    }

    if (!isGroupShare) {
      options.remoteUser = shareType === ShareTypes.remote.value
    }

    const shareMethod = isGroupShare ? 'shareFileWithGroup' : 'shareFileWithUser'
    const share = await clientService.owncloudSdk.shares[shareMethod](path, shareWith, options)
    const builtShare = buildCollaboratorShare(share.shareInfo, resource, unref(allowResharing))

    await awaitLoading()
    upsertShare({ ...builtShare, outgoing: true })
    vuexStore.dispatch('Files/updateFileShareTypes', {
      path,
      outgoingShares: unref(outgoingShares)
    })
    vuexStore.commit('Files/LOAD_INDICATORS', path)
  }

  const updateShare = async ({
    clientService,
    resource,
    share,
    permissions,
    expirationDate,
    role
  }: UpdateShareOptions) => {
    const updatedShare = await clientService.owncloudSdk.shares.updateShare(share.id, {
      role: role.name,
      permissions,
      expireDate: expirationDate
    })

    const builtShare = buildCollaboratorShare(
      updatedShare.shareInfo,
      resource,
      unref(allowResharing)
    )
    upsertShare({ ...builtShare, outgoing: true })
  }

  const deleteShare = async ({
    clientService,
    share,
    path,
    vuexStore,
    loadIndicators = false
  }: DeleteShareOptions) => {
    await clientService.owncloudSdk.shares.deleteShare(share.id, {} as any)
    await awaitLoading()
    removeShare(share)
    vuexStore.dispatch('Files/updateFileShareTypes', {
      path,
      outgoingShares: unref(outgoingShares)
    })
    if (loadIndicators) {
      vuexStore.commit('Files/LOAD_INDICATORS', path)
    }
  }

  const addLink = async ({ path, clientService, params, storageId, vuexStore }: AddLinkOptions) => {
    const { shareInfo } = await clientService.owncloudSdk.shares.shareFileWithLink(path, {
      ...params,
      spaceRef: storageId
    })

    const link = buildShare(shareInfo, null, unref(allowResharing))
    await awaitLoading()

    const selectedFiles = vuexStore.getters['Files/selectedFiles']
    const currentFolder = vuexStore.getters['Files/currentFolder']
    const fileIsSelected =
      selectedFiles.some(({ fileId }) => fileId === storageId) ||
      (selectedFiles.length === 0 && currentFolder.fileId === storageId)

    upsertShare({ ...link, outgoing: true, indirect: !fileIsSelected })
    vuexStore.dispatch('Files/updateFileShareTypes', {
      path,
      outgoingShares: unref(outgoingShares)
    })

    if (!fileIsSelected) {
      // we might need to update the share types for the ancestor resource as well
      const ancestor = vuexStore.getters['runtime/ancestorMetaData/ancestorMetaData'][path] ?? null
      if (ancestor) {
        const { shareTypes } = ancestor
        if (!shareTypes.includes(ShareTypes.link.value)) {
          vuexStore.commit(
            'runtime/ancestorMetaData/UPDATE_ANCESTOR_FIELD',
            {
              path: ancestor.path,
              field: 'shareTypes',
              value: [...shareTypes, ShareTypes.link.value]
            },
            { root: true }
          )
        }
      }
    }

    vuexStore.commit('Files/LOAD_INDICATORS', path)
    return link
  }

  const updateLink = async ({ id, clientService, params }: UpdateLinkOptions) => {
    const { shareInfo } = await clientService.owncloudSdk.shares.updateShare(id, params)
    const link = buildShare(shareInfo, null, unref(allowResharing))
    upsertShare({ ...link, outgoing: true })

    return link
  }

  const deleteLink = async ({
    share,
    clientService,
    path,
    vuexStore,
    loadIndicators = false
  }: DeleteLinkOptions) => {
    await clientService.owncloudSdk.shares.deleteShare(share.id)
    await awaitLoading()
    removeShare(share)
    vuexStore.dispatch('Files/updateFileShareTypes', {
      path,
      outgoingShares: unref(outgoingShares)
    })
    if (loadIndicators) {
      vuexStore.commit('Files/LOAD_INDICATORS', path)
    }
  }

  return {
    loading,
    shares,
    incomingShares,
    incomingCollaborators,
    outgoingShares,
    outgoingLinks,
    outgoingCollaborators,

    pruneShares,
    loadShares,
    addShare,
    updateShare,
    deleteShare,

    addLink,
    updateLink,
    deleteLink
  }
})

export type SharesStore = ReturnType<typeof useSharesStore>
