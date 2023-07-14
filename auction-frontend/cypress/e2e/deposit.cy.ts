import { generateFakeJWT } from 'auction-shared/mocks/fakeData/user'

describe('Test the deposit workflow', () => {
  it('should navigate to home page if the user is not logged in', () => {
    cy.visit(Cypress.env("BASE_URL") + 'protected/deposit')

    cy.url().should('eq', Cypress.env("BASE_URL"))
  });

  it("should navigate to home page after the deposit is successful", () => {
    const userObj = generateFakeJWT();
    cy.login(userObj);

    cy.intercept('POST', Cypress.env("BASE_URL") + 'deposit', {
      statusCode: 200,
    }).as('deposit')

    cy.visit(Cypress.env("BASE_URL") + 'protected/deposit')

    cy.get('[data-cy="amount-input"]').type('1000')

    cy.wait(1000) // wait for the session state to be updated

    cy.get('[data-cy="deposit-button"]').click()

    cy.get('[data-cy="loading"]').should('exist')

    cy.wait('@deposit');

    cy.get('[data-cy="loading"]').should('not.exist');

    cy.get('[data-cy="toast-message"]').should('exist').should('contain.text', 'Deposit successfully')
  });
})

// Prevent TypeScript from reading file as legacy script
export { }