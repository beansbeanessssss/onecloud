import { useScrollTo } from '@ownclouders/web-pkg/src/composables/scrollTo'

export const useScrollToMock = (
  options: Partial<ReturnType<typeof useScrollTo>> = {}
): ReturnType<typeof useScrollTo> => {
  return {
    scrollToResource: jest.fn(),
    scrollToResourceFromRoute: jest.fn(),
    ...options
  }
}
