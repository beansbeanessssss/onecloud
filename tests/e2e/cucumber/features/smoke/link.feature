Feature: link

  Background:
    Given "Admin" creates following user using API
      | id    |
      | Alice |


  Scenario: public link
    When "Alice" logs in
    And "Alice" opens the "files" app
    And "Alice" creates the following resources
      | resource     | type   |
      | folderPublic | folder |
    And "Alice" uploads the following resources
      | resource  | to           |
      | lorem.txt | folderPublic |
    And "Alice" creates a public link for the resource "folderPublic" with password "%public%" using the sidebar panel
    And "Alice" renames the most recently created public link of resource "folderPublic" to "myPublicLink"
    And "Alice" edits the public link named "myPublicLink" of resource "folderPublic" changing role to "Secret File Drop"
    And "Alice" sets the expiration date of the public link named "myPublicLink" of resource "folderPublic" to "+5 days"
    When "Anonymous" opens the public link "myPublicLink"
    And "Anonymous" unlocks the public link with password "%public%"
    And "Anonymous" drop uploads following resources
      | resource     |
      | textfile.txt |
    When "Alice" downloads the following resources using the batch action
      | resource     | from         | type |
      | lorem.txt    | folderPublic | file |
      | textfile.txt | folderPublic | file |
    And "Alice" edits the public link named "myPublicLink" of resource "folderPublic" changing role to "Can edit"
    And "Anonymous" refreshes the old link
    And "Anonymous" downloads the following public link resources using the sidebar panel
      | resource     | type |
      | lorem.txt    | file |
      | textfile.txt | file |
    And "Anonymous" uploads the following resources in public link page
      | resource      |
      | new-lorem.txt |
    And "Anonymous" renames the following public link resources
      | resource      | as               |
      | lorem.txt     | lorem_new.txt    |
      | textfile.txt  | textfile_new.txt |
      | new-lorem.txt | test.txt         |
    And "Alice" removes the public link named "myPublicLink" of resource "folderPublic"
    And "Anonymous" should not be able to open the old link "myPublicLink"
    And "Alice" logs out


  Scenario: Quick link
    Given "Alice" logs in
    And "Alice" creates the following folders in personal space using API
      | name         |
      | folderPublic |
    And "Alice" creates the following files into personal space using API
      | pathToFile             | content     |
      | folderPublic/lorem.txt | lorem ipsum |
    And "Alice" opens the "files" app
    When "Alice" creates quick link of the resource "folderPublic" with password "%public%" from the context menu
    And "Anonymous" opens the public link "Link"
    And "Anonymous" unlocks the public link with password "%public%"
    And "Anonymous" downloads the following public link resources using the sidebar panel
      | resource  | type |
      | lorem.txt | file |
    And "Alice" logs out


  Scenario: public link for folder and file (by authenticated user)
    Given "Admin" creates following user using API
      | id    |
      | Brian |
    And "Alice" logs in
    And "Alice" creates the following resources
      | resource     | type   |
      | folderPublic | folder |
    And "Alice" creates the following resources
      | resource                      | type    | content   |
      | folderPublic/shareToBrian.txt | txtFile | some text |
      | folderPublic/shareToBrian.md  | mdFile  | readme    |
    And "Alice" uploads the following resources via drag-n-drop
      | resource       |
      | simple.pdf     |
      | testavatar.jpg |
    And "Alice" shares the following resources using the sidebar panel
      | resource       | recipient | type | role     |
      | folderPublic   | Brian     | user | Can edit |
      | simple.pdf     | Brian     | user | Can edit |
      | testavatar.jpg | Brian     | user | Can edit |
    And "Alice" creates a public link for the resource "folderPublic" with password "%public%" using the sidebar panel
    And "Alice" renames the most recently created public link of resource "folderPublic" to "folderLink"
    And "Alice" creates a public link for the resource "folderPublic/shareToBrian.txt" with password "%public%" using the sidebar panel
    And "Alice" renames the most recently created public link of resource "folderPublic/shareToBrian.txt" to "textLink"
    And "Alice" creates a public link for the resource "folderPublic/shareToBrian.md" with password "%public%" using the sidebar panel
    And "Alice" renames the most recently created public link of resource "folderPublic/shareToBrian.md" to "markdownLink"
    And "Alice" creates a public link for the resource "simple.pdf" with password "%public%" using the sidebar panel
    And "Alice" renames the most recently created public link of resource "simple.pdf" to "pdfLink"
    And "Alice" creates a public link for the resource "testavatar.jpg" with password "%public%" using the sidebar panel
    And "Alice" renames the most recently created public link of resource "testavatar.jpg" to "imageLink"
    And "Alice" logs out
    And "Brian" logs in
    When "Brian" opens the public link "folderLink"
    And "Brian" unlocks the public link with password "%public%"
    And "Brian" uploads the following resources
      | resource  |
      | lorem.txt |
    When "Brian" opens the public link "textLink"
    And "Brian" unlocks the public link with password "%public%"
    Then "Brian" is in a text-editor
    And "Brian" closes the file viewer
    When "Brian" opens the public link "markdownLink"
    And "Brian" unlocks the public link with password "%public%"
    Then "Brian" is in a text-editor
    And "Brian" closes the file viewer
    When "Brian" opens the public link "pdfLink"
    And "Brian" unlocks the public link with password "%public%"
    Then "Brian" is in a pdf-viewer
    And "Brian" closes the file viewer
    When "Brian" opens the public link "imageLink"
    And "Brian" unlocks the public link with password "%public%"
    Then "Brian" is in a image-viewer
    And "Brian" closes the file viewer
    And "Brian" logs out


  Scenario: add banned password for public link
    When "Alice" logs in
    And "Alice" uploads the following resources
      | resource  |
      | lorem.txt |
    And "Alice" creates a public link for the resource "lorem.txt" with password "%public%" using the sidebar panel
    And "Alice" renames the most recently created public link of resource "lorem.txt" to "myPublicLink"
    When "Alice" tries to sets a new password "ownCloud-1" of the public link named "myPublicLink" of resource "lorem.txt"
    Then "Alice" should see an error message
      """
      Unfortunately, your password is commonly used. please pick a harder-to-guess password for your safety
      """
    And "Alice" closes the public link password dialog box
    When "Alice" tries to sets a new password "ownCloud-1" of the public link named "myPublicLink" of resource "lorem.txt"
    Then "Alice" should see an error message
      """
      Unfortunately, your password is commonly used. please pick a harder-to-guess password for your safety
      """
    And "Alice" reveals the password of the public link
    And "Alice" hides the password of the public link
    And "Alice" generates the password for the public link
    And "Alice" copies the password of the public link
    And "Alice" sets the password of the public link
    And "Anonymous" opens the public link "myPublicLink"
    And "Anonymous" unlocks the public link with password "%copied_password%"
    And "Alice" logs out
    