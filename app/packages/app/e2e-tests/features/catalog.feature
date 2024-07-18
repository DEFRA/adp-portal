Feature: Viewing the catalog

  Scenario Outline: As a user, I can see the catalog

    Given I am logged in as <user>
    When I open the home page
    Then I should see the catalog page

    Examples:
      | user         |
      | adptestuser1 |
      | adptestuser2 |
      | adptestuser3 |
      | adptestuser4 |
      | adptestuser5 |
