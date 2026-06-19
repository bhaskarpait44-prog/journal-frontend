import '@testing-library/jest-dom';
import React from 'react';

// Mock window.matchMedia for Ant Design components
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {}, // Deprecated
    removeListener: () => {}, // Deprecated
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// Mock ResizeObserver for Ant Design components
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver = ResizeObserver;

// Mock framer-motion globally
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, whileHover, whileTap, initial, animate, exit, transition, layoutId, layout, ...props }) => (
      React.createElement('div', props, children)
    ),
    span: ({ children, whileHover, whileTap, initial, animate, exit, transition, layoutId, layout, ...props }) => (
      React.createElement('span', props, children)
    ),
  },
  AnimatePresence: ({ children }) => React.createElement(React.Fragment, null, children),
}));