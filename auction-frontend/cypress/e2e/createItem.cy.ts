import { ApiRequestParams, ApiResponseList } from 'auction-shared/api';
import { generateFakeItem } from 'auction-shared/mocks/fakeData/bid';
import { generateFakeJWT } from 'auction-shared/mocks/fakeData/user'

describe('Test the item creation workflow', () => {
  const path = '/protected/create'

  it('should navigate to home page if the user is not logged in', () => {
    cy.visit(path)

    cy.url().should('eq', Cypress.env("BASE_URL"))
  });

  it.only("should navigate to home page after the item creation is successful", () => {
    const userObj = generateFakeJWT();
    cy.login(userObj);

    const expectedRequestParams: ApiRequestParams['create-item'] = {
      expirationTime: "5h",
      name: "test-item-name",
      startingPrice: 100,
      about: "test-item-about",
      photo: "example.png"
    }

    const fakeResponse: ApiResponseList['create-item'] = {
      timestamp: Date.now(),
      data: generateFakeItem({
        ...expectedRequestParams,
      })
    };

    cy.intercept('POST', 'create-item', fakeResponse).as('create-item');

    cy.visit(path);

    cy.get('[data-cy="input-item-name"]').type(expectedRequestParams.name);

    cy.get('[data-cy="input-starting-price"]').type(expectedRequestParams.startingPrice.toString());

    cy.get('[data-cy="input-time-window"]').type(expectedRequestParams.expirationTime);

    cy.get('[data-cy="input-about"]').type(expectedRequestParams.about);

    cy.fixture(expectedRequestParams.photo).as('myFixture')
    cy.get('[data-cy="input-photo"]').selectFile('@myFixture', { force: true });

    cy.get('[data-cy="photo-preview"]').should('exist');

    cy.get('[data-cy="submit-button"]').click();

    cy.get('[data-cy="loading"]').should('exist')

    cy.wait('@create-item').then(({ request: { body } }) => {
      const { startingPrice, ...requestParams } = body;
      const { startingPrice: expectedStartingPrice, ..._expectedRequestParams } = expectedRequestParams;
      expect(requestParams).to.deep.equal(_expectedRequestParams)
      expect(startingPrice).to.equal(expectedStartingPrice.toString())
    });

    cy.get('[data-cy="loading"]').should('not.exist');

    cy.get('[data-cy="toast-message"]').should('exist').should('contain.text', 'You Have Created An Item')

    cy.url().should('eq', Cypress.env("BASE_URL"))
  });
})

// Prevent TypeScript from reading file as legacy script
export { }