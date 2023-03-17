Feature: spaces management

  Scenario: user login can be managed in the admin settings
    Given "Admin" creates following users
      | id    |
      | Alice |
    When "Admin" logs in
    And "Admin" opens the "admin-settings" app
    And "Admin" navigates to the users management page
    And "Admin" forbids the login for the following user "Alice" using the sidebar panel
    And "Admin" logs out
    Then "Alice" fails to log in
    When "Admin" logs in
    And "Admin" opens the "admin-settings" app
    And "Admin" navigates to the users management page
    And "Admin" allows the login for the following user "Alice" using the sidebar panel
    And "Admin" logs out
    Then "Alice" logs in
    And "Alice" logs out


  Scenario: admin user can change personal quotas for users
    Given "Admin" creates following users
      | id    |
      | Alice |
      | Brian |
    And "Alice" logs in
    And "Brian" logs in
    And "Admin" logs in
    And "Admin" opens the "admin-settings" app
    And "Admin" navigates to the users management page
    When "Admin" changes the quota of the user "Alice" to "500" using the sidebar panel
    Then "Alice" should have quota "500"
    When "Admin" changes the quota to "20" for users using the batch action
      | id    |
      | Alice |
      | Brian |
    Then "Alice" should have quota "20"
    And "Brian" should have quota "20"
    And "Brian" logs out
    And "Alice" logs out
    And "Admin" logs out


  Scenario: user group assignments can be handled via batch actions
    Given "Admin" creates following users
      | id    |
      | Alice |
      | Brian |
      | Carol |
    And "Admin" creates following groups using API
      | id      |
      | sales   |
      | finance |
    When "Admin" logs in
    And "Admin" opens the "admin-settings" app
    And "Admin" navigates to the users management page
    And "Admin" adds the following users to the groups "sales department,finance department" using the batch actions
      | user  |
      | Alice |
      | Brian |
      | Carol |
    When "Admin" sets the following filter
      | filter | values                              |
      | groups | sales department,finance department |
    Then "Admin" should see the following users
      | user  |
      | Alice |
      | Brian |
      | Carol |
    And "Admin" removes the following users from the groups "sales department,finance department" using the batch actions
      | user  |
      | Alice |
      | Brian |
    When "Admin" reloads the page
    Then "Admin" should see the following users
      | user  |
      | Carol |
    Then "Admin" should not see the following users
      | user  |
      | Alice |
      | Brian |
    And "Admin" logs out


  Scenario: edit user
    Given "Admin" creates following users
      | id    |
      | Alice |
    When "Admin" logs in
    And "Admin" opens the "admin-settings" app
    And "Admin" navigates to the users management page
    When "Admin" changes userName to "anna" for user "Alice" using the sidebar panel
    And "Admin" changes displayName to "Anna Murphy" for user "Alice" using the sidebar panel
    And "Admin" changes email to "anna@example.org" for user "Alice" using the sidebar panel
    And "Admin" changes password to "password" for user "Alice" using the sidebar panel
    And "Admin" changes role to "Space Admin" for user "Alice" using the sidebar panel
    And "Admin" logs out
    When "anna" logs in
    Then "anna" should have self info:
      | key         | value            |
      | username    | anna             |
      | displayname | Anna Murphy      |
      | email       | anna@example.org |
    And "anna" logs out


  Scenario: assign user to groups
    Given "Admin" creates following users
      | id    |
      | Alice |
    And "Admin" creates following groups using API
      | id       |
      | sales    |
      | finance  |
      | security |
    And "Admin" adds user to the group using API
      | user  | group |
      | Alice | sales |
    When "Admin" logs in
    And "Admin" opens the "admin-settings" app
    And "Admin" navigates to the users management page
    When "Admin" adds the user "Alice" to the groups "finance,security" using the sidebar panel
    And "Admin" removes the user "Alice" from the group "sales" using the sidebar panel
    And "Admin" logs out
    When "Alice" logs in
    Then "Alice" should have self info:
      | key    | value                                   |
      | groups | finance department, security department |
    And "Alice" logs out
