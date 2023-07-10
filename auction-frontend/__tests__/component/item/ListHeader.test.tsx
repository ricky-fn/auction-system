import ListHeader from "@/component/item/ListHeader";
import { render, screen } from "@testing-library/react";

describe('ListHeader', () => {
  beforeEach(() => {
    render(<ListHeader />);
  });

  it('should render the component', () => {
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Current Price")).toBeInTheDocument();
    expect(screen.getByText("Duration")).toBeInTheDocument();
    expect(screen.getByText("Bid")).toBeInTheDocument();
  });
});