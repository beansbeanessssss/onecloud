Feature: share

  Background:
    Given "Admin" creates following users using API
      | id    |
      | Alice |
      | Brian |

  Scenario: folder
    Given "Alice" creates the following folder in personal space using API
      | name                   |
      | folder_to_shared       |
      | folder_to_customShared |
      | shared_folder          |
    And "Alice" logs in
    And "Alice" opens the "files" app
    And "Alice" uploads the following resource
      | resource      | to                     |
      | lorem.txt     | folder_to_shared       |
      | lorem-big.txt | folder_to_customShared |
    When "Alice" shares the following resource using the sidebar panel
      | resource               | recipient | type | role                                  | resourceType |
      | folder_to_shared       | Brian     | user | editor                                | folder       |
      | shared_folder          | Brian     | user | editor                                | folder       |
      | folder_to_customShared | Brian     | user | custom_permissions:read,create,delete | folder       |
    And "Brian" logs in
    And "Brian" opens the "files" app
    And "Brian" navigates to the shared with me page
    And "Brian" accepts the following share
      | name                   |
      | folder_to_shared       |
      | folder_to_customShared |
    And "Brian" declines the following share
      | name          |
      | shared_folder |
    Then "Brian" should not be able to open the folder "shared_folder"
    When "Brian" accepts the following share from the context menu
      | name          |
      | shared_folder |
    And "Brian" copies quick link of the resource "shared_folder" from the context menu
    And "Brian" declines the following share from the context menu
      | name          |
      | shared_folder |
    And "Brian" renames the following resource
      | resource                   | as            |
      | folder_to_shared/lorem.txt | lorem_new.txt |
    And "Brian" uploads the following resource
      | resource        | to                     |
      | simple.pdf      | folder_to_shared       |
      | testavatar.jpeg | folder_to_customShared |
    When "Brian" deletes the following resources using the sidebar panel
      | resource      | from                   |
      | lorem-big.txt | folder_to_customShared |
    And "Alice" opens the "files" app
    And "Alice" uploads the following resource
      | resource          | to               | option  |
      | PARENT/simple.pdf | folder_to_shared | replace |
    And "Brian" should not see the version of the file
      | resource   | to               |
      | simple.pdf | folder_to_shared |
    And "Alice" removes following sharee
      | resource               | recipient |
      | folder_to_customShared | Brian     |
    When "Alice" deletes the following resources using the sidebar panel
      | resource         | from             |
      | lorem_new.txt    | folder_to_shared |
      | folder_to_shared |                  |
    And "Alice" logs out
    Then "Brian" should not be able to see the following shares
      | resource               | owner        |
      | folder_to_customShared | Alice Hansen |
      | folder_to_shared       | Alice Hansen |
    And "Brian" logs out


  Scenario: file
    Given "Alice" logs in
    And "Alice" opens the "files" app
    And "Alice" creates the following resources
      | resource            | type       | content   |
      | shareToBrian.txt    | txtFile    | some text |
      | shareToBrian.md     | mdFile     | readme    |
      | shareToBrian.drawio | drawioFile |           |
      | sharedFile.txt      | txtFile    | some text |
    And "Alice" uploads the following resource
      | resource        |
      | testavatar.jpeg |
      | simple.pdf      |
    When "Alice" shares the following resource using the sidebar panel
      | resource         | recipient | type | role                                 | resourceType |
      | shareToBrian.txt | Brian     | user | editor                               | file         |
      | shareToBrian.md  | Brian     | user | editor                               | file         |
      | testavatar.jpeg  | Brian     | user | viewer                               | file         |
      | simple.pdf       | Brian     | user | custom_permissions:read,update,share | file         |
      | sharedFile.txt   | Brian     | user | editor                               | file         |
    And "Brian" logs in
    And "Brian" opens the "files" app
    And "Brian" navigates to the shared with me page
    Then "Brian" should not be able to open the file "shareToBrian.txt"
    When "Brian" accepts the following share
      | name             |
      | shareToBrian.txt |
      | shareToBrian.md  |
      | testavatar.jpeg  |
      | simple.pdf       |
    And "Brian" declines the following share
      | name           |
      | sharedFile.txt |
    Then "Brian" should not be able to open the file "sharedFile.txt"
    When "Brian" accepts the following share from the context menu
      | name           |
      | sharedFile.txt |
    And "Brian" copies quick link of the resource "sharedFile.txt" from the context menu
    And "Brian" declines the following share from the context menu
      | name           |
      | sharedFile.txt |
    And "Brian" edits the following resources
      | resource         | content            |
      | shareToBrian.txt | new content        |
      | shareToBrian.md  | new readme content |
    And "Brian" opens the following file in mediaviewer
      | resource        |
      | testavatar.jpeg |
    And "Brian" opens the following file in pdfviewer
      | resource   |
      | simple.pdf |
    And "Alice" removes following sharee
      | resource         | recipient |
      | shareToBrian.txt | Brian     |
      | shareToBrian.md  | Brian     |
    And "Alice" logs out
    Then "Brian" should not be able to see the following shares
      | resource         | owner        |
      | shareToBrian.txt | Alice Hansen |
      | shareToBrian.md  | Alice Hansen |
    And "Brian" logs out
