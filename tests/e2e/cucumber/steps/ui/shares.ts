import { DataTable, Then, When } from '@cucumber/cucumber'
import { expect } from '@playwright/test'
import { World } from '../../environment'
import { objects } from '../../../support'
import { ICollaborator } from '../../../support/objects/app-files/share/collaborator'

const parseShareTable = function (stepTable: DataTable, usersEnvironment) {
  return stepTable.hashes().reduce((acc, stepRow) => {
    const { resource, recipient, type, role, resourceType } = stepRow

    if (!acc[resource]) {
      acc[resource] = []
    }

    acc[resource].push({
      collaborator:
        type === 'group'
          ? usersEnvironment.getGroup({ key: recipient })
          : usersEnvironment.getUser({ key: recipient }),
      role,
      type,
      resourceType
    })

    return acc
  }, {})
}

When(
  /^"([^"]*)" shares the following (resource|resources) using the (sidebar panel|quick action)$/,
  async function (
    this: World,
    stepUser: string,
    _: string,
    actionType: string,
    stepTable: DataTable
  ) {
    const { page } = this.actorsEnvironment.getActor({ key: stepUser })
    const shareObject = new objects.applicationFiles.Share({ page })
    const shareInfo = parseShareTable(stepTable, this.usersEnvironment)

    for (const resource of Object.keys(shareInfo)) {
      await shareObject.create({
        resource,
        recipients: shareInfo[resource],
        via: actionType === 'quick action' ? 'QUICK_ACTION' : 'SIDEBAR_PANEL'
      })
    }
  }
)

When(
  /^"([^"]*)" reshares the following (resource|resources)$/,
  async function (this: World, stepUser: string, _: string, stepTable: DataTable) {
    const { page } = this.actorsEnvironment.getActor({ key: stepUser })
    const shareObject = new objects.applicationFiles.Share({ page })
    const shareInfo = parseShareTable(stepTable, this.usersEnvironment)

    for (const resource of Object.keys(shareInfo)) {
      await shareObject.create({
        resource,
        recipients: shareInfo[resource]
      })
    }
  }
)

When(
  '{string} accepts the following share(s)',
  async function (this: World, stepUser: string, stepTable: DataTable) {
    const { page } = this.actorsEnvironment.getActor({ key: stepUser })
    const shareObject = new objects.applicationFiles.Share({ page })

    for (const info of stepTable.hashes()) {
      await shareObject.accept({ resource: info.name })
    }
  }
)

When(
  '{string} updates following sharee role(s)',
  async function (this: World, stepUser: string, stepTable: DataTable) {
    const { page } = this.actorsEnvironment.getActor({ key: stepUser })
    const shareObject = new objects.applicationFiles.Share({ page })
    const shareInfo = parseShareTable(stepTable, this.usersEnvironment)

    for (const resource of Object.keys(shareInfo)) {
      await shareObject.changeShareeRole({
        resource,
        recipients: shareInfo[resource]
      })
    }
  }
)

When(
  '{string} removes following sharee(s)',
  async function (this: World, stepUser: string, stepTable: DataTable) {
    const { page } = this.actorsEnvironment.getActor({ key: stepUser })
    const shareObject = new objects.applicationFiles.Share({ page })
    const shareInfo = parseShareTable(stepTable, this.usersEnvironment)

    for (const resource of Object.keys(shareInfo)) {
      await shareObject.removeSharee({ resource, recipients: shareInfo[resource] })
    }
  }
)

Then(
  '{string} should see the following recipient(s)',
  async function (this: World, stepUser: string, stepTable: DataTable) {
    const { page } = this.actorsEnvironment.getActor({ key: stepUser })
    const shareObject = new objects.applicationFiles.Share({ page })
    const shareInfo = parseShareTable(stepTable, this.usersEnvironment)

    for (const resource of Object.keys(shareInfo)) {
      await shareObject.checkSharee({ resource, recipients: shareInfo[resource] })
    }
  }
)

Then(
  /"([^"]*)" should( not | )be able to reshare the following resource(s)?$/,
  async function (
    this: World,
    stepUser: string,
    condition: string,
    _: string,
    stepTable: DataTable
  ) {
    const ableToShare = condition.trim() !== 'not'
    const { page } = this.actorsEnvironment.getActor({ key: stepUser })
    const shareObject = new objects.applicationFiles.Share({ page })

    for (const { resource } of stepTable.hashes()) {
      const hasSharePermission = await shareObject.hasPermissionToShare(resource)
      expect(hasSharePermission).toBe(ableToShare)
    }
  }
)

When(
  '{string} navigates to the shared with me page',
  async function (this: World, stepUser: string): Promise<void> {
    const { page } = this.actorsEnvironment.getActor({ key: stepUser })
    const pageObject = new objects.applicationFiles.page.shares.WithMe({ page })
    await pageObject.navigate()
  }
)

When(
  '{string} declines the following share(s)',
  async function (this: World, stepUser: string, stepTable: DataTable): Promise<void> {
    const { page } = this.actorsEnvironment.getActor({ key: stepUser })
    const shareObject = new objects.applicationFiles.Share({ page })

    for (const resource of stepTable.hashes()) {
      await shareObject.declineShare({ resource: resource.name })
    }
  }
)

When(
  '{string} accepts the following share(s) from the context menu',
  async function (this: World, stepUser: string, stepTable: DataTable): Promise<void> {
    const { page } = this.actorsEnvironment.getActor({ key: stepUser })
    const shareObject = new objects.applicationFiles.Share({ page })

    for (const resource of stepTable.hashes()) {
      await shareObject.accept({ resource: resource.name, via: 'CONTEXT_MENU' })
    }
  }
)

When(
  '{string} declines the following share from the context menu',
  async function (this: World, stepUser: string, stepTable: DataTable): Promise<void> {
    const { page } = this.actorsEnvironment.getActor({ key: stepUser })
    const shareObject = new objects.applicationFiles.Share({ page })

    for (const resource of stepTable.hashes()) {
      await shareObject.declineShare({ resource: resource.name, via: 'CONTEXT_MENU' })
    }
  }
)

When(
  '{string} copies quick link of the resource {string} from the context menu',
  async function (this: World, stepUser: string, resource: string): Promise<void> {
    const { page } = this.actorsEnvironment.getActor({ key: stepUser })
    const shareObject = new objects.applicationFiles.Share({ page })
    await shareObject.copyQuickLink({
      resource,
      via: 'CONTEXT_MENU'
    })
  }
)

When(
  '{string} should not be able to open the folder/file {string}',
  async function (this: World, stepUser: string, resource: string): Promise<void> {
    const { page } = this.actorsEnvironment.getActor({ key: stepUser })
    const shareObject = new objects.applicationFiles.Share({ page })
    expect(await shareObject.resourceIsNotOpenable(resource)).toBe(true)
  }
)

Then(
  /"([^"]*)" should( not | )be able to see the following shares$/,
  async function (
    this: World,
    stepUser: string,
    condition: string,
    stepTable: DataTable
  ): Promise<void> {
    const shouldExist = condition.trim() !== 'not'
    const { page } = this.actorsEnvironment.getActor({ key: stepUser })
    const shareObject = new objects.applicationFiles.Share({ page })
    for (const { resource, owner } of stepTable.hashes()) {
      const isAcceptedSharePresent = await shareObject.isAcceptedSharePresent(resource, owner)
      expect(isAcceptedSharePresent, '${resource} does not exist in accepted share').toBe(
        shouldExist
      )
    }
  }
)

When(
  /^"([^"]*)" (grants|denies) access to the following resources(s)? for (group|user) "([^"]*)" using the sidebar panel?$/,
  async function (
    this: World,
    stepUser: string,
    actionType: string,
    _: unknown,
    collaboratorType: 'user' | 'group',
    collaborator: string,
    stepTable: DataTable
  ): Promise<void> {
    const { page } = this.actorsEnvironment.getActor({ key: stepUser })
    const shareObject = new objects.applicationFiles.Share({ page })

    for (const { resource } of stepTable.hashes()) {
      await shareObject.setDenyShare({
        resource,
        deny: actionType === 'denies',
        collaborator: {
          collaborator:
            collaboratorType === 'group'
              ? this.usersEnvironment.getGroup({ key: collaborator })
              : this.usersEnvironment.getUser({ key: collaborator }),
          type: collaboratorType
        } as ICollaborator
      })
    }
  }
)
