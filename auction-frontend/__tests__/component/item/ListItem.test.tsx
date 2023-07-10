import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event';
import { generateFakeItem } from "auction-shared/mocks/fakeData/bid";
import { Item } from 'auction-shared/models';
import ListItem from '@/component/item/ListItem';

describe('ListItem', () => {
  let onClick: jest.Mock;
  let fakeItem: Item;

  beforeEach(() => {
    onClick = jest.fn();
    fakeItem = generateFakeItem();
  });

  it('renders a heading', async () => {
    render(<ListItem onClick={onClick} item={fakeItem} />);
    const table = await screen.findByRole('table');
    expect(table).toBeInTheDocument();
  });

  it('renders item name', () => {
    render(<ListItem onClick={onClick} item={fakeItem} />);
    const itemName = screen.getByText(fakeItem.name);
    expect(itemName).toBeInTheDocument();
  });

  it('renders highest bid if available', () => {
    const fakeItemWithHighestBid = generateFakeItem({ highestBid: 200 });
    render(<ListItem onClick={onClick} item={fakeItemWithHighestBid} />);

    const highestBid = screen.getByText(fakeItemWithHighestBid.highestBid!.toString());
    expect(highestBid).toBeInTheDocument();
  });

  it('renders starting price if no highest bid available', () => {
    render(<ListItem onClick={onClick} item={fakeItem} />);
    const startingPrice = screen.getByText(fakeItem.startingPrice.toString());
    expect(startingPrice).toBeInTheDocument();
  });

  it('renders expiration time', () => {
    render(<ListItem onClick={onClick} item={fakeItem} />);
    const expirationTime = screen.getByText(fakeItem.expirationTime);
    expect(expirationTime).toBeInTheDocument();
  });

  it('renders a disabled button if item status is completed', () => {
    const completedItem = generateFakeItem({ status: 'completed' });
    render(<ListItem onClick={onClick} item={completedItem} />);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('renders an enabled button if item status is ongoing', () => {
    const ongoingItem = generateFakeItem({ status: 'ongoing' });
    render(<ListItem onClick={onClick} item={ongoingItem} />);

    const button = screen.getByRole('button');
    expect(button).toBeEnabled();
  });

  it('calls onClick function when the button is clicked', async () => {
    render(<ListItem onClick={onClick} item={fakeItem} />);

    const button = screen.getByRole('button');

    await userEvent.click(button);

    expect(onClick).toHaveBeenCalled();
  });
})