@sse
Feature: lock
  As a user
  I can see that a file is locked if it is opened by a user with edit permissions,
  and I am restricted in some actions such as moving deleting renaming a locked file


  Scenario: file lock indication
    Given "Admin" creates following users using API
      | id    |
      | Alice |
      | Brian |
      | Carol |
    And "Alice" logs in
    And "Alice" creates the following files into personal space using API
      | pathToFile | content      |
      | test.odt   | some content |
    And "Alice" shares the following resource using API
      | resource | recipient | type | role     |
      | test.odt | Brian     | user | Can edit |
    And "Brian" logs in
    And "Brian" navigates to the shared with me page
    When "Brian" opens the following file in Collabora
      | resource |
      | test.odt |
    Then "Brian" should see the content "some content" in editor "OnlyOffice"

    # file-locked
    And "Alice" should get "file-locked" SSE event
    And for "Alice" file "test.odt" should be locked

    # checking that user cannot 'move', 'rename', 'delete' locked file
    And "Alice" should not be able to edit file "test.odt"

    # checking that user cannot delete or change share of the locked file
    # https://github.com/owncloud/web/issues/10507
    And "Alice" should not be able to manage share with user "Brian"

    # checking that sharing and creating link of the locked file is possible
    And "Alice" creates a public link of following resource using the sidebar panel
      | resource | password |
      | test.odt | %public% |
    And "Alice" shares the following resource using the sidebar panel
      | resource | recipient | type | role     | resourceType |
      | test.odt | Carol     | user | Can view | file         |

    # file-unlocked
    When "Brian" closes the file viewer
    Then "Alice" should get "file-unlocked" SSE event
    And for "Alice" file "test.odt" should not be locked
    And "Alice" should be able to manage share with user "Brian"

    And "Brian" logs out
    And "Alice" logs out
