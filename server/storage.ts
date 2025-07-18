import { 
  users, 
  reputationScores, 
  leaderboard, 
  mintedNfts, 
  activities, 
  zkProofs,
  type User, 
  type InsertUser,
  type ReputationScore,
  type InsertReputationScore,
  type LeaderboardEntry,
  type InsertLeaderboardEntry,
  type MintedNft,
  type InsertMintedNft,
  type Activity,
  type InsertActivity,
  type ZkProof,
  type InsertZkProof
} from "../shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

// Storage interface for database operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByWallet(walletAddress: string): Promise<User | undefined>;
  getUserByPseudonymousId(pseudonymousId: string): Promise<User | undefined>;
  createUser(insertUser: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined>;

  // Reputation score operations
  getReputationScore(userId: number): Promise<ReputationScore | undefined>;
  getReputationScoreByWallet(walletAddress: string): Promise<ReputationScore | undefined>;
  createReputationScore(insertScore: InsertReputationScore): Promise<ReputationScore>;
  updateReputationScore(userId: number, updates: Partial<InsertReputationScore>): Promise<ReputationScore | undefined>;

  // Leaderboard operations
  getLeaderboard(limit?: number, chain?: string): Promise<LeaderboardEntry[]>;
  updateLeaderboard(): Promise<void>;
  getLeaderboardPosition(pseudonymousId: string): Promise<number | undefined>;

  // NFT operations
  getMintedNfts(userId: number): Promise<MintedNft[]>;
  getMintedNftsByWallet(walletAddress: string): Promise<MintedNft[]>;
  createMintedNft(insertNft: InsertMintedNft): Promise<MintedNft>;
  getNftByTokenId(tokenId: string, contractAddress: string): Promise<MintedNft | undefined>;

  // Activity operations
  getActivities(userId: number, limit?: number): Promise<Activity[]>;
  getActivitiesByWallet(walletAddress: string, limit?: number): Promise<Activity[]>;
  createActivity(insertActivity: InsertActivity): Promise<Activity>;
  getActivitiesByType(userId: number, activityType: string): Promise<Activity[]>;

  // ZK Proof operations
  getZkProofs(userId: number): Promise<ZkProof[]>;
  getZkProofByHash(proofHash: string): Promise<ZkProof | undefined>;
  createZkProof(insertProof: InsertZkProof): Promise<ZkProof>;
  validateZkProof(proofHash: string): Promise<boolean>;
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByWallet(walletAddress: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.walletAddress, walletAddress));
    return user || undefined;
  }

  async getUserByPseudonymousId(pseudonymousId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.pseudonymousId, pseudonymousId));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        updatedAt: new Date(),
      })
      .returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  // Reputation score operations
  async getReputationScore(userId: number): Promise<ReputationScore | undefined> {
    const [score] = await db.select().from(reputationScores).where(eq(reputationScores.userId, userId));
    return score || undefined;
  }

  async getReputationScoreByWallet(walletAddress: string): Promise<ReputationScore | undefined> {
    const [result] = await db
      .select({
        id: reputationScores.id,
        userId: reputationScores.userId,
        overallScore: reputationScores.overallScore,
        reputationLevel: reputationScores.reputationLevel,
        daoScore: reputationScores.daoScore,
        defiScore: reputationScores.defiScore,
        nftScore: reputationScores.nftScore,
        bridgeScore: reputationScores.bridgeScore,
        votingScore: reputationScores.votingScore,
        scamAvoidanceScore: reputationScores.scamAvoidanceScore,
        zkProofHash: reputationScores.zkProofHash,
        lastCalculated: reputationScores.lastCalculated,
        createdAt: reputationScores.createdAt,
        updatedAt: reputationScores.updatedAt,
      })
      .from(reputationScores)
      .innerJoin(users, eq(reputationScores.userId, users.id))
      .where(eq(users.walletAddress, walletAddress));
    return result || undefined;
  }

  async createReputationScore(insertScore: InsertReputationScore): Promise<ReputationScore> {
    const [score] = await db
      .insert(reputationScores)
      .values({
        ...insertScore,
        lastCalculated: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return score;
  }

  async updateReputationScore(userId: number, updates: Partial<InsertReputationScore>): Promise<ReputationScore | undefined> {
    const [score] = await db
      .update(reputationScores)
      .set({
        ...updates,
        lastCalculated: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(reputationScores.userId, userId))
      .returning();
    return score || undefined;
  }

  // Leaderboard operations
  async getLeaderboard(limit: number = 100, chain?: string): Promise<LeaderboardEntry[]> {
    let query = db.select().from(leaderboard);
    
    if (chain) {
      query = query.where(eq(leaderboard.chain, chain));
    }
    
    return query
      .orderBy(desc(leaderboard.overallScore))
      .limit(limit);
  }

  async updateLeaderboard(): Promise<void> {
    // Clear existing leaderboard
    await db.delete(leaderboard);

    // Populate with current scores
    const scores = await db
      .select({
        pseudonymousId: users.pseudonymousId,
        reputationLevel: reputationScores.reputationLevel,
        overallScore: reputationScores.overallScore,
        chain: users.chain,
      })
      .from(reputationScores)
      .innerJoin(users, eq(reputationScores.userId, users.id))
      .where(sql`${users.pseudonymousId} IS NOT NULL`)
      .orderBy(desc(reputationScores.overallScore));

    // Insert with ranks
    for (let i = 0; i < scores.length; i++) {
      const score = scores[i];
      await db.insert(leaderboard).values({
        pseudonymousId: score.pseudonymousId!,
        reputationLevel: score.reputationLevel,
        overallScore: score.overallScore,
        chain: score.chain,
        rank: i + 1,
      });
    }
  }

  async getLeaderboardPosition(pseudonymousId: string): Promise<number | undefined> {
    const [entry] = await db
      .select({ rank: leaderboard.rank })
      .from(leaderboard)
      .where(eq(leaderboard.pseudonymousId, pseudonymousId));
    return entry?.rank;
  }

  // NFT operations
  async getMintedNfts(userId: number): Promise<MintedNft[]> {
    return db.select().from(mintedNfts).where(eq(mintedNfts.userId, userId));
  }

  async getMintedNftsByWallet(walletAddress: string): Promise<MintedNft[]> {
    return db
      .select({
        id: mintedNfts.id,
        userId: mintedNfts.userId,
        tokenId: mintedNfts.tokenId,
        contractAddress: mintedNfts.contractAddress,
        chain: mintedNfts.chain,
        reputationLevel: mintedNfts.reputationLevel,
        metadata: mintedNfts.metadata,
        transactionHash: mintedNfts.transactionHash,
        mintedAt: mintedNfts.mintedAt,
        createdAt: mintedNfts.createdAt,
      })
      .from(mintedNfts)
      .innerJoin(users, eq(mintedNfts.userId, users.id))
      .where(eq(users.walletAddress, walletAddress));
  }

  async createMintedNft(insertNft: InsertMintedNft): Promise<MintedNft> {
    const [nft] = await db
      .insert(mintedNfts)
      .values({
        ...insertNft,
        mintedAt: new Date(),
      })
      .returning();
    return nft;
  }

  async getNftByTokenId(tokenId: string, contractAddress: string): Promise<MintedNft | undefined> {
    const [nft] = await db
      .select()
      .from(mintedNfts)
      .where(
        and(
          eq(mintedNfts.tokenId, tokenId),
          eq(mintedNfts.contractAddress, contractAddress)
        )
      );
    return nft || undefined;
  }

  // Activity operations
  async getActivities(userId: number, limit: number = 100): Promise<Activity[]> {
    return db
      .select()
      .from(activities)
      .where(eq(activities.userId, userId))
      .orderBy(desc(activities.timestamp))
      .limit(limit);
  }

  async getActivitiesByWallet(walletAddress: string, limit: number = 100): Promise<Activity[]> {
    return db
      .select({
        id: activities.id,
        userId: activities.userId,
        activityType: activities.activityType,
        contractAddress: activities.contractAddress,
        transactionHash: activities.transactionHash,
        value: activities.value,
        scoreImpact: activities.scoreImpact,
        metadata: activities.metadata,
        timestamp: activities.timestamp,
        createdAt: activities.createdAt,
      })
      .from(activities)
      .innerJoin(users, eq(activities.userId, users.id))
      .where(eq(users.walletAddress, walletAddress))
      .orderBy(desc(activities.timestamp))
      .limit(limit);
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const [activity] = await db
      .insert(activities)
      .values(insertActivity)
      .returning();
    return activity;
  }

  async getActivitiesByType(userId: number, activityType: string): Promise<Activity[]> {
    return db
      .select()
      .from(activities)
      .where(
        and(
          eq(activities.userId, userId),
          eq(activities.activityType, activityType)
        )
      )
      .orderBy(desc(activities.timestamp));
  }

  // ZK Proof operations
  async getZkProofs(userId: number): Promise<ZkProof[]> {
    return db.select().from(zkProofs).where(eq(zkProofs.userId, userId));
  }

  async getZkProofByHash(proofHash: string): Promise<ZkProof | undefined> {
    const [proof] = await db.select().from(zkProofs).where(eq(zkProofs.proofHash, proofHash));
    return proof || undefined;
  }

  async createZkProof(insertProof: InsertZkProof): Promise<ZkProof> {
    const [proof] = await db
      .insert(zkProofs)
      .values(insertProof)
      .returning();
    return proof;
  }

  async validateZkProof(proofHash: string): Promise<boolean> {
    const [proof] = await db
      .select({ isValid: zkProofs.isValid, expiresAt: zkProofs.expiresAt })
      .from(zkProofs)
      .where(eq(zkProofs.proofHash, proofHash));
    
    if (!proof) return false;
    if (!proof.isValid) return false;
    if (proof.expiresAt && proof.expiresAt < new Date()) return false;
    
    return true;
  }
}

export const storage = new DatabaseStorage();