import { unref } from '@vue/composition-api'
import { useClientService } from '../clientService'
import type { Store } from 'vuex'
import type { Route } from 'vue-router'
import type { Method, AxiosRequestConfig, AxiosResponse } from 'axios'
import { ClientService } from '../../services'
import { useAccessToken, usePublicLinkPassword, usePublicLinkToken, usePublicLinkContext } from './'
import { useStore } from '../store'
import { useRoute } from '../router'

interface RequestOptions {
  store?: Store<any>
  clientService?: ClientService
  currentRoute?: Route
}

export interface RequestResult {
  makeRequest(method: Method, url: string, config: AxiosRequestConfig): Promise<AxiosResponse>
}

export function useRequest(options: RequestOptions = {}): RequestResult {
  const clientService = options.clientService ?? useClientService()
  const store = options.store ?? useStore()
  const currentRoute = options.currentRoute ?? useRoute()

  const isPublicLinkContext = usePublicLinkContext({ currentRoute })
  const publicLinkPassword = usePublicLinkPassword({ store })
  const accessToken = useAccessToken({ store })
  const publicToken = usePublicLinkToken({ currentRoute })

  const makeRequest = (
    method: Method,
    url: string,
    config: AxiosRequestConfig
  ): Promise<AxiosResponse> => {
    let httpClient
    if (unref(accessToken)) {
      httpClient = clientService.httpAuthenticated(unref(accessToken))
    } else {
      httpClient = clientService.httpUnAuthenticated
    }

    config = config || {}
    config.headers = config.headers || {}

    if (unref(isPublicLinkContext)) {
      if (unref(publicLinkPassword)) {
        config.headers.Authorization =
          'Basic ' + Buffer.from(['public', unref(publicLinkPassword)].join(':')).toString('base64')
      }
      if (unref(publicToken)) {
        config.headers['public-token'] = unref(publicToken)
      }
    }

    config.method = method
    config.url = url

    return httpClient.request(config)
  }

  return {
    makeRequest
  }
}
