import VueRouter, { Location } from 'vue-router'
import merge from 'lodash-es/merge'
import get from 'lodash-es/get'
import { RouteMeta } from 'vue-router/types/router'

/**
 * helper function to find out if comparative route location is active or not.
 * it uses vue router resolve to do so.
 *
 * @param router
 * @param comparatives
 */
export const isLocationActive = (
  router: VueRouter,
  ...comparatives: [Location, ...Location[]]
): boolean => {
  const { href: currentHref } = router.resolve(router.currentRoute)
  return (comparatives || [])
    .map((comparative) => {
      const { href: comparativeHref } = router.resolve(comparative)
      return currentHref.startsWith(comparativeHref)
    })
    .some(Boolean)
}

/**
 * wraps isLocationActive to be uses as a closure,
 * the resulting closure then can be used to check a location against the defined set of director locations
 *
 * @param defaultComparatives
 */
export const isLocationActiveDirector = <T extends string>(
  ...defaultComparatives: [Location, ...Location[]]
) => {
  return (router: VueRouter, ...comparatives: T[]): boolean => {
    if (!comparatives.length) {
      return isLocationActive(router, ...defaultComparatives)
    }

    const [first, ...rest] = comparatives.map((name) => {
      const match = defaultComparatives.find((c) => c.name === name)

      if (!match) {
        throw new Error(`unknown comparative '${name}'`)
      }

      return match
    })

    return isLocationActive(router, first, ...rest)
  }
}

/**
 * helper to check if route needs authentication or not
 *
 * @param route
 */
export const isRoutePublic = (route: { meta?: RouteMeta }): boolean => {
  return !get(route, 'meta.auth', true)
}

/**
 * just a dummy function to trick gettext tools
 *
 * @param msg
 */
export function $gettext(msg: string): string {
  return msg
}

/**
 * create a location with attached default values
 *
 * @param name
 * @param locations
 */
export const createLocation = (name: string, ...locations: Location[]): Location =>
  merge(
    {},
    {
      name
    },
    ...locations.map((location) => ({
      ...(location.params && { params: location.params }),
      ...(location.query && { query: location.query })
    }))
  )
