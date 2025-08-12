/**
 * Test Setup Configuration
 * Global test environment setup for Vitest
 */

import { vi } from 'vitest'

// Mock localStorage for testing with in-memory store
const store: Record<string, string> = {}
const localStorageMock = {
  getItem: vi.fn((key: string) => (key in store ? store[key] : null)),
  setItem: vi.fn((key: string, value: string) => { store[key] = String(value) }),
  removeItem: vi.fn((key: string) => { delete store[key] }),
  clear: vi.fn(() => { Object.keys(store).forEach(k => delete store[k]) }),
  length: 0,
  key: vi.fn((index: number) => Object.keys(store)[index] ?? null)
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true
})

// Mock console methods to reduce noise during tests
global.console = {
  ...console,
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  debug: vi.fn()
}

// Mock window.URL for URL validation tests
global.URL = class URL {
  constructor(public href: string) {
    if (!href.match(/^https?:\/\/.+/)) {
      throw new Error('Invalid URL')
    }
  }
}

// Mock fetch for API tests
global.fetch = vi.fn()

// Mock crypto for UUID generation
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => 'test-uuid-' + Math.random().toString(36).substr(2, 9)
  }
})

// Reset all mocks before each test
beforeEach(() => {
  vi.clearAllMocks()
  localStorageMock.clear()
})