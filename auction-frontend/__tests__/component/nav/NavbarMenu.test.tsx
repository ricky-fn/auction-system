import { render, screen } from '@testing-library/react';
import NavbarMenu, { NavbarMenuProps } from '@/component/nav/NavbarMenu';
import { generateFakeUser } from 'auction-shared/mocks/fakeData/user';
import userEvent from '@testing-library/user-event';

describe('NavbarMenu', () => {
  const fakeUser = generateFakeUser();
  const props: NavbarMenuProps = {
    user: fakeUser,
    signOut: jest.fn(),
    userNavigation: [
      {
        name: 'Profile',
        href: '/profile',
      },
      {
        name: 'Settings',
        href: '/settings',
      },
    ]
  }
  beforeEach(() => {
    render(<NavbarMenu {...props} />);
  });

  it('should render the dropdown menu when user clicks on the button', async () => {
    const button = screen.getByRole('button', { name: /Open user menu/i });

    await userEvent.click(button);

    const profileLink = screen.getByRole('menuitem', { name: /Profile/i });
    expect(profileLink).toBeInTheDocument();
    expect(profileLink).toHaveAttribute('href', '/profile');

    const settingsLink = screen.getByRole('menuitem', { name: /Settings/i });
    expect(settingsLink).toBeInTheDocument();
    expect(settingsLink).toHaveAttribute('href', '/settings');
  });

  it('should render the user information', async () => {
    const button = screen.getByRole('button', { name: /Open user menu/i });

    await userEvent.click(button);

    const name = screen.getByText(`${fakeUser.given_name} ${fakeUser.family_name}`);
    expect(name).toBeInTheDocument();

    const email = screen.getByText(fakeUser.email);
    expect(email).toBeInTheDocument();
  });

  it('should call signOut when user clicks on the sign out button', async () => {
    const button = screen.getByRole('button', { name: /Open user menu/i });

    await userEvent.click(button);

    const signOutButton = screen.getByRole('menuitem', { name: /Sign out/i });

    await userEvent.click(signOutButton);

    expect(props.signOut).toHaveBeenCalled();
  });
});