Feature: check files pagination in project space
  As a user
  I want to navigate a large number of files using pagination
  So that I do not have to scroll deep down

  Scenario: pagination
    Given "Admin" creates following user using API
      | id    |
      | Alice |
    And "Admin" assigns following roles to the users using API
      | id    | role        |
      | Alice | Space Admin |
    And "Alice" creates the following project space using API
      | name       | id    |
      | Developers | dev.1 |
    And "Alice" creates 55 folders in space "Developers" using API
    And "Alice" creates 55 files in space "Developers" using API
    And "Alice" creates the following file in space "Developers" using API
      | name                 | content                |
      | .hidden-testFile.txt | This is a hidden file. |
    And "Alice" logs in
    And "Alice" opens the "files" app
    And "Alice" navigates to the projects space page
    And "Alice" navigates to the project space "dev.1"
    When "Alice" navigates to page "2" of the project space files view
    Then "Alice" should see the text "112 items with 1 kB in total (56 files, 56 folders)" at the footer of the page
    And "Alice" should see 10 resources in the project space files view
    When "Alice" enables the option to display the hidden file
    Then "Alice" should see 12 resources in the project space files view
    When "Alice" changes the items per page to "500"
    Then "Alice" should not see the pagination in the project space files view
    And "Alice" logs out
