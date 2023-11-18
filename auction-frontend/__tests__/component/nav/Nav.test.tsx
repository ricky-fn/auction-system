import Logo from "@/public/logo.png";
import { screen } from '@testing-library/react';
import Nav from "@/component/nav/Nav";
import { generateFakeUser } from "auction-shared/mocks/fakeData/user";
import { signIn, signOut } from 'next-auth/react';
import userEvent from "@testing-library/user-event"
import { renderWithProviders } from "@/__tests__/utils";

jest.mock("next-auth/react")

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

describe('Nav', () => {
  const fakeUser = generateFakeUser();

  afterEach(() => {
    mockDispatch.mockClear();
  });

  it('should render the logo', async () => {
    renderWithProviders(<Nav user={fakeUser} />);
    const logo = await screen.findByRole('img', { name: /Auction System/i });
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute('src', Logo.src);
  });

  it('should render the sign in button when user is not logged in', async () => {
    renderWithProviders(<Nav user={undefined} />);
    const signInButton = await screen.findByRole('button', { name: /Sign In/i });
    expect(signInButton).toBeInTheDocument();
  });

  it('should call signIn when user clicks on the sign in button', async () => {
    renderWithProviders(<Nav user={undefined} />);
    const signInButton = await screen.findByRole('button', { name: /Sign In/i });
    await userEvent.click(signInButton);
    expect(signIn).toHaveBeenCalledWith('cognito');

  });

  it('should render the main menu when user is logged in', async () => {
    renderWithProviders(<Nav user={fakeUser} />);
    const mainMenu = await screen.findByRole('button', { name: /Open main menu/i });
    expect(mainMenu).toBeInTheDocument();
  });

  it('should call signOut when user clicks on the sign out button', async () => {
    renderWithProviders(<Nav user={fakeUser} />);
    const mainMenu = await screen.findByRole('button', { name: /Open main menu/i });
    await userEvent.click(mainMenu);
    const signOutButton = await screen.findByRole('button', { name: /Sign out/i });
    await userEvent.click(signOutButton);
    expect(signOut).toHaveBeenCalled();
  });
})