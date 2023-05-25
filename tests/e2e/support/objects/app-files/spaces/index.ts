import { Page } from 'playwright'
import { SpacesEnvironment, LinksEnvironment } from '../../../environment'
import { File } from '../../../types'
import * as po from './actions'
import { spaceWithSpaceIDNotExist } from './utils'
import { ICollaborator } from '../share/collaborator'

export class Spaces {
  #page: Page
  #spacesEnvironment: SpacesEnvironment
  #linksEnvironment: LinksEnvironment

  constructor({ page }: { page: Page }) {
    this.#page = page
    this.#spacesEnvironment = new SpacesEnvironment()
    this.#linksEnvironment = new LinksEnvironment()
  }

  async create({
    key,
    space
  }: {
    key: string
    space: Omit<po.createSpaceArgs, 'page'>
  }): Promise<void> {
    const id = await po.createSpace({ ...space, page: this.#page })
    this.#spacesEnvironment.createSpace({ key, space: { name: space.name, id } })
  }

  async open({ key }: { key: string }): Promise<void> {
    const { id } = this.#spacesEnvironment.getSpace({ key })
    await po.openSpace({ page: this.#page, id })
  }

  async changeName({ key, value }: { key: string; value: string }): Promise<void> {
    const { id } = this.#spacesEnvironment.getSpace({ key })
    await po.changeSpaceName({ id, value, page: this.#page })
  }

  async changeSubtitle({ key, value }: { key: string; value: string }): Promise<void> {
    const { id } = this.#spacesEnvironment.getSpace({ key })
    await po.changeSpaceSubtitle({ id, value, page: this.#page })
  }

  async changeDescription({ value }: { value: string }): Promise<void> {
    await po.changeSpaceDescription({ value, page: this.#page })
  }

  async changeQuota({ key, value }: { key: string; value: string }): Promise<void> {
    const { id } = this.#spacesEnvironment.getSpace({ key })
    await po.changeQuota({ id, value, page: this.#page })
  }

  async addMembers(args: Omit<po.SpaceMembersArgs, 'page'>): Promise<void> {
    await po.addSpaceMembers({ ...args, page: this.#page })
  }

  async removeAccessToMember(args: Omit<po.removeAccessMembersArgs, 'page'>): Promise<void> {
    await po.removeAccessSpaceMembers({ ...args, page: this.#page })
  }

  getSpaceID({ key }: { key: string }): string {
    const { id } = this.#spacesEnvironment.getSpace({ key })
    return id
  }

  async expectThatSpacesIdNotExist(spaceID: string): Promise<void> {
    await spaceWithSpaceIDNotExist({ spaceID, page: this.#page })
  }

  async canUserEditResource(args: Omit<po.canUserEditSpaceResourceArgs, 'page'>): Promise<boolean> {
    const startUrl = this.#page.url()
    const canEdit = await po.canUserEditSpaceResource({ ...args, page: this.#page })
    await this.#page.goto(startUrl)
    return canEdit
  }

  async changeRoles(args: Omit<po.SpaceMembersArgs, 'page'>): Promise<void> {
    await po.changeSpaceRole({ ...args, page: this.#page })
  }

  async reloadPage(): Promise<void> {
    await po.reloadSpacePage(this.#page)
  }

  async changeSpaceImage({ key, resource }: { key: string; resource: File }): Promise<void> {
    const { id } = this.#spacesEnvironment.getSpace({ key })
    await po.changeSpaceImage({ id, resource, page: this.#page })
  }

  async createPublicLink(): Promise<void> {
    const url = await po.createPublicLinkForSpace({ page: this.#page })
    this.#linksEnvironment.createLink({
      key: 'Link',
      link: { name: 'Link', url }
    })
  }

  async addExpirationDate({
    member,
    expirationDate
  }: {
    member: Omit<ICollaborator, 'role'>
    expirationDate: string
  }): Promise<void> {
    await po.addExpirationDateToMember({ member, expirationDate, page: this.#page })
  }

  async removeExpirationDate({ member }: { member: Omit<ICollaborator, 'role'> }): Promise<void> {
    await po.removeExpirationDateFromMember({ member, page: this.#page })
  }
}
