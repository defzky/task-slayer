import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Loading from '../components/Loading';

describe('Loading', () => {
  it('renders with default message', () => {
    render(<Loading />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders with custom message', () => {
    render(<Loading message="Custom loading..." />);

    expect(screen.getByText('Custom loading...')).toBeInTheDocument();
  });

  it('has spinner element', () => {
    const { container } = render(<Loading />);

    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('has proper styling classes', () => {
    const { container } = render(<Loading />);

    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass('flex');
    expect(wrapper).toHaveClass('items-center');
    expect(wrapper).toHaveClass('justify-center');
  });
});
