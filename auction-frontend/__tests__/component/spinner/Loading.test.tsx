import { renderWithProviders } from '@/__tests__/utils';
import Loading from '@/component/spinner/Loading';
import { screen } from '@testing-library/react';

describe('Loading', () => {
  it('should render the component', () => {
    renderWithProviders(<Loading />, {
      preloadedState: {
        app: {
          isLoading: true,
          toastType: 'success',
          toastMessage: null,
          showToast: false,
        }
      }
    });

    expect(screen.getByText("Please wait for loading...")).toBeInTheDocument();
  });

  it('should not render the component', () => {
    renderWithProviders(<Loading />, {
      preloadedState: {
        app: {
          isLoading: false,
          toastType: 'success',
          toastMessage: null,
          showToast: false,
        }
      }
    });

    expect(screen.queryByText("Please wait for loading...")).not.toBeInTheDocument();
  });
});