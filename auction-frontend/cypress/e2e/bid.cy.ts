import { ApiResponseList } from 'auction-shared/api';
import { generateFakeItem } from 'auction-shared/mocks/fakeData/bid';
import { generateFakeJWT } from 'auction-shared/mocks/fakeData/user'

describe('Test the bidding workflow', () => {
  beforeEach(() => {
    const userObj = generateFakeJWT();
    cy.login(userObj);
    cy.visit('/')
  })

  it('should show a modal when clicking on the bid button', () => {
    cy.get('[data-cy="bid-modal"]').should('not.exist')

    cy.get('[data-cy="item-bid-button"]').first().click()

    cy.get('[data-cy="bid-modal"]').should('exist')

    cy.get('[data-cy="bid-amount-input"]').type('100')

    cy.intercept('POST', process.env.BASE_URL + '/create-item', {
      statusCode: 200,
      body: generateFakeItem()
    }).as('bid')


    cy.get('[data-cy="bid-button"]').click()
  });

  it('should send a bid request when clicking on the submit button', () => {
    cy.get('[data-cy="item-bid-button"]').first().click()

    cy.wait(300) // wait for the modal to show up

    cy.get('[data-cy="bid-amount-input"]').type('200')

    const getTotalBidAmountResponse: ApiResponseList['get-total-bid-amount'] = {
      timestamp: Date.now(),
      data: 0
    }
    cy.intercept('GET', '/get-total-bid-amount**', getTotalBidAmountResponse)

    cy.intercept('POST', '/bid-item', {
      statusCode: 200,
      body: generateFakeItem()
    }).as('bid')

    cy.wait(1000) // wait one second to make sure the user session in client side is updated

    cy.get('[data-cy="bid-button"]').click()

    cy.get('[data-cy="loading"]').should('exist')

    cy.wait('@bid');

    cy.get('[data-cy="loading"]').should('not.exist');

    cy.get('[data-cy="toast-message"]').should('exist').should('contain.text', 'You Have Placed A Bid')
  });
})

// Prevent TypeScript from reading file as legacy script
export { }