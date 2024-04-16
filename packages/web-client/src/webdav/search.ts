import { SearchResource, buildResource } from '../helpers'
import { WebDavOptions } from './types'
import { DavProperties, DavProperty, DavPropertyValue } from './constants'
import { DAV } from './client'

export type SearchOptions = {
  davProperties?: DavPropertyValue[]
  searchLimit?: number
}

export type SearchResult = {
  resources: SearchResource[]
  totalResults: number
}

export const SearchFactory = (dav: DAV, options: WebDavOptions) => {
  return {
    async search(
      term: string,
      { davProperties = DavProperties.Default, searchLimit }: SearchOptions
    ): Promise<SearchResult> {
      const path = '/spaces/'
      const { range, results } = await dav.report(path, {
        pattern: term,
        limit: searchLimit,
        properties: davProperties
      })

      return {
        resources: results.map((r) => ({
          ...buildResource(r),
          highlights: r.props[DavProperty.Highlights] || ''
        })),
        totalResults: range ? parseInt(range?.split('/')[1]) : null
      }
    }
  }
}
