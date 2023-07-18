import { rest } from 'msw';
import { generateFakeUser } from 'auction-shared/mocks/fakeData/user'
import { ApiResponseList } from 'auction-shared/api';
import { generateFakeCompletedItem, generateFakeItem } from 'auction-shared/mocks/fakeData/bid';

const BASE_URL = process.env.BASE_URL;

export const handlers = [
  rest.get(BASE_URL + 'get-user', (_req, res, ctx) => {
    return res(
      ctx.json<ApiResponseList["get-user"]>({
        timestamp: Date.now(),
        data: generateFakeUser({
          balance: 1000
        })
      })
    )
  }),
  rest.get(BASE_URL + 'get-items', (_req, res, ctx) => {
    return res(
      ctx.json<ApiResponseList["get-items"]>({
        timestamp: Date.now(),
        data: [generateFakeItem(), generateFakeCompletedItem(), generateFakeItem()]
      })
    )
  })
]