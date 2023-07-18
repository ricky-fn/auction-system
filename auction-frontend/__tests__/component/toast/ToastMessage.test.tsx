import { renderWithProviders } from '@/__tests__/utils';
import ToastMessage, { ToastIcon } from '@/component/toast/ToastMessage';
import { hideToast } from '@/store/actions/appActions';
import { AppData } from '@/store/reducers/appReducer';
import { CheckIcon, ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

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

describe('ToastMessage', () => {
  const defaultAppState: AppData = {
    isLoading: false,
    toastType: 'success',
    toastMessage: 'test message',
    showToast: true,
  }

  afterEach(() => {
    mockDispatch.mockClear();
  });

  it('should render the component with message and icon', () => {
    renderWithProviders(<ToastMessage />, {
      preloadedState: {
        app: defaultAppState
      }
    });

    expect(screen.getByText("test message")).toBeInTheDocument();
    expect(screen.getByTestId("icon")).toBeInTheDocument();
  });

  it('should not render the component', () => {
    renderWithProviders(<ToastMessage />, {
      preloadedState: {
        app: {
          ...defaultAppState,
          showToast: false,
        }
      }
    });

    expect(screen.queryByText("test message")).not.toBeInTheDocument();
  });

  it('should return icon based on toast type', () => {
    const SuccessIcon = ToastIcon('success');

    expect(SuccessIcon).toEqual(CheckIcon)

    const ErrorIcon = ToastIcon('error');

    expect(ErrorIcon).toEqual(XMarkIcon)

    const WarningIcon = ToastIcon('warning');

    expect(WarningIcon).toEqual(ExclamationTriangleIcon)
  });

  it('should dispatch hideToast action', async () => {
    renderWithProviders(<ToastMessage />, {
      preloadedState: {
        app: defaultAppState
      }
    });

    const closeBtn = screen.getByRole('button');

    await userEvent.click(closeBtn);

    expect(mockDispatch).toHaveBeenCalledTimes(1);
    expect(mockDispatch).toHaveBeenCalledWith(hideToast());
  });
});