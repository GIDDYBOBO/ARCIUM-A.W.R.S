import express from 'express';
import { storage } from './storage';
import { 
  insertUserSchema,
  insertReputationScoreSchema,
  insertMintedNftSchema,
  insertActivitySchema,
  insertZkProofSchema
} from '../shared/schema';
import { ZodError } from 'zod';

const router = express.Router();

// Error handler for validation
const handleValidationError = (error: unknown, res: express.Response) => {
  if (error instanceof ZodError) {
    return res.status(400).json({ 
      error: 'Validation failed', 
      details: error.errors 
    });
  }
  console.error('Server error:', error);
  return res.status(500).json({ error: 'Internal server error' });
};

// User routes
router.get('/api/users/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const user = await storage.getUserByWallet(walletAddress);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    handleValidationError(error, res);
  }
});

router.post('/api/users', async (req, res) => {
  try {
    const userData = insertUserSchema.parse(req.body);
    
    // Generate pseudonymous ID for leaderboard
    const pseudonymousId = `anon_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    userData.pseudonymousId = pseudonymousId;
    
    const user = await storage.createUser(userData);
    res.status(201).json(user);
  } catch (error) {
    handleValidationError(error, res);
  }
});

// Reputation score routes
router.get('/api/reputation/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const score = await storage.getReputationScoreByWallet(walletAddress);
    
    if (!score) {
      return res.status(404).json({ error: 'Reputation score not found' });
    }
    
    res.json(score);
  } catch (error) {
    handleValidationError(error, res);
  }
});

router.post('/api/reputation', async (req, res) => {
  try {
    const scoreData = insertReputationScoreSchema.parse(req.body);
    const score = await storage.createReputationScore(scoreData);
    
    // Update leaderboard after creating new score
    await storage.updateLeaderboard();
    
    res.status(201).json(score);
  } catch (error) {
    handleValidationError(error, res);
  }
});

router.put('/api/reputation/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const updates = insertReputationScoreSchema.partial().parse(req.body);
    
    const score = await storage.updateReputationScore(userId, updates);
    
    if (!score) {
      return res.status(404).json({ error: 'Reputation score not found' });
    }
    
    // Update leaderboard after score update
    await storage.updateLeaderboard();
    
    res.json(score);
  } catch (error) {
    handleValidationError(error, res);
  }
});

// Leaderboard routes
router.get('/api/leaderboard', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
    const chain = req.query.chain as string;
    
    const leaderboard = await storage.getLeaderboard(limit, chain);
    res.json(leaderboard);
  } catch (error) {
    handleValidationError(error, res);
  }
});

router.get('/api/leaderboard/position/:pseudonymousId', async (req, res) => {
  try {
    const { pseudonymousId } = req.params;
    const position = await storage.getLeaderboardPosition(pseudonymousId);
    
    if (position === undefined) {
      return res.status(404).json({ error: 'Position not found' });
    }
    
    res.json({ position });
  } catch (error) {
    handleValidationError(error, res);
  }
});

router.post('/api/leaderboard/update', async (req, res) => {
  try {
    await storage.updateLeaderboard();
    res.json({ message: 'Leaderboard updated successfully' });
  } catch (error) {
    handleValidationError(error, res);
  }
});

// NFT routes
router.get('/api/nfts/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const nfts = await storage.getMintedNftsByWallet(walletAddress);
    res.json(nfts);
  } catch (error) {
    handleValidationError(error, res);
  }
});

router.post('/api/nfts', async (req, res) => {
  try {
    const nftData = insertMintedNftSchema.parse(req.body);
    const nft = await storage.createMintedNft(nftData);
    res.status(201).json(nft);
  } catch (error) {
    handleValidationError(error, res);
  }
});

router.get('/api/nfts/token/:tokenId/:contractAddress', async (req, res) => {
  try {
    const { tokenId, contractAddress } = req.params;
    const nft = await storage.getNftByTokenId(tokenId, contractAddress);
    
    if (!nft) {
      return res.status(404).json({ error: 'NFT not found' });
    }
    
    res.json(nft);
  } catch (error) {
    handleValidationError(error, res);
  }
});

// Activity routes
router.get('/api/activities/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
    
    const activities = await storage.getActivitiesByWallet(walletAddress, limit);
    res.json(activities);
  } catch (error) {
    handleValidationError(error, res);
  }
});

router.post('/api/activities', async (req, res) => {
  try {
    const activityData = insertActivitySchema.parse(req.body);
    const activity = await storage.createActivity(activityData);
    res.status(201).json(activity);
  } catch (error) {
    handleValidationError(error, res);
  }
});

router.get('/api/activities/:userId/type/:activityType', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const { activityType } = req.params;
    
    const activities = await storage.getActivitiesByType(userId, activityType);
    res.json(activities);
  } catch (error) {
    handleValidationError(error, res);
  }
});

// ZK Proof routes
router.get('/api/zkproofs/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const user = await storage.getUserByWallet(walletAddress);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const proofs = await storage.getZkProofs(user.id);
    res.json(proofs);
  } catch (error) {
    handleValidationError(error, res);
  }
});

router.post('/api/zkproofs', async (req, res) => {
  try {
    const proofData = insertZkProofSchema.parse(req.body);
    const proof = await storage.createZkProof(proofData);
    res.status(201).json(proof);
  } catch (error) {
    handleValidationError(error, res);
  }
});

router.get('/api/zkproofs/verify/:proofHash', async (req, res) => {
  try {
    const { proofHash } = req.params;
    const isValid = await storage.validateZkProof(proofHash);
    res.json({ isValid });
  } catch (error) {
    handleValidationError(error, res);
  }
});

router.get('/api/zkproofs/hash/:proofHash', async (req, res) => {
  try {
    const { proofHash } = req.params;
    const proof = await storage.getZkProofByHash(proofHash);
    
    if (!proof) {
      return res.status(404).json({ error: 'ZK proof not found' });
    }
    
    res.json(proof);
  } catch (error) {
    handleValidationError(error, res);
  }
});

// Health check
router.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;