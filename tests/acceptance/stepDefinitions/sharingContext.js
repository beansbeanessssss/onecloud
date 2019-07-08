const { client } = require('nightwatch-api')
const { When, Given, Then } = require('cucumber')
const fetch = require('node-fetch')
const assert = require('assert')
const { URLSearchParams } = require('url')
require('url-search-params-polyfill')
const httpHelper = require('../helpers/httpHelper')

/**
 *
 * @param {string} file
 * @param {string} sharee
 * @param {boolean} shareWithGroup
 */
const userSharesFileOrFolderWithUserOrGroup = function (file, sharee, shareWithGroup = false) {
  return client.page
    .FilesPageElement
    .sharingDialog()
    .closeSharingDialog()
    .openSharingDialog(file)
    .shareWithUserOrGroup(sharee, shareWithGroup)
}

/**
 *
 * @param {string} file
 * @param {string} sharee
 */
const userSharesFileOrFolderWithUser = function (file, sharee) {
  return userSharesFileOrFolderWithUserOrGroup(file, sharee)
}

/**
 *
 * @param {string} file
 * @param {string} sharee
 */
const userSharesFileOrFolderWithGroup = function (file, sharee) {
  return userSharesFileOrFolderWithUserOrGroup(file, sharee, true)
}

/**
 *
 * @param {string} elementToShare  path of file/folder being shared
 * @param {string} sharer  username of the sharer
 * @param {string} receiver  username of the reciever
 * @param {number} shareType  Type of share 0 = user, 1 = group, 3 = public (link), 6 = federated (cloud share).
 * @param {number} permissions  permissions of the share  1 = read; 2 = update; 4 = create;
 *                                                    8 = delete; 16 = share; 31 = all
 *                                                    15 = change
 *                                                    5 = uploadwriteonly
 *                                                    (default: 31)
 */
const shareFileFolder = function (elementToShare, sharer, receiver, shareType = 0, permissions = 31) {
  const params = new URLSearchParams()
  params.append('shareType', shareType)
  params.append('shareWith', receiver)
  params.append('path', elementToShare)
  params.append('permissions', permissions)
  return fetch(
    client.globals.backend_url + '/ocs/v2.php/apps/files_sharing/api/v1/shares?format=json',
    { method: 'POST', headers: httpHelper.createAuthHeader(sharer), body: params }
  )
    .then(res => res.json())
    .then(function (json) {
      if (json.ocs.meta.statuscode === 200) {
        return json
      } else {
        throw Error('Could not create share. Message: ' + json.ocs.meta.message)
      }
    })
}

Given('user {string} has shared file/folder {string} with user {string}', function (sharer, elementToShare, receiver) {
  return shareFileFolder(elementToShare, sharer, receiver)
})

Given('user {string} has shared file/folder {string} with group {string}', function (sharer, elementToShare, receiver) {
  return shareFileFolder(elementToShare, sharer, receiver, 1)
})

When('the user types {string} in the share-with-field', function (input) {
  return client.page.FilesPageElement.sharingDialog().enterAutoComplete(input)
})

When('the user shares file/folder {string} with group {string} using the webUI', userSharesFileOrFolderWithGroup)

When('the user shares file/folder {string} with user {string} using the webUI', userSharesFileOrFolderWithUser)

Then('all users and groups that contain the string {string} in their name should be listed in the autocomplete list on the webUI', function (pattern) {
  return client.page.FilesPageElement.sharingDialog().getShareAutocompleteItemsList()
    .then(itemsList => {
      itemsList.forEach(item => {
        if (!item.includes(pattern)) {
          client.assert.fail(`sharee ${item} does not contain pattern ${pattern}`)
        }
      })
    })
})

Then('the users own name should not be listed in the autocomplete list on the webUI', function () {
  // TODO: where to get the current user from
  const currentUserName = client.globals.currentUserName
  return client.page.FilesPageElement.sharingDialog().getShareAutocompleteItemsList()
    .then(itemsList => {
      itemsList.forEach(item => {
        console.log(item)
        assert.notStrictEqual(
          item,
          currentUserName,
          `Users own name: ${currentUserName} was not expected to be listed in the autocomplete list but was`
        )
      })
    })
})

When('the user opens the share dialog for file {string}', function (file) {
  return client.page.FilesPageElement.filesList().openSharingDialog(file)
})

When('the user deletes share with user/group {string} for the current file', function (user) {
  return client.page.FilesPageElement.sharingDialog().deleteShareWithUserGroup(user)
})

Then('{string} should be listed in the shared with list', function (user) {
  return client.page.FilesPageElement.sharingDialog().getShareList()
    .then(shares => {
      if (!shares || !shares.includes(user)) {
        assert.fail(`"${user}" was expected to be in share list but was not present.`)
      }
    })
})

Then('{string} should not be listed in the shared with list', function (user) {
  return client.page.FilesPageElement.sharingDialog().getShareList()
    .then(shares => {
      if (shares) {
        shares.map(shareUser => {
          assert.notStrictEqual(
            shareUser,
            user,
            `"${user}" not expected to be in the share list but is present`
          )
        })
      }
    })
})
