import { renderWithProviders } from "@/__tests__/utils/provider";
import ItemListContainer from "@/component/item/ItemListContainer";
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event';
import { generateFakeCompletedItem, generateFakeItem } from "auction-shared/mocks/fakeData/bid";
import { Item } from "auction-shared/models";
import { signIn, useSession } from 'next-auth/react';
import { usePathname, useRouter } from "next/navigation";
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { ApiResponseList } from "auction-shared/api";
import { setLoading, showToast } from "@/store/actions/appActions";

jest.mock("next-auth/react")

jest.mock("next/navigation")

const mockDispatch = jest.fn()
jest.mock('react-redux', () => {
  const originalModule = jest.requireActual('react-redux');

  return {
    __esModule: true,
    ...originalModule,
    useDispatch: jest.fn(() => {
      return mockDispatch;
    }),
  };
});

const BASE_URL = process.env.BASE_URL;

describe('ItemListContainer', () => {
  let items: Item[];
  beforeAll(() => {
    ; (useSession as jest.Mock).mockReturnValue({
      data: {},
      status: "unauthenticated",
    })

      ; (useRouter as jest.Mock).mockReturnValue({
        route: "/",
        pathname: "",
        query: "",
        asPath: "",
      })

      ; (usePathname as jest.Mock).mockReturnValue("/")
  })

  beforeEach(() => {
    items = [
      generateFakeItem(),
      generateFakeItem(),
      generateFakeCompletedItem(),
    ]
  })

  afterEach(() => {
    mockDispatch.mockClear();
  });

  it('should render a tab with ongoing and completed', () => {
    renderWithProviders(<ItemListContainer items={items} />);

    const ongoingTab = screen.getByRole('tab', { name: /ongoing/i });
    const completedTab = screen.getByRole('tab', { name: /completed/i });

    expect(ongoingTab).toBeInTheDocument();
    expect(completedTab).toBeInTheDocument();
  });

  it('should render 2 ongoing items', () => {
    renderWithProviders(<ItemListContainer items={items} />);

    const ongoingTabPanel = screen.getByRole('tabpanel', { name: /ongoing/i });

    const ongoingItems = ongoingTabPanel.querySelectorAll('table');

    expect(ongoingItems).toHaveLength(2);
  });

  it('should render 1 completed item', async () => {
    renderWithProviders(<ItemListContainer items={items} />);

    const completedTab = screen.getByRole('tab', { name: /completed/i });

    await userEvent.click(completedTab);

    const completedTabPanel = await screen.findByRole('tabpanel', { name: /completed/i });

    const completedItems = completedTabPanel.querySelectorAll('table');

    expect(completedItems).toHaveLength(1);
  });

  it('should redirect to login page when click bid button', async () => {
    renderWithProviders(<ItemListContainer items={items} />);

    const bidButtons = screen.getAllByRole('button', { name: /bid/i });

    // click the first button
    await userEvent.click(bidButtons[0]);

    expect(signIn).toBeCalledWith('cognito');
  });
});

describe.only('ItemListContainer with authentication', () => {
  let items: Item[];
  const totalBidAmount = 0;
  const startingPrice = 100;
  const server = setupServer(
    rest.get(BASE_URL + 'get-total-bid-amount', (_req, res, ctx) => {
      return res(
        ctx.json<ApiResponseList["get-total-bid-amount"]>({
          timestamp: Date.now(),
          data: totalBidAmount,
        })
      )
    }),
    rest.post(BASE_URL + 'bid-item', (_req, res, ctx) => {
      return res(
        ctx.json<ApiResponseList["bid-item"]>({
          timestamp: Date.now(),
          data: {} as any,
        })
      )
    })
  );

  beforeAll(() => {
    ; (useSession as jest.Mock).mockReturnValue({
      data: {
        expires: new Date(Date.now() + 2 * 86400).toISOString(),
        user: { name: "admin" }
      },
      status: "authenticated",
    })

      ; (useRouter as jest.Mock).mockReturnValue({
        route: "/",
        pathname: "",
        query: "",
        asPath: "",
      })

      ; (usePathname as jest.Mock).mockReturnValue("/")

    server.listen();
  });

  afterEach(() => {
    server.resetHandlers();
    mockDispatch.mockClear();
  })

  afterAll(() => server.close())

  beforeEach(() => {
    items = [
      generateFakeItem({ startingPrice: startingPrice }),
      generateFakeItem({ startingPrice: startingPrice }),
      generateFakeCompletedItem({ startingPrice: startingPrice }),
    ]
    mockDispatch.mockClear();
  })

  it('should open bid modal when click bid button', async () => {
    renderWithProviders(<ItemListContainer items={items} />);

    const bidButtons = screen.getAllByRole('button', { name: /bid/i });

    await userEvent.click(bidButtons[0]);

    const bidModal = screen.getByRole('dialog');

    expect(bidModal).toBeInTheDocument();
  });

  it('should dispatch error when bid amount is less than starting price', async () => {
    renderWithProviders(<ItemListContainer items={items} />);

    const bidButtons = screen.getAllByRole('button', { name: /bid/i });
    const bidAmount = startingPrice - totalBidAmount - 1;
    await userEvent.click(bidButtons[0]);

    const inputElement = screen.getByRole('spinbutton', { name: /amount/i });

    await userEvent.type(inputElement, bidAmount.toString());

    const submitButton = screen.getByRole('button', { name: /submit/i });

    await userEvent.click(submitButton);

    console.log(mockDispatch.mock.calls)

    expect(mockDispatch).toHaveBeenNthCalledWith(3, showToast({
      type: 'error',
      message: `Your Bid Must Be Higher Than ${startingPrice}`
    }));
  });

  it('should dispatch success when bid amount is higher than starting price', async () => {
    renderWithProviders(<ItemListContainer items={items} />);

    const bidButtons = screen.getAllByRole('button', { name: /bid/i });
    const bidAmount = startingPrice + 1;
    await userEvent.click(bidButtons[0]);

    const inputElement = screen.getByRole('spinbutton', { name: /amount/i });

    await userEvent.type(inputElement, bidAmount.toString());

    const submitButton = screen.getByRole('button', { name: /submit/i });

    await userEvent.click(submitButton);

    expect(mockDispatch).toHaveBeenNthCalledWith(3, showToast({
      type: 'success',
      message: `You Have Placed A Bid`
    }));
  });
})