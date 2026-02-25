import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Bridge vitest fake timers with @testing-library/dom's jest detection.
// @testing-library/dom checks `jest.advanceTimersByTime` to handle waitFor
// polling when fake timers are active.
globalThis.jest = {
  ...globalThis.jest,
  advanceTimersByTime: vi.advanceTimersByTime.bind(vi),
  isMockFunction: (fn) => vi.isMockFunction?.(fn) ?? false,
};
