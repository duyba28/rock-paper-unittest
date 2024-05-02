describe('NFT Staking E2E Tests', () => {
  beforeAll(async () => {
    await page.goto('http://localhost:3003'); // Adjusted to use a specific port number
  });

  it('should stake an NFT successfully', async () => {
    // Navigate to the NFT staking page
    await page.click('a[href="/nft-stake"]');

    // Fill in the form with NFT details
    await page.type('#mint_nft_address', 'test_mint_address');
    await page.type('#wallet', 'test_wallet');

    // Mock the blockchain interaction here if possible or simulate a successful response

    // Submit the form
    await page.click('#stake-button');

    // Check for a successful staking message
    await page.waitForSelector('#success-message');
    const message = await page.$eval('#success-message', el => el.textContent);
    expect(message).toContain('NFT staked successfully');
  });

  // Additional tests for unstaking and error scenarios
  it('should unstake an NFT successfully', async () => {
    // Navigate to the unstaking page and perform similar steps as staking
  });

  it('should handle staking errors gracefully', async () => {
    // Simulate an error scenario and verify the application's response
  });
});