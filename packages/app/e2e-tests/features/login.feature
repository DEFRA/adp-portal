Feature: Logging in to the site

  Scenario Outline: As an anonymous user, I can see the login page

    Given I am not logged in
    When I open the home page
    Then I should see the login page

  Scenario Outline: As a user, I am able to log into the application

    Given I am logged in as <user>
    When I open the settings page
    Then I should see the settings page
    And the email address for <user> should be shown

    Examples:
      | user         |
      | adptestuser1 |
      | adptestuser2 |
      | adptestuser3 |
      | adptestuser4 |
      | adptestuser5 |
