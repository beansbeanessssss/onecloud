import { Page } from 'playwright'
import * as po from './actions'
import { LinksEnvironment } from '../../../environment'

export class Link {
  #page: Page
  #linksEnvironment: LinksEnvironment

  constructor({ page }: { page: Page }) {
    this.#page = page
    this.#linksEnvironment = new LinksEnvironment()
  }

  roleDisplayText = {
    'Invited people': 'Only for invited people',
    'Can view': 'Anyone with the link can view',
    'Can upload': 'Anyone with the link can upload',
    'Can edit': 'Anyone with the link can edit',
    'Secret File Drop': 'Secret File drop'
  }
  async create(args: Omit<po.createLinkArgs, 'page'>): Promise<void> {
    const startUrl = this.#page.url()
    const url = await po.createLink({ ...args, page: this.#page })

    this.#linksEnvironment.createLink({
      key: args.name,
      link: { name: args.name, url }
    })

    await this.#page.goto(startUrl)
  }

  async changeName(args: Omit<po.changeNameArgs, 'page'>): Promise<string> {
    const startUrl = this.#page.url()
    const name = await po.changeName({ page: this.#page, ...args })
    const currentLink = this.#linksEnvironment.getLink({ name: 'Link' })

    this.#linksEnvironment.updateLinkName({
      key: currentLink.name,
      link: { ...currentLink, name }
    })
    await this.#page.goto(startUrl)
    return name
  }

  async addExpiration(args: Omit<po.addExpirationArgs, 'page'>): Promise<void> {
    const startUrl = this.#page.url()
    await po.addExpiration({ page: this.#page, ...args })
    await this.#page.goto(startUrl)
  }

  async addPassword(args: Omit<po.addPasswordArgs, 'page'>): Promise<void> {
    const startUrl = this.#page.url()
    await po.addPassword({ page: this.#page, ...args })
    await this.#page.goto(startUrl)
  }

  async fillPassword(args: Omit<po.addPasswordArgs, 'page'>): Promise<void> {
    await po.fillPassword({ page: this.#page, ...args })
  }

  async showOrHidePassword(args): Promise<void> {
    return po.showOrHidePassword({ page: this.#page, ...args })
  }

  async copyEnteredPassword(): Promise<void> {
    return po.copyEnteredPassword(this.#page)
  }

  async generatePassword(): Promise<void> {
    return po.generatePassword(this.#page)
  }

  async setPassword(): Promise<void> {
    return po.setPassword(this.#page)
  }

  async changeRole(args: Omit<po.changeRoleArgs, 'page'>): Promise<string> {
    const startUrl = this.#page.url()
    const role = await po.changeRole({ page: this.#page, ...args })
    await this.#page.goto(startUrl)
    return role
  }

  async delete(args: Omit<po.deleteLinkArgs, 'page'>): Promise<void> {
    const startUrl = this.#page.url()
    await po.deleteLink({ ...args, page: this.#page })
    await this.#page.goto(startUrl)
  }

  getPublicLinkUrl(
    args: Omit<po.publicLinkAndItsEditButtonVisibilityArgs, 'page'>
  ): Promise<string> {
    return po.getPublicLinkVisibility({
      ...args,
      page: this.#page
    })
  }

  async islinkEditButtonVisibile(linkName): Promise<boolean> {
    return await po.getLinkEditButtonVisibility({ page: this.#page, linkName })
  }

  async checkErrorMessage(): Promise<string> {
    return await po.getPublicLinkPasswordErrorMessage(this.#page)
  }

  async clickOnCancelButton(): Promise<void> {
    await po.clickOnCancelButton(this.#page)
  }
}
