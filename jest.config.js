/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFiles: ['./setupTests.js'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  // Put ts-jest options here (not under `globals`)
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.jest.json' }],
  },
};