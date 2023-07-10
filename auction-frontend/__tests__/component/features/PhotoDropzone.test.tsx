import { render, screen } from '@testing-library/react';
import PhotoDropzone, { PhotoDropzoneProps } from '@/component/features/PhotoDropzone';
import userEvent from '@testing-library/user-event';

describe('PhotoDropzone', () => {
  const props: PhotoDropzoneProps = {
    selectedFile: undefined,
    updateFile: jest.fn(),
    fieldName: 'test',
    fieldError: null
  };

  it('should render a input element', () => {
    render(<PhotoDropzone {...props} />);
    const input = screen.getByTestId('input-photo');
    expect(input).toBeInTheDocument();
  });

  it('should render a error message', () => {
    const errorProps = { ...props, fieldError: 'test error' };
    render(<PhotoDropzone {...errorProps} />);
    const error = screen.getByText('test error');
    expect(error).toBeInTheDocument();
  });

  it('should render a preview image', () => {
    const imageProps = { ...props, selectedFile: new File(['test'], 'test.png') };
    global.URL.createObjectURL = jest.fn(() => 'http://localhost/test.png');
    render(<PhotoDropzone {...imageProps} />);
    const preview = screen.getByRole('img');
    expect(preview).toBeInTheDocument();
    expect(preview).toHaveAttribute('src', 'http://localhost/test.png');
  });

  it('should call updateFile when input changes', async () => {
    const updateFile = jest.fn();
    const updateFileProps = { ...props, updateFile };
    render(<PhotoDropzone {...updateFileProps} />);
    const input = screen.getByTestId('input-photo');
    const file = new File(['test'], 'test.png');

    await userEvent.upload(input, file);

    expect(updateFile).toHaveBeenCalledWith(updateFileProps.fieldName, file);
  });

  it('shouldn\'t render preview if the fieldError is not null', () => {
    const errorProps = { ...props, fieldError: 'test error', selectedFile: new File(['test'], 'test.png') };
    render(<PhotoDropzone {...errorProps} />);
    const preview = screen.queryByRole('img');
    expect(preview).not.toBeInTheDocument();
  });
});