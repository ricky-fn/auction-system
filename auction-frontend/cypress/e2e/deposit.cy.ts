import { generateFakeJWT } from 'auction-shared/mocks/fakeData/user'

describe('Test the deposit workflow', () => {
  it('should navigate to home page if the user is not logged in', () => {
    cy.visit('/protected/deposit')

    cy.url().should('eq', Cypress.env("BASE_URL"))
  });

  it("should navigate to home page after the deposit is successful", () => {
    const userObj = generateFakeJWT();
    cy.login(userObj);

    cy.intercept('POST', '/deposit', {
      statusCode: 200,
    }).as('deposit')

    cy.visit('/protected/deposit')

    cy.get('[data-cy="amount-input"]').type('1000')

    cy.get('[data-cy="deposit-button"]').click()

    cy.get('[data-cy="loading"]').should('exist')

    cy.wait('@deposit');

    cy.get('[data-cy="loading"]').should('not.exist');

    cy.get('[data-cy="toast-message"]').should('exist').should('contain.text', 'Deposit successfully')
  });
})

// Prevent TypeScript from reading file as legacy script
export { }