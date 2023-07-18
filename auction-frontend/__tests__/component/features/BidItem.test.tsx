import { screen, render, waitFor } from "@testing-library/react";
import BidItem, { BidModalProps } from "@/component/features/BidItem";
import { generateFakeItem } from "auction-shared/mocks/fakeData/bid";
import userEvent from "@testing-library/user-event";
import { generateFakeUser } from "auction-shared/mocks/fakeData/user";

const mockSelector = jest.fn(() => {
  return generateFakeUser()
});

jest.mock('react-redux', () => {
  const originalModule = jest.requireActual('react-redux');

  return {
    __esModule: true,
    ...originalModule,
    useSelector: jest.fn(() => {
      return mockSelector;
    }),
  };
});

describe('BidItem', () => {
  const fakeItem = generateFakeItem();
  const props: BidModalProps = {
    isOpen: true,
    closeModal: jest.fn(),
    item: fakeItem,
    bid: jest.fn(),
  };

  afterEach(() => {
    mockSelector.mockClear();
  });

  it('should not render if isOpen is false', () => {
    render(<BidItem {...props} isOpen={false} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should render if isOpen is true', async () => {
    render(<BidItem {...props} />);
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toBeInTheDocument();
  });

  it('should render item name', async () => {
    render(<BidItem {...props} isOpen={true} />);

    const itemName = await screen.findByText(fakeItem.name);

    expect(itemName).toBeInTheDocument();
  });

  it('should show error if amount is invalid', async () => {
    render(<BidItem {...props} />);
    const input = screen.getByRole('spinbutton', { name: /amount/i });

    await userEvent.type(input, '1');

    await userEvent.clear(input);

    const submitButton = screen.getByRole('button', { name: /Submit/i });

    await userEvent.click(submitButton);

    expect(screen.getByText('Amount is required')).toBeInTheDocument();

    await userEvent.type(input, '0');

    await userEvent.click(submitButton);

    expect(screen.getByText('Amount must be greater than 0')).toBeInTheDocument();
  });

  it('should hide error if amount is valid', async () => {
    render(<BidItem {...props} />);
    const input = screen.getByRole('spinbutton', { name: /amount/i });

    await userEvent.type(input, '1');

    await userEvent.clear(input);

    const submitButton = screen.getByRole('button', { name: /Submit/i });

    await userEvent.click(submitButton);

    expect(screen.getByText('Amount is required')).toBeInTheDocument();

    await userEvent.type(input, '2');

    await userEvent.click(submitButton);

    expect(screen.queryByText('Amount is required')).not.toBeInTheDocument();
  });

  it('should call closeModal when click cancel button', async () => {
    render(<BidItem {...props} />);
    const cancelButton = screen.getByRole('button', { name: /Cancel/i });

    await userEvent.click(cancelButton);

    expect(props.closeModal).toBeCalled();
  });

  it('should call bid when click submit button', async () => {
    const bidAmount = 1;
    render(<BidItem {...props} />);
    const input = screen.getByRole('spinbutton', { name: /amount/i });

    await userEvent.type(input, bidAmount.toString());

    const submitButton = screen.getByRole('button', { name: /Submit/i });

    await userEvent.click(submitButton);

    expect(props.bid).toBeCalledWith(bidAmount);
    expect(props.closeModal).toBeCalled();
  });
});