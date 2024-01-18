import { Resource } from '@ownclouders/web-client'
import { ClientService } from '../../../services'
import { AncestorMetaData } from '../../../types'
import { Share, ShareRole, ShareTypes } from '@ownclouders/web-client/src/helpers'
import { Store } from 'vuex'

export interface LoadSharesOptions {
  clientService: ClientService
  resource: Resource
  path: string
  storageId: string
  ancestorMetaData: AncestorMetaData
  useCached?: boolean
}

export interface AddShareOptions {
  clientService: ClientService
  resource: Resource
  path: string
  shareWith: string
  shareType: ShareTypes
  permissions: number
  role: ShareRole
  storageId: string
  vuexStore: Store<any>
  expirationDate?: string
  notify?: boolean
  shareWithUser?: string
  shareWithProvider?: string
}

export interface UpdateShareOptions {
  clientService: ClientService
  resource: Resource
  share: Share
  permissions: number
  expirationDate: string
  role: ShareRole
}

export interface DeleteShareOptions {
  clientService: ClientService
  share: Share
  path: string
  vuexStore: Store<any>
  loadIndicators?: boolean
}

export interface AddLinkOptions {
  clientService: ClientService
  path: string
  params: any
  storageId: string
  vuexStore: Store<any>
}

export interface UpdateLinkOptions {
  clientService: ClientService
  id: string
  params: any
}

export interface DeleteLinkOptions {
  clientService: ClientService
  share: Share
  path: string
  vuexStore: Store<any>
  loadIndicators?: boolean
}
