import { rest } from 'msw';
import CDKStack from 'auction-shared/outputs.json';
import { generateFakeUser } from 'auction-shared/mocks/fakeData/user'
import { ApiResponseList } from 'auction-shared/api';

export const handlers = [
  rest.get(CDKStack.AuctionApiStack.AuctionApiUrl + 'get-user', (_req, res, ctx) => {
    return res(
      ctx.json<ApiResponseList["get-user"]>({
        timestamp: Date.now(),
        data: generateFakeUser()
      })
    )
  })
]