Feature: spaces public link

  Scenario: public link for space
    Given "Admin" creates following users using API
      | id    |
      | Alice |
      | Brian |
      | Carol |
      | David |
    And "Admin" assigns following roles to the users using API
      | id    | role        |
      | Alice | Space Admin |
    When "Alice" logs in
    And "Alice" creates the following project space using API
      | name | id     |
      | team | team.1 |
    And "Alice" creates the following folder in space "team" using API
      | name                  |
      | spaceFolder/subFolder |
    And "Alice" creates the following file in space "team" using API
      | name                                  | content   |
      | spaceFolder/shareToBrian.txt          | some text |
      | spaceFolder/subFolder/shareToBrian.md | readme    |
    And "Alice" adds the following members to the space "team" using API
      | user  | role       | shareType |
      | Brian | Can edit   | space     |
      | Carol | Can view   | space     |
      | David | Can manage | space     |
    And "Alice" navigates to the projects space page
    And "Alice" navigates to the project space "team.1"
    And "Alice" uploads the following resources via drag-n-drop
      | resource       |
      | simple.pdf     |
      | testavatar.jpg |
    And "Alice" creates a public link for the space with password "%public%" using the sidebar panel
    And "Alice" renames the most recently created public link of space to "spaceLink"
    And "Alice" creates a public link for the resource "spaceFolder" with password "%public%" using the sidebar panel
    And "Alice" renames the most recently created public link of resource "spaceFolder" to "folderLink"
    And "Alice" creates a public link for the resource "spaceFolder/shareToBrian.txt" with password "%public%" using the sidebar panel
    And "Alice" renames the most recently created public link of resource "spaceFolder/shareToBrian.txt" to "textLink"
    And "Alice" creates a public link for the resource "spaceFolder/subFolder/shareToBrian.md" with password "%public%" using the sidebar panel
    And "Alice" renames the most recently created public link of resource "spaceFolder/subFolder/shareToBrian.md" to "markdownLink"
    And "Alice" creates a public link for the resource "simple.pdf" with password "%public%" using the sidebar panel
    And "Alice" renames the most recently created public link of resource "simple.pdf" to "pdfLink"
    And "Alice" creates a public link for the resource "testavatar.jpg" with password "%public%" using the sidebar panel
    And "Alice" renames the most recently created public link of resource "testavatar.jpg" to "imageLink"
    And "Alice" logs out
    When "Brian" logs in
    And "Brian" opens the public link "spaceLink"
    And "Brian" unlocks the public link with password "%public%"
    Then "Brian" should not be able to edit the public link named "spaceLink"
    And "Brian" should not be able to edit the public link named "folderLink"
    When "Brian" opens the public link "textLink"
    And "Brian" unlocks the public link with password "%public%"
    Then "Brian" is in a text-editor
    And "Brian" closes the file viewer
    When "Brian" opens the public link "markdownLink"
    And "Brian" unlocks the public link with password "%public%"
    Then "Brian" is in a text-editor
    And "Brian" closes the file viewer
    And "Brian" logs out
    When "Carol" logs in
    And "Carol" opens the public link "spaceLink"
    And "Carol" unlocks the public link with password "%public%"
    But "Carol" should not be able to edit the public link named "spaceLink"
    And "Carol" should not be able to edit the public link named "folderLink"
    When "Carol" opens the public link "folderLink"
    And "Carol" unlocks the public link with password "%public%"
    Then "Carol" should see folder "subFolder" but should not be able to edit
    When "Carol" opens the public link "pdfLink"
    And "Carol" unlocks the public link with password "%public%"
    Then "Carol" is in a pdf-viewer
    And "Carol" closes the file viewer
    And "Carol" logs out
    When "David" logs in
    And "David" opens the public link "spaceLink"
    And "David" unlocks the public link with password "%public%"
    And "David" edits the public link named "spaceLink" of the space changing role to "Can edit"
    And "David" edits the public link named "folderLink" of resource "spaceFolder" changing role to "Can edit"
    When "David" opens the public link "imageLink"
    And "David" unlocks the public link with password "%public%"
    Then "David" is in a image-viewer
    And "David" closes the file viewer
    And "David" logs out


  Scenario: Quick link
    Given "Admin" creates following users using API
      | id    |
      | Alice |
    And "Admin" assigns following roles to the users using API
      | id    | role        |
      | Alice | Space Admin |
    When "Alice" logs in
    And "Alice" creates the following project space using API
      | name | id     |
      | team | team.1 |
    And "Alice" creates the following file in space "team" using API
      | name     | content   |
      | file.txt | some text |
    And "Alice" navigates to the projects space page
    And "Alice" navigates to the project space "team.1"
    When "Alice" creates quick link of the resource "file.txt" with password "%public%" from the context menu
    And "Anonymous" opens the public link "Link"
    And "Anonymous" unlocks the public link with password "%public%"
    Then "Anonymous" is in a text-editor
    And "Anonymous" closes the file viewer
    And "Alice" logs out
