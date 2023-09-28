import { useSort } from '@ownclouders/web-pkg'
import { ref } from 'vue'

export const useSortMock = (
  options: Partial<ReturnType<typeof useSort>> = {}
): ReturnType<typeof useSort> => {
  return {
    items: ref([]),
    sortBy: ref('name'),
    sortDir: undefined,
    handleSort: jest.fn(),
    ...options
  }
}
