module.exports = {
  preset: 'jest-puppeteer',
  testMatch: ['**/test/e2e/**/*.spec.js'],
  testPathIgnorePatterns: ['/node_modules/'],
  verbose: true,
};