import ItemCreation from "@/component/features/ItemCreation";
import { screen, render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useSession } from "next-auth/react";

const fileName = "test.png";
jest.mock('@/lib/hooks/useServices', () => {
  return {
    __esModule: true,
    default: () => {
      return {
        dataService: {
          uploadPhoto: jest.fn(() => Promise.resolve(fileName)),
        }
      }
    }
  }
});

jest.mock("next-auth/react")
  ; (useSession as jest.Mock).mockReturnValue({
    data: {
      expires: new Date(Date.now() + 2 * 86400).toISOString(),
      user: { name: "admin" }
    },
    status: "authenticated",
  })

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

describe('ItemCreation', () => {
  beforeEach(() => {
    render(<ItemCreation />);
  })

  afterEach(() => {
    mockDispatch.mockClear();
  });

  it('should render input fields', () => {
    expect(screen.getByRole('textbox', { name: /Name/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /Time Window/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /About/i })).toBeInTheDocument();
    expect(screen.getByRole('spinbutton', { name: /Start Price/i })).toBeInTheDocument();
    expect(screen.getByTestId('input-photo')).toBeInTheDocument();
  });

  it('should render a button to create item', () => {
    expect(screen.getByRole('button', { name: /Save/i })).toBeInTheDocument();
  });

  it('should render a button to cancel', () => {
    expect(screen.getByRole('link', { name: /Cancel/i })).toBeInTheDocument();
  });

  it('should validate input fields', async () => {
    const nameInput = screen.getByRole('textbox', { name: /Name/i });
    const timeWindowInput = screen.getByRole('textbox', { name: /Time Window/i });
    const aboutInput = screen.getByRole('textbox', { name: /About/i });
    const startPriceInput = screen.getByRole('spinbutton', { name: /Start Price/i });
    const photoInput = screen.getByTestId('input-photo');

    await userEvent.type(nameInput, "test");
    await userEvent.clear(nameInput);
    expect(screen.getByText(/Item name cannot be empty./i)).toBeInTheDocument();
    await userEvent.type(nameInput, "test");
    expect(screen.queryByText(/Item name cannot be empty./i)).not.toBeInTheDocument();

    await userEvent.type(timeWindowInput, "test");
    expect(screen.getByText(/Time window must follow the format of Xh, e.g., 1h./i)).toBeInTheDocument();
    await userEvent.clear(timeWindowInput);
    await userEvent.type(timeWindowInput, "2h");
    expect(screen.queryByText(/Time window must follow the format of Xh, e.g., 1h./i)).not.toBeInTheDocument();

    await userEvent.type(aboutInput, "test");
    await userEvent.clear(aboutInput);
    expect(screen.getByText(/About cannot be empty./i)).toBeInTheDocument();

    await userEvent.type(startPriceInput, "0");
    expect(screen.getByText(/Start price must be a number greater than 0./i)).toBeInTheDocument();
    await userEvent.clear(startPriceInput);
    await userEvent.type(startPriceInput, "1");
    expect(screen.queryByText(/Start price must be a number greater than 0./i)).not.toBeInTheDocument();

    global.URL.createObjectURL = jest.fn();
    const overSizeFile = new File(["test"], "test.png", { type: "image/png" });
    Object.defineProperty(overSizeFile, 'size', { value: 1024 * 1024 * 6 });
    await userEvent.upload(photoInput, overSizeFile);
    expect(screen.getByText(/Photo must be less than 5MB./i)).toBeInTheDocument();
    const file = new File(["test"], "test.png", { type: "image/png" });
    Object.defineProperty(file, 'size', { value: 1024 * 1024 * 2 });
    await userEvent.upload(photoInput, file);
    expect(screen.queryByText(/Photo must be less than 5MB./i)).not.toBeInTheDocument();
  });
});