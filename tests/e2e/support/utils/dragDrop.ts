import { readFileSync } from 'fs'
import { Page } from 'playwright'

interface File {
  name: string
  path: string
}

interface FileBuffer {
  name: string
  buffer: Buffer
}

export const dragDropFiles = async (page: Page, resources: File[], targetSelector: string) => {
  const files = resources.map((file) => ({
    name: file.name,
    buffer: readFileSync(file.path)
  }))

  await page.evaluate((files: FileBuffer[]) => {
    const dropArea = document.querySelector(targetSelector)
    const dt = new DataTransfer()

    for (const file of files) {
      dt.items.add(new File([file.buffer.toString()], file.name))
    }

    dropArea.dispatchEvent(new DragEvent('drop', { dataTransfer: dt }))

    return Promise.resolve()
  }, files)
}
