Feature: groups management

  Scenario: admin creates group
    When "Admin" logs in
    And "Admin" opens the "admin-settings" app
    And "Admin" navigates to the groups management page
    When "Admin" creates the following groups
      | id       |
      | sales    |
      | security |
    And "Admin" logs out


  Scenario: admin gets groups
    Given "Admin" creates following groups using API
      | id       |
      | sales    |
      | security |
      | finance  |
    When "Admin" logs in
    And "Admin" opens the "admin-settings" app
    And "Admin" navigates to the groups management page
    Then "Admin" should see the following group
      | group    |
      | sales    |
      | security |
      | finance  |
    And "Admin" logs out