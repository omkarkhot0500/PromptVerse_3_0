import '@testing-library/jest-dom';

// Mock next/navigation with jest.fn() so individual tests can override return values
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
  })),
  usePathname: jest.fn(() => ''),
  useSearchParams: jest.fn(() => new URLSearchParams()),
}));

// Suppress console.log in tests unless you need it for debugging
// global.console.log = jest.fn();
