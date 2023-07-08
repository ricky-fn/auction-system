/* eslint-disable */
// Disable ESLint to prevent failing linting inside the Next.js repo.
// If you're using ESLint on your project, we recommend installing the ESLint Cypress plugin instead:
// https://github.com/cypress-io/eslint-plugin-cypress

// Cypress E2E Test
import { generateFakeJWT } from 'auction-shared/mocks/fakeData/user'
import { rest } from 'msw';
import CDKStack from 'auction-shared/outputs.json';
import { generateFakeUser } from 'auction-shared/mocks/fakeData/user'
import { ApiResponseList } from 'auction-shared/api';;

describe('Navigation', () => {
  it('should navigate to the about page', () => {
    const userObj = generateFakeJWT();
    cy.login(userObj);

    // const handler = rest.post(CDKStack.AuctionApiStack.AuctionApiUrl + 'get-user', (_req, res, ctx) => {
    //   return res(
    //     ctx.status(200),
    //     ctx.json<ApiResponseList["get-user"]>({
    //       timestamp: Date.now(),
    //       data: generateFakeUser()
    //     })
    //   );
    // });
    // Start from the index page
    cy.visit('http://localhost:3000/')
  })
})

// Prevent TypeScript from reading file as legacy script
export { }