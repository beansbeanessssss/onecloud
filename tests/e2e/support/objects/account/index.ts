import { Page } from 'playwright'
import * as po from './actions'

export class Account {
  #page: Page

  constructor({ page }: { page: Page }) {
    this.#page = page
  }

  getQuotaValue(): Promise<string> {
    return po.getQuotaValue({ page: this.#page })
  }

  getUserInfo(key: string): Promise<string> {
    return po.getUserInfo({ page: this.#page, key })
  }

  async openAccountPage(): Promise<void> {
    await po.openAccountPage({ page: this.#page })
  }

  async requestGdprExport(): Promise<void> {
    await po.requestGdprExport({ page: this.#page })
  }

  downloadGdprExport(): Promise<string> {
    return po.downloadGdprExport({ page: this.#page })
  }
}
