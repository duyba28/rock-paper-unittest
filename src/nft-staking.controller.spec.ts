import { Test, TestingModule } from '@nestjs/testing';
import { NftController } from './nft-staking.controller';
import { NftStakingService } from './nftstacking.service';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('NftController', () => {
  let controller: NftController;
  let service: NftStakingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NftController],
      providers: [{
        provide: NftStakingService,
        useValue: {
          stakeNft: jest.fn().mockImplementation((dto) => Promise.resolve({ success: true })),
          unStakeNft: jest.fn().mockImplementation((dto) => Promise.resolve({ tx: 'mock_tx_id', success: true })),
          claimStakingReward: jest.fn().mockImplementation((dto) => Promise.resolve({ tx: 'mock_reward_tx_id', amount: 100 })),
          getStakingNftbyUser: jest.fn().mockResolvedValue([]),
          getDashboardNftStaking: jest.fn().mockResolvedValue({
            total_reward: 150,
            unclaimed_reward: 100,
          }),
          claimAllStakingReward: jest.fn().mockResolvedValue({ tx: 'mock_all_rewards_tx_id', amount: 500 }),
          updateCalculateUnclaim: jest.fn().mockResolvedValue(true),
        }
      }],
    }).compile();

    controller = module.get<NftController>(NftController);
    service = module.get<NftStakingService>(NftStakingService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('stakeNft', () => {
    it('should successfully stake an NFT', async () => {
      const dto = { wallet: 'test_wallet', mint_nft_address: 'test_address', tx_hash: 'test_hash', signature: 'test_signature' };
      jest.spyOn(service, 'stakeNft').mockResolvedValue(true);
      await expect(controller.stakeNft(dto)).resolves.toEqual({
        statusCode: 200,
        data: true,
      });
    });

    it('should throw an error if staking fails', async () => {
      const dto = { wallet: 'test_wallet', mint_nft_address: 'test_address', tx_hash: 'test_hash', signature: 'test_signature' };
      jest.spyOn(service, 'stakeNft').mockRejectedValue(new HttpException('Staking failed', 400));
      await expect(controller.stakeNft(dto)).rejects.toThrow('Staking failed');
    });

    it('should return 400 Bad Request for invalid input to stakeNft', async () => {
      const dto = { wallet: '', mint_nft_address: '', tx_hash: '', signature: '' }; // Assuming these are invalid inputs
      jest.spyOn(service, 'stakeNft').mockRejectedValue(new HttpException('Bad Request', HttpStatus.BAD_REQUEST));
      await expect(controller.stakeNft(dto)).rejects.toThrow(new HttpException('Bad Request', HttpStatus.BAD_REQUEST));
    });

    it('should handle unexpected errors gracefully', async () => {
      const dto = { wallet: 'test_wallet', mint_nft_address: 'test_address', tx_hash: 'test_hash', signature: 'test_signature' };
      jest.spyOn(service, 'stakeNft').mockRejectedValue(new Error('Internal Server Error'));
      await expect(controller.stakeNft(dto)).rejects.toThrow('Internal Server Error');
    });
  });

  describe('unStakeNft', () => {
    it('should successfully unstake an NFT', async () => {
      const dto = { wallet: 'test_wallet', mint_nft_address: 'test_address', signature: 'test_signature' };
      jest.spyOn(service, 'unStakeNft').mockResolvedValue({ tx: 'mock_tx_id' });
      await expect(controller.unStakeNft(dto)).resolves.toEqual({
        statusCode: 200,
        data: { tx: 'mock_tx_id' },
      });
    });

    it('should throw an error if unstaking fails', async () => {
      const dto = { wallet: 'test_wallet', mint_nft_address: 'test_address', signature: 'test_signature' };
      jest.spyOn(service, 'unStakeNft').mockRejectedValue(new HttpException('Unstaking failed', 400));
      await expect(controller.unStakeNft(dto)).rejects.toThrow('Unstaking failed');
    });
  });

  describe('claimReward', () => {
    it('should successfully claim reward', async () => {
      const dto = { wallet: 'test_wallet', mint_nft_address: 'test_address', signature: 'test_signature' };
      jest.spyOn(service, 'claimStakingReward').mockResolvedValue({ tx: 'mock_reward_tx_id', amount: 100 });
      await expect(controller.claimReward(dto)).resolves.toEqual({
        statusCode: 200,
        data: { tx: 'mock_reward_tx_id', amount: 100 },
      });
    });

    it('should throw an error if claiming reward fails', async () => {
      const dto = { wallet: 'test_wallet', mint_nft_address: 'test_address', signature: 'test_signature' };
      jest.spyOn(service, 'claimStakingReward').mockRejectedValue(new HttpException('Claiming reward failed', 400));
      await expect(controller.claimReward(dto)).rejects.toThrow('Claiming reward failed');
    });
  });

  describe('getStakingNfts', () => {
    it('should return staking NFTs for a user', async () => {
      const filter = { wallet: 'test_wallet' };
      jest.spyOn(service, 'getStakingNftbyUser').mockResolvedValue([]);
      await expect(controller.getStakingNfts(filter)).resolves.toEqual({
        data: [],
        statusCode: 200,
      });
    });
  });

  describe('getNftDashboard', () => {
    it('should return dashboard data for a wallet', async () => {
      const params = { wallet: 'test_wallet' };
      jest.spyOn(service, 'getDashboardNftStaking').mockResolvedValue({ total_reward: 500, unclaimed_reward: 100 });
      await expect(controller.getNftDashboard(params)).resolves.toEqual({
        data: { total_reward: 500, unclaimed_reward: 100 },
        statusCode: 200,
      });
    });
  });

  describe('claimAllReward', () => {
    it('should successfully claim all rewards', async () => {
      const dto = { wallet: 'test_wallet', signature: 'test_signature' };
      jest.spyOn(service, 'claimAllStakingReward').mockResolvedValue({ tx: 'mock_all_rewards_tx_id', amount: 500 });
      await expect(controller.claimAllReward(dto)).resolves.toEqual({
        data: { tx: 'mock_all_rewards_tx_id', amount: 500 },
        statusCode: 200,
      });
    });

    it('should throw an error if claiming all rewards fails', async () => {
      const dto = { wallet: 'test_wallet', signature: 'test_signature' };
      jest.spyOn(service, 'claimAllStakingReward').mockRejectedValue(new HttpException('Claiming all rewards failed', 400));
      await expect(controller.claimAllReward(dto)).rejects.toThrow('Claiming all rewards failed');
    });
  });

  describe('updatePandopeClaim', () => {
    it('should successfully update pandope claim', async () => {
      jest.spyOn(service, 'updateCalculateUnclaim').mockResolvedValue(true);
      await expect(controller.updatePandopeClaim()).resolves.toEqual(true);
    });

    it('should log an error if updating pandope claim fails', async () => {
      jest.spyOn(service, 'updateCalculateUnclaim').mockRejectedValue(new Error('Update failed'));
      await expect(controller.updatePandopeClaim()).rejects.toThrow('Update failed');
    });
  });
});