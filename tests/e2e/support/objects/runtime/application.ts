import { Page } from 'playwright'
import util from 'util'

const appSwitcherButton = '#_appSwitcherButton'
const appSelector = `//ul[contains(@class, "applications-list")]//a[@href="#/%s" or @href="/%s"]`
const notificationsBell = `#oc-notifications-bell`
const notificationsDrop = `#oc-notifications-drop`
const notificationsLoading = `#oc-notifications-drop .oc-notifications-loading`
const markNotificationsAsReadButton = `#oc-notifications-drop .oc-notifications-mark-all`
const notificationItemsMessages = `#oc-notifications-drop .oc-notifications-item .oc-notifications-message`

export class Application {
  #page: Page

  constructor({ page }: { page: Page }) {
    this.#page = page
  }

  async reloadPage(): Promise<void> {
    await this.#page.reload()
  }

  async open({ name }: { name: string }): Promise<void> {
    await this.#page.locator(appSwitcherButton).click()
    await this.#page.locator(util.format(appSelector, name, name)).click()
  }

  async getNotificationMessages(): Promise<string[]> {
    await this.#page.waitForResponse(
      (resp) =>
        resp.url().endsWith('notifications?format=json') &&
        resp.status() === 200 &&
        resp.request().method() === 'GET'
    )
    const dropIsOpen = await this.#page.locator(notificationsDrop).isVisible()
    if (!dropIsOpen) {
      await this.#page.locator(notificationsBell).click()
    }
    await this.#page.waitForSelector(notificationsLoading, { state: 'detached' })
    const result = this.#page.locator(notificationItemsMessages)
    const messages = []
    const count = await result.count()
    for (let i = 0; i < count; i++) {
      messages.push(await result.nth(i).innerText())
    }
    return messages
  }

  async markNotificationsAsRead(): Promise<void> {
    const dropIsOpen = await this.#page.locator(notificationsDrop).isVisible()
    if (!dropIsOpen) {
      await this.#page.locator(notificationsBell).click()
    }
    await this.#page.waitForSelector(notificationsLoading, { state: 'detached' })
    await this.#page.locator(markNotificationsAsReadButton).click()
  }
}
