Feature: deny share access

  Background:
    Given "Admin" creates following users using API
      | id    |
      | Alice |
      | Brian |

  Scenario: deny and grant access
    Given "Alice" creates the following folder in personal space using API
      | name                            |
      | folder_to_shared                |
      | folder_to_shared/folder         |
      | folder_to_shared/folder_to_deny |
    And "Alice" logs in
    And "Alice" opens the "files" app
    And "Alice" shares the following resource using the sidebar panel
      | resource         | recipient | type | role   | resourceType |
      | folder_to_shared | Brian     | user | viewer | folder       |
    And "Alice" opens folder "folder_to_shared"
    When "Alice" denies access to the following resources for user "Brian" using the sidebar panel
      | resource       |
      | folder_to_deny |
    And "Brian" logs in
    And "Brian" opens the "files" app
    And "Brian" navigates to the shared with me page
    And "Brian" accepts the following share
      | name             |
      | folder_to_shared |
    And "Brian" opens folder "folder_to_shared"
    Then following resources should not be displayed in the files list for user "Brian"
      | resource       |
      | folder_to_deny |
    And "Alice" opens the "files" app
    And "Alice" opens folder "folder_to_shared"
    When "Alice" grants access to the following resources for user "Brian" using the sidebar panel
      | resource       |
      | folder_to_deny |
    And "Brian" opens the "files" app
    And "Brian" navigates to the shared with me page
    And "Brian" opens folder "folder_to_shared"
    Then following resources should be displayed in the files list for user "Brian"
      | resource       |
      | folder_to_deny |
    And "Brian" logs out
    And "Alice" logs out
