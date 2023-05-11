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
    And "Alice" creates the following project space using API
      | name | id     |
      | team | team.1 |
    When "Alice" logs in
    And "Alice" navigates to the projects space page
    And "Alice" navigates to the project space "team.1"
    And "Alice" creates the following resources
      | resource    | type   |
      | spaceFolder | folder |
    And "Alice" creates a public link for the resource "spaceFolder" using the sidebar panel
    And "Alice" renames the most recently created public link of resource "spaceFolder" to "folderLink"
    And "Alice" adds following users to the project space
      | user  | role    | kind |
      | Brian | editor  | user |
      | Carol | viewer  | user |
      | David | manager | user |
    And "Alice" logs out
    When "Brian" logs in
    And "Brian" navigates to the projects space page
    And "Brian" navigates to the project space "team.1"
    And "Brian" should not be able to edit the public link named "folderLink"
    And "Brian" logs out
    When "David" logs in
    And "David" navigates to the projects space page
    And "David" navigates to the project space "team.1"
    And "David" edits the public link named "folderLink" of resource "spaceFolder" changing role to "editor"
    And "David" logs out
    When "Carol" logs in
    And "Carol" navigates to the projects space page
    And "Carol" navigates to the project space "team.1"
    And "Carol" should not be able to edit the public link named "folderLink"
    And "Carol" logs out
