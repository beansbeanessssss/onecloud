const { client } = require('nightwatch-api')
const { When, Given, Then } = require('cucumber')
const fetch = require('node-fetch')
const { URLSearchParams } = require('url')
require('url-search-params-polyfill')
const httpHelper = require('../helpers/httpHelper')

Given('user {string} has shared file/folder {string} with user {string}', function (sharer, elementToShare, receiver) {
  const params = new URLSearchParams()
  params.append('shareType', '0') // 0 = user, 1 = group, 3 = public (link), 6 = federated (cloud share).
  params.append('shareWith', receiver)
  params.append('path', elementToShare)
  params.append('permissions', '31')

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
})

When('the user types {string} in the share-with-field', function (input) {
  return client.page.filesPage().enterAutoComplete(input)
})

Then('all users and groups that contain the string {string} in their name should be listed in the autocomplete list on the webUI', function (pattern) {
  return client.page.filesPage().sharingAutoCompleteShallContainElementsWith(pattern)
})

Then('the users own name should not be listed in the autocomplete list on the webUI', function () {
  // TODO: where to get the current user from
  return client.page.filesPage().sharingAutoCompleteShallNotContainElementsWith('admin')
})

Given('the user has opened the share dialog for folder {string}', function (fileName) {
  return client.page.filesPage().openSharingDialog(fileName)
})
