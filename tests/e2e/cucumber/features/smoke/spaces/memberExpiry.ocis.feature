Feature: spaces member expiry

  # FIXME: Un-skip once https://github.com/owncloud/ocis/pull/5453 has been merged
#  Scenario: space members can be invited with an expiration date
#    Given "Admin" creates following users
#      | id      |
#      | Alice   |
#      | Brian   |
#    And "Admin" assigns following roles to the users
#      | id    | role       |
#      | Alice | SpaceAdmin |
#    And "Alice" creates the following project space using API
#      | name | id     |
#      | team | team.1 |
#    When "Alice" logs in
#    And "Alice" opens the "files" app
#    And "Alice" navigates to the projects space page
#    And "Alice" navigates to the project space "team.1"
#    And "Alice" adds following users to the project space
#      | user     | role   | kind  |
#      | Brian    | editor | user  |
#    And "Alice" sets the expiration date of the member "Brian" of the project space to "+5 days"
#    When "Brian" logs in
#    And "Brian" navigates to the projects space page
#    And "Brian" navigates to the project space "team.1"
#    And "Brian" logs out
#    When "Alice" navigates to the projects space page
#    And "Alice" navigates to the project space "team.1"
#    And "Alice" removes the expiration date of the member "Brian" of the project space
#    And "Alice" logs out
