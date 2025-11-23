import { render } from '@testing-library/react';
import App from './App';

describe('App', () => {
  test('renders without crashing', () => {
    const { container } = render(<App />);
    // App should render successfully
    expect(container).toBeInTheDocument();
  });

  test('renders application structure', () => {
    const { container } = render(<App />);
    // Check that the app renders with content
    expect(container.querySelector('.MuiBox-root')).toBeInTheDocument();
  });
});
