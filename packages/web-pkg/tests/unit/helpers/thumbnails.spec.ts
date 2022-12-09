import { Resource } from 'web-client/src'
import { isResourceTxtFileAlmostEmpty } from '../../../src/helpers'

describe('thumbnails', () => {
  describe('isResourceTxtFileAlmostEmpty', () => {
    it('return true for resources smaller 30 bytes', () => {
      expect(isResourceTxtFileAlmostEmpty({ mimeType: 'text/plain', size: 20 } as Resource)).toBe(
        true
      )
    })
    it('return false for resources larger 30 bytes', () => {
      expect(isResourceTxtFileAlmostEmpty({ mimeType: 'text/plain', size: 35 } as Resource)).toBe(
        false
      )
    })
    it('return false for resources that are not text', () => {
      expect(
        isResourceTxtFileAlmostEmpty({ mimeType: 'application/json', size: 35 } as Resource)
      ).toBe(false)
    })
    it('return false for resources that have undefined mimeType', () => {
      expect(isResourceTxtFileAlmostEmpty({ mimeType: undefined, size: 35 } as Resource)).toBe(
        false
      )
    })
  })
})
