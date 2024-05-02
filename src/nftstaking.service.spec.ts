import { Test, TestingModule } from '@nestjs/testing';
import { NftStakingService } from './nftstacking.service';
import { PrismaService } from './prisma.service';
import { BadRequestException } from '@nestjs/common';
import { PublicKey } from '@solana/web3.js';
import * as bs58 from 'bs58';

jest.mock('@solana/web3.js', () => ({
  PublicKey: jest.fn(),
  Connection: jest.fn(() => ({
    getAccountInfo: jest.fn(),
  })),
}));
jest.mock('bs58', () => ({
  encode: jest.fn(),
  decode: jest.fn(),
}));

describe('NftStakingService', () => {
  let service: NftStakingService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NftStakingService, {
        provide: PrismaService,
        useValue: {
          nFTStakingHistory: {
            findFirst: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            findMany: jest.fn(),
            aggregate: jest.fn(),
          },
          $queryRaw: jest.fn(),
          $disconnect: jest.fn(),
        },
      }],
    }).compile();

    service = module.get<NftStakingService>(NftStakingService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('stakeNft', () => {
    it('should successfully stake an NFT', async () => {
      const mockStakeDto = { mint_nft_address: 'test_mint_address', wallet: 'test_wallet', tx_hash: 'test_tx_hash', signature: 'test_signature' };
      prismaService.nFTStakingHistory.findFirst.mockResolvedValue(null);
      prismaService.nFTStakingHistory.create.mockResolvedValue(true);

      await expect(service.stakeNft(mockStakeDto)).resolves.toEqual(true);
      expect(prismaService.nFTStakingHistory.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException if NFT is already staked', async () => {
      const mockStakeDto = { mint_nft_address: 'test_mint_address', wallet: 'test_wallet', tx_hash: 'test_tx_hash', signature: 'test_signature' };
      prismaService.nFTStakingHistory.findFirst.mockResolvedValue({});

      await expect(service.stakeNft(mockStakeDto)).rejects.toThrow('Already staked NFT!!!');
    });
  });

  describe('unStakeNft', () => {
    it('should successfully unstake an NFT', async () => {
      const mockUnstakeDto = { mint_nft_address: 'test_mint_address', wallet: 'test_wallet', signature: 'test_signature' };
      prismaService.nFTStakingHistory.findFirst.mockResolvedValue({
        id: 'test_id',
        unclaimed_pandope: 100,
      });
      prismaService.nFTStakingHistory.update.mockResolvedValue(true);

      await expect(service.unStakeNft(mockUnstakeDto)).resolves.toEqual({ tx: null });
      expect(prismaService.nFTStakingHistory.update).toHaveBeenCalled();
    });
  });

  describe('claimStakingReward', () => {
    it('should successfully claim staking reward', async () => {
      const mockClaimDto = { wallet: 'test_wallet', mint_nft_address: 'test_mint_address', signature: 'valid_signature' };
      prismaService.nFTStakingHistory.findFirst.mockResolvedValue({
        id: 'test_id',
        unclaimed_pandope: 100,
      });
      prismaService.nFTStakingHistory.update.mockResolvedValue({
        id: 'test_id',
        claimed_pandope: 100,
      });

      await expect(service.claimStakingReward(mockClaimDto)).resolves.toEqual({ tx: 'mock_tx_hash', amount: 100 });
      expect(prismaService.nFTStakingHistory.update).toHaveBeenCalled();
    });
  });

  describe('claimAllStakingReward', () => {
    it('should successfully claim all staking rewards', async () => {
      const mockWallet = { wallet: 'test_wallet', signature: 'test_signature' };
      prismaService.nFTStakingHistory.findMany.mockResolvedValue([
        { id: 'test_id1', unclaimed_pandope: 100 },
        { id: 'test_id2', unclaimed_pandope: 200 },
      ]);
      prismaService.nFTStakingHistory.update.mockResolvedValue(true);

      await expect(service.claimAllStakingReward(mockWallet)).resolves.toEqual({ tx: null, amount: 0 });
      expect(prismaService.nFTStakingHistory.update).toHaveBeenCalledTimes(2);
    });
  });

  describe('getStakingNftbyUser', () => {
    it('should return staking NFTs for a user', async () => {
      const mockFilter = { wallet: 'test_wallet', page: 1, per_page: 10 };
      prismaService.nFTStakingHistory.findMany.mockResolvedValue([]);

      await expect(service.getStakingNftbyUser(mockFilter)).resolves.toEqual([]);
      expect(prismaService.nFTStakingHistory.findMany).toHaveBeenCalled();
    });
  });

  describe('getDashboardNftStaking', () => {
    it('should return dashboard data for a wallet', async () => {
      const mockWallet = 'test_wallet';
      prismaService.nFTStakingHistory.aggregate.mockResolvedValue({
        _sum: {
          unclaimed_pandope: 100,
          claimed_pandope: 200,
        },
      });

      await expect(service.getDashboardNftStaking(mockWallet)).resolves.toEqual({
        total_reward: 300,
        unclaimed_reward: 100,
      });
      expect(prismaService.nFTStakingHistory.aggregate).toHaveBeenCalled();
    });
  });

  describe('updateCalculateUnclaim', () => {
    it('should update unclaimed rewards correctly', async () => {
      prismaService.$queryRaw.mockResolvedValue(true);
      await expect(service.updateCalculateUnclaim()).resolves.toEqual(true);
      expect(prismaService.$queryRaw).toHaveBeenCalled();
    });

    it('should handle errors during update', async () => {
      prismaService.$queryRaw.mockRejectedValue(new Error('Update failed'));
      await expect(service.updateCalculateUnclaim()).rejects.toThrow('Update failed');
    });
  });

  describe('calculateNFTPoints', () => {
    it('should calculate points correctly for standard attributes', async () => {
      const nftInfo = {
        json: { attributes: [{ trait_type: "Size", value: "Large" }, { trait_type: "Color", value: "Red" }] },
        metadata: { collection: { key: "" } }
      };
      const points = await service.calculateNFTPoints(nftInfo);
      expect(points).toBeGreaterThan(0);
    });

    it('should calculate points correctly for special collection', async () => {
      const nftInfo = {
        json: { name: "SpecialOne", attributes: [] },
        metadata: { collection: { key: "specialCollectionKey" } }
      };
      const points = await service.calculateNFTPoints(nftInfo);
      expect(points).toBeGreaterThan(0);
    });

    it('should handle missing attributes gracefully', async () => {
      const nftInfo = {
        json: {},
        metadata: {}
      };
      const points = await service.calculateNFTPoints(nftInfo);
      expect(points).toEqual(0);
    });

    it('should handle invalid attributes gracefully', async () => {
      const nftInfo = {
        json: { attributes: [{ trait_type: "Invalid", value: "False" }] },
        metadata: { collection: { key: "" } }
      };
      const points = await service.calculateNFTPoints(nftInfo);
      expect(points).toEqual(0);
    });

    // Encourage adding more tests to cover all scenarios and edge cases
  });

  describe('NftStakingService - additional scenarios', () => {
    it('should accumulate reward over time', async () => {
        const wallet = 'test_wallet';
        const mintNftAddress = 'test_mint_nft_address';
        const initialUnclaimed = 10;
        const additionalPoints = 5;

        jest.spyOn(prismaService.nFTStakingHistory, 'findFirst').mockResolvedValue({
            wallet,
            mint_nft_address: mintNftAddress,
            unclaimed_pandope: initialUnclaimed,
        });

        jest.spyOn(prismaService.nFTStakingHistory, 'update').mockImplementation(async () => ({
            unclaimed_pandope: initialUnclaimed + additionalPoints,
        }));

        await service.updateCalculateUnclaim();

        expect(prismaService.nFTStakingHistory.update).toHaveBeenCalledWith({
            where: { wallet: wallet, mint_nft_address: mintNftAddress, unstaked_at: null },
            data: { unclaimed_pandope: initialUnclaimed + additionalPoints },
        });
    });

    it('should not allow staking an already staked NFT', async () => {
        const stakeDto = { mint_nft_address: 'already_staked_address', wallet: 'wallet', tx_hash: 'tx_hash', signature: 'signature' };

        jest.spyOn(prismaService.nFTStakingHistory, 'findFirst').mockResolvedValueOnce(stakeDto);

        await expect(service.stakeNft(stakeDto)).rejects.toThrow(BadRequestException);
    });

    it('should handle error when claiming rewards with insufficient balance', async () => {
        const claimDto = { wallet: 'wallet_with_insufficient_balance', mint_nft_address: 'nft_address', signature: 'signature' };

        jest.spyOn(prismaService.nFTStakingHistory, 'findFirst').mockResolvedValueOnce({
            ...claimDto,
            unclaimed_pandope: 0,
        });

        const result = await service.claimStakingReward(claimDto);

        expect(result).toEqual({ tx: null, amount: 0 });
    });
  });
});