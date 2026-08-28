/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  roots: ['<rootDir>/src', '<rootDir>/test'],
  testMatch: ['**/*.test.ts', '**/*.spec.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/test/integration/'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  clearMocks: true,
  coverageThreshold: {
    './src/domain/': {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80,
    },
    './src/usecase/': {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80,
    },
  },
};
