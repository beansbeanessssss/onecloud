import { DataTable, Then, When } from '@cucumber/cucumber'
import { World } from '../../environment'
import { objects } from '../../../support'
import { expect } from '@playwright/test'

Then(
  /^"([^"]*)" (should|should not) see the following space(s)?$/,
  async function (
    this: World,
    stepUser: string,
    actionType: string,
    _: string,
    stepTable: DataTable
  ): Promise<void> {
    const { page } = this.actorsEnvironment.getActor({ key: stepUser })
    const spacesObject = new objects.applicationAdminSettings.Spaces({ page })
    const actualList = await spacesObject.getDisplayedSpaces()

    for (const info of stepTable.hashes()) {
      const space = await spacesObject.getSpace({ key: info.id })
      const found = actualList.includes(space.id)
      if (actionType === 'should') {
        expect(found).toBe(true)
      } else {
        expect(found).toBe(false)
      }
    }
  }
)

When(
  /^"([^"]*)" (disables|deletes|enables) the space "([^"]*)" using the context-menu$/,
  async function (this: World, stepUser: string, action: string, key: string): Promise<void> {
    const { page } = this.actorsEnvironment.getActor({ key: stepUser })
    const spacesObject = new objects.applicationAdminSettings.Spaces({ page })
    const spaceId = spacesObject.getUUID({ key })
    switch (action) {
      case 'disables':
        await spacesObject.disable({ spaceIds: [spaceId], context: 'context-menu' })
        break
      case 'deletes':
        await spacesObject.delete({ spaceIds: [spaceId], context: 'context-menu' })
        break
      case 'enables':
        await spacesObject.enable({ spaceIds: [spaceId], context: 'context-menu' })
        break
      default:
        throw new Error(`${action} not implemented`)
    }
  }
)

When(
  /^"([^"]*)" (changes|updates) the space "([^"]*)" (name|subtitle|quota) to "([^"]*)" using the context-menu$/,
  async function (
    this: World,
    stepUser: string,
    _: string,
    key: string,
    action: string,
    value: string
  ): Promise<void> {
    const { page } = this.actorsEnvironment.getActor({ key: stepUser })
    const spacesObject = new objects.applicationAdminSettings.Spaces({ page })
    const spaceId = spacesObject.getUUID({ key })
    switch (action) {
      case 'name':
        await spacesObject.rename({ key, value })
        break
      case 'subtitle':
        await spacesObject.changeSubtitle({ key, value })
        break
      case 'quota':
        await spacesObject.changeQuota({ spaceIds: [spaceId], value, context: 'context-menu' })
        break
      default:
        throw new Error(`'${action}' not implemented`)
    }
  }
)

When(
  /^"([^"]*)" (?:changes|updates) quota of the following space(?:s)? to "([^"]*)" using the batch-actions$/,
  async function (
    this: World,
    stepUser: string,
    value: string,
    stepTable: DataTable
  ): Promise<void> {
    const { page } = this.actorsEnvironment.getActor({ key: stepUser })
    const spacesObject = new objects.applicationAdminSettings.Spaces({ page })
    const spaceIds = []
    for (const { id: space } of stepTable.hashes()) {
      spaceIds.push(spacesObject.getUUID({ key: space }))
      await spacesObject.select({ key: space })
    }
    await spacesObject.changeQuota({
      spaceIds,
      value,
      context: 'batch-actions'
    })
  }
)

When(
  /^"([^"]*)" (disables|enables|deletes) the following space(?:s)? using the batch-actions$/,
  async function (
    this: World,
    stepUser: string,
    action: string,
    stepTable: DataTable
  ): Promise<void> {
    const { page } = this.actorsEnvironment.getActor({ key: stepUser })
    const spacesObject = new objects.applicationAdminSettings.Spaces({ page })
    const spaceIds = []
    for (const { id: space } of stepTable.hashes()) {
      spaceIds.push(spacesObject.getUUID({ key: space }))
      await spacesObject.select({ key: space })
    }
    switch (action) {
      case 'disables':
        await spacesObject.disable({ spaceIds, context: 'batch-actions' })
        break
      case 'deletes':
        await spacesObject.delete({ spaceIds, context: 'batch-actions' })
        break
      case 'enables':
        await spacesObject.enable({ spaceIds, context: 'batch-actions' })
        break
      default:
        throw new Error(`'${action}' not implemented`)
    }
  }
)

When(
  '{string} navigates to the users management page',
  async function (this: World, stepUser: string): Promise<void> {
    const { page } = this.actorsEnvironment.getActor({ key: stepUser })
    const pageObject = new objects.applicationAdminSettings.page.Users({ page })
    await pageObject.navigate()
  }
)

When(
  /^"([^"]*)" (allows|forbids) the login for the following user "([^"]*)" using the sidebar panel$/,
  async function (this: World, stepUser: string, action: string, key: string): Promise<void> {
    const { page } = this.actorsEnvironment.getActor({ key: stepUser })
    const usersObject = new objects.applicationAdminSettings.Users({ page })

    switch (action) {
      case 'allows':
        await usersObject.allowLogin({ key, action: 'context-menu' })
        break
      case 'forbids':
        await usersObject.forbidLogin({ key, action: 'context-menu' })
        break
      default:
        throw new Error(`${action} not implemented`)
    }
  }
)

When(
  '{string} navigates to the general management page',
  async function (this: World, stepUser: string): Promise<void> {
    const { page } = this.actorsEnvironment.getActor({ key: stepUser })
    const pageObject = new objects.applicationAdminSettings.page.General({ page })
    await pageObject.navigate()
  }
)

Then(
  '{string} should be able to upload a logo from the local file {string}',
  async function (this: World, stepUser: string, localFile: string): Promise<void> {
    const { page } = this.actorsEnvironment.getActor({ key: stepUser })
    const generalObject = new objects.applicationAdminSettings.General({ page })
    const logoPath = this.filesEnvironment.getFile({ name: localFile.split('/').pop() }).path
    await generalObject.uploadLogo({ path: logoPath })
  }
)

Then(
  '{string} should be able to reset the logo',
  async function (this: World, stepUser: string): Promise<void> {
    const { page } = this.actorsEnvironment.getActor({ key: stepUser })
    const generalObject = new objects.applicationAdminSettings.General({ page })
    await generalObject.resetLogo()
  }
)

When(
  /^"([^"]*)" changes the quota of the user "([^"]*)" to "([^"]*)" using the sidebar panel$/,
  async function (this: World, stepUser: string, key: string, value: string): Promise<void> {
    const { page } = this.actorsEnvironment.getActor({ key: stepUser })
    const usersObject = new objects.applicationAdminSettings.Users({ page })
    await usersObject.changeQuota({ key, value, action: 'context-menu' })
  }
)

When(
  /^"([^"]*)" changes the quota to "([^"]*)" for users using the batch action$/,
  async function (
    this: World,
    stepUser: string,
    value: string,
    stepTable: DataTable
  ): Promise<void> {
    const { page } = this.actorsEnvironment.getActor({ key: stepUser })
    const usersObject = new objects.applicationAdminSettings.Users({ page })
    const userIds = []
    for (const { id: user } of stepTable.hashes()) {
      userIds.push(usersObject.getUUID({ key: user }))
      await usersObject.selectUser({ key: user })
    }
    await usersObject.changeQuotaUsingBatchAction({ value, userIds })
  }
)

Then(
  /^"([^"]*)" (should see|should not see) the following user(s)$/,
  async function (
    this: World,
    stepUser: string,
    action: string,
    _: string,
    stepTable: DataTable
  ): Promise<void> {
    const { page } = this.actorsEnvironment.getActor({ key: stepUser })
    const usersObject = new objects.applicationAdminSettings.Users({ page })
    const users = await usersObject.getDisplayedUsers()
    for (const { user } of stepTable.hashes()) {
      switch (action) {
        case 'should see':
          expect(users).toContain(usersObject.getUUID({ key: user }))
          break
        case 'should not see':
          expect(users).not.toContain(usersObject.getUUID({ key: user }))
          break
        default:
          throw new Error(`'${action}' not implemented`)
      }
    }
  }
)

When(
  '{string} sets the following filter(s)',
  async function (this: World, stepUser: string, stepTable: DataTable): Promise<void> {
    const { page } = this.actorsEnvironment.getActor({ key: stepUser })
    const usersObject = new objects.applicationAdminSettings.Users({ page })

    for (const { filter, values } of stepTable.hashes()) {
      await usersObject.filter({ filter, values: values.split(',') })
    }
  }
)

When(
  /^"([^"]*)" (adds|removes) the following users (to|from) the groups "([^"]*)" using the batch actions$/,
  async function (
    this: World,
    stepUser: string,
    action: string,
    _: string,
    groups: string,
    stepTable: DataTable
  ): Promise<void> {
    const { page } = this.actorsEnvironment.getActor({ key: stepUser })
    const usersObject = new objects.applicationAdminSettings.Users({ page })
    const userIds = []

    for (const { user } of stepTable.hashes()) {
      userIds.push(usersObject.getUUID({ key: user }))
      await usersObject.select({ key: user })
    }

    switch (action) {
      case 'adds':
        await usersObject.addToGroupsBatchAtion({ userIds, groups: groups.split(',') })
        break
      case 'removes':
        await usersObject.removeFromGroupsBatchAtion({ userIds, groups: groups.split(',') })
        break
      default:
        throw new Error(`'${action}' not implemented`)
    }
  }
)

When(
  /^"([^"]*)" changes (userName|displayName|email|password|role) to "([^"]*)" for user "([^"]*)" using the sidebar panel$/,
  async function (
    this: World,
    stepUser: string,
    attribute: string,
    value: string,
    user: string
  ): Promise<void> {
    const { page } = this.actorsEnvironment.getActor({ key: stepUser })
    const usersObject = new objects.applicationAdminSettings.Users({ page })

    await usersObject.changeUser({
      key: user,
      attribute: attribute,
      value: value,
      action: 'context-menu'
    })
  }
)

When(
  /^"([^"]*)" (adds|removes) the user "([^"]*)" (to|from) the (group|groups) "([^"]*)" using the sidebar panel$/,
  async function (
    this: World,
    stepUser: string,
    action: string,
    user: string,
    _: string,
    __: string,
    groups: string
  ): Promise<void> {
    const { page } = this.actorsEnvironment.getActor({ key: stepUser })
    const usersObject = new objects.applicationAdminSettings.Users({ page })
    switch (action) {
      case 'adds':
        await usersObject.addToGroups({
          key: user,
          groups: groups.split(','),
          action: 'context-menu'
        })
        break
      case 'removes':
        await usersObject.removeFromGroups({
          key: user,
          groups: groups.split(','),
          action: 'context-menu'
        })
        break
      default:
        throw new Error(`'${action}' not implemented`)
    }
  }
)

When(
  /^"([^"]*)" deletes the following (?:user|users) using the (batch actions|context menu)$/,
  async function (
    this: World,
    stepUser: string,
    actionType: string,
    stepTable: DataTable
  ): Promise<void> {
    const { page } = this.actorsEnvironment.getActor({ key: stepUser })
    const usersObject = new objects.applicationAdminSettings.Users({ page })
    const userIds = []
    switch (actionType) {
      case 'batch actions':
        for (const { id: user } of stepTable.hashes()) {
          userIds.push(usersObject.getUUID({ key: user }))
          await usersObject.selectUser({ key: user })
        }
        await usersObject.deleteUserUsingBatchAction({ userIds })
        break
      case 'context menu':
        for (const { user } of stepTable.hashes()) {
          await usersObject.deleteUserUsingContextMenu({ key: user })
        }
        break
      default:
        throw new Error(`'${actionType}' not implemented`)
    }
  }
)

When(
  '{string} navigates to the groups management page',
  async function (this: World, stepUser: string): Promise<void> {
    const { page } = this.actorsEnvironment.getActor({ key: stepUser })
    const groupsObject = new objects.applicationAdminSettings.page.Groups({ page })
    await groupsObject.navigate()
  }
)

When(
  '{string} creates the following group(s)',
  async function (this: World, stepUser: string, stepTable: DataTable): Promise<void> {
    const { page } = this.actorsEnvironment.getActor({ key: stepUser })
    const groupsObject = new objects.applicationAdminSettings.Groups({ page })

    for (const info of stepTable.hashes()) {
      await groupsObject.createGroup({ key: info.id })
    }
  }
)

When(
  /^"([^"]*)" changes (displayName) to "([^"]*)" for group "([^"]*)" using the sidebar panel$/,
  async function (
    this: World,
    stepUser: string,
    attribute: string,
    value: string,
    user: string
  ): Promise<void> {
    const { page } = this.actorsEnvironment.getActor({ key: stepUser })
    const groupsObject = new objects.applicationAdminSettings.Groups({ page })

    await groupsObject.changeGroup({
      key: user,
      attribute: attribute,
      value: value,
      action: 'context-menu'
    })
  }
)

Then(
  /^"([^"]*)" (should see|should not see) the following group(?:s)?$/,
  async function (
    this: World,
    stepUser: string,
    action: string,
    stepTable: DataTable
  ): Promise<void> {
    const { page } = this.actorsEnvironment.getActor({ key: stepUser })
    const groupsObject = new objects.applicationAdminSettings.Groups({ page })
    const groups = await groupsObject.getDisplayedGroups()

    for (const { group } of stepTable.hashes()) {
      switch (action) {
        case 'should see':
          expect(groups).toContain(groupsObject.getUUID({ key: group }))
          break
        case 'should not see':
          expect(groups).not.toContain(groupsObject.getUUID({ key: group }))
          break
        default:
          throw new Error(`${action} not implemented`)
      }
    }
  }
)

When(
  '{string} creates the following user(s)',
  async function (this: World, stepUser: string, stepTable: DataTable): Promise<void> {
    const { page } = this.actorsEnvironment.getActor({ key: stepUser })
    const usersObject = new objects.applicationAdminSettings.Users({ page })
    for (const info of stepTable.hashes()) {
      await usersObject.createUser({
        name: info.name,
        displayname: info.displayname,
        email: info.email,
        password: info.password
      })
    }
  }
)

When(
  /^"([^"]*)" deletes the following (?:group|groups) using the (batch actions|context menu)$/,
  async function (
    this: World,
    stepUser: string,
    actionType: string,
    stepTable: DataTable
  ): Promise<void> {
    const { page } = this.actorsEnvironment.getActor({ key: stepUser })
    const groupsObject = new objects.applicationAdminSettings.Groups({ page })
    const groupIds = []

    switch (actionType) {
      case 'batch actions':
        for (const { group } of stepTable.hashes()) {
          groupIds.push(groupsObject.getUUID({ key: group }))
          await groupsObject.selectGroup({ key: group })
        }
        await groupsObject.deleteGroupUsingBatchAction({ groupIds })
        break
      case 'context menu':
        for (const { group } of stepTable.hashes()) {
          await groupsObject.deleteGroupUsingContextMenu({ key: group })
        }
        break
      default:
        throw new Error(`'${actionType}' not implemented`)
    }
  }
)

When(
  /^"([^"]*)" opens the edit panel of user "([^"]*)" using the (quick action|context menu)$/,
  async function (this: World, stepUser: string, actionUser: string, action: string) {
    const { page } = this.actorsEnvironment.getActor({ key: stepUser })
    const usersObject = new objects.applicationAdminSettings.Users({ page })
    await usersObject.openEditPanel({ key: actionUser, action: action.replace(' ', '-') })
  }
)

Then('{string} should see the edit panel', async function (this: World, stepUser: string) {
  const { page } = this.actorsEnvironment.getActor({ key: stepUser })
  const usersObject = new objects.applicationAdminSettings.Users({ page })
  await usersObject.waitForEditPanelToBeVisible()
})

When(
  '{string} lists the members of project space {string} using a sidebar panel',
  async function (this: World, stepUser: string, key: string): Promise<void> {
    const { page } = this.actorsEnvironment.getActor({ key: stepUser })
    const spacesObject = new objects.applicationAdminSettings.Spaces({ page })
    await spacesObject.openPanel({ key })
    await spacesObject.openActionSideBarPanel({ action: 'SpaceMembers' })
  }
)

Then(
  '{string} should see the following users in the sidebar panel of spaces admin settings',
  async function (this: World, stepUser: string, stepTable: DataTable): Promise<void> {
    const { page } = this.actorsEnvironment.getActor({ key: stepUser })
    const spacesObject = new objects.applicationAdminSettings.Spaces({ page })
    const actualMemberList = {
      manager: await spacesObject.listMembers({ filter: 'managers' }),
      viewer: await spacesObject.listMembers({ filter: 'viewers' }),
      editor: await spacesObject.listMembers({ filter: 'editors' })
    }
    for (const info of stepTable.hashes()) {
      expect(actualMemberList[info.role]).toContain(info.user)
    }
  }
)
