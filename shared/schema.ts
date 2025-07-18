import { pgTable, serial, varchar, integer, decimal, timestamp, boolean, text, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// Users table to store wallet addresses and basic info
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  walletAddress: varchar('wallet_address', { length: 64 }).notNull().unique(),
  chain: varchar('chain', { length: 20 }).notNull(), // 'ethereum', 'solana', etc.
  publicKey: varchar('public_key', { length: 128 }),
  pseudonymousId: varchar('pseudonymous_id', { length: 64 }).unique(), // For anonymous leaderboard
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Reputation scores table
export const reputationScores = pgTable('reputation_scores', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  overallScore: decimal('overall_score', { precision: 10, scale: 2 }).notNull(),
  reputationLevel: varchar('reputation_level', { length: 20 }).notNull(), // 'bronze', 'silver', 'gold'
  daoScore: decimal('dao_score', { precision: 10, scale: 2 }).default('0'),
  defiScore: decimal('defi_score', { precision: 10, scale: 2 }).default('0'),
  nftScore: decimal('nft_score', { precision: 10, scale: 2 }).default('0'),
  bridgeScore: decimal('bridge_score', { precision: 10, scale: 2 }).default('0'),
  votingScore: decimal('voting_score', { precision: 10, scale: 2 }).default('0'),
  scamAvoidanceScore: decimal('scam_avoidance_score', { precision: 10, scale: 2 }).default('0'),
  zkProofHash: varchar('zk_proof_hash', { length: 128 }), // ZK proof for privacy
  lastCalculated: timestamp('last_calculated').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Leaderboard entries (anonymous)
export const leaderboard = pgTable('leaderboard', {
  id: serial('id').primaryKey(),
  pseudonymousId: varchar('pseudonymous_id', { length: 64 }).notNull(),
  reputationLevel: varchar('reputation_level', { length: 20 }).notNull(),
  overallScore: decimal('overall_score', { precision: 10, scale: 2 }).notNull(),
  chain: varchar('chain', { length: 20 }).notNull(),
  rank: integer('rank').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// NFTs minted for reputation achievements
export const mintedNfts = pgTable('minted_nfts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  tokenId: varchar('token_id', { length: 128 }).notNull(),
  contractAddress: varchar('contract_address', { length: 64 }).notNull(),
  chain: varchar('chain', { length: 20 }).notNull(),
  reputationLevel: varchar('reputation_level', { length: 20 }).notNull(),
  metadata: jsonb('metadata'), // NFT metadata including image, attributes
  transactionHash: varchar('transaction_hash', { length: 128 }),
  mintedAt: timestamp('minted_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Activity tracking for reputation calculation
export const activities = pgTable('activities', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  activityType: varchar('activity_type', { length: 50 }).notNull(), // 'dao_vote', 'defi_transaction', 'nft_trade', etc.
  contractAddress: varchar('contract_address', { length: 64 }),
  transactionHash: varchar('transaction_hash', { length: 128 }),
  value: decimal('value', { precision: 18, scale: 8 }), // Transaction value if applicable
  scoreImpact: decimal('score_impact', { precision: 10, scale: 2 }).notNull(), // How much this activity affected score
  metadata: jsonb('metadata'), // Additional activity details
  timestamp: timestamp('timestamp').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ZK proofs for privacy-preserving verification
export const zkProofs = pgTable('zk_proofs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  proofHash: varchar('proof_hash', { length: 128 }).notNull().unique(),
  proofData: text('proof_data'), // Serialized ZK proof
  verificationKey: text('verification_key'),
  publicInputs: jsonb('public_inputs'),
  isValid: boolean('is_valid').default(true),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  reputationScores: many(reputationScores),
  mintedNfts: many(mintedNfts),
  activities: many(activities),
  zkProofs: many(zkProofs),
}));

export const reputationScoresRelations = relations(reputationScores, ({ one }) => ({
  user: one(users, { fields: [reputationScores.userId], references: [users.id] }),
}));

export const mintedNftsRelations = relations(mintedNfts, ({ one }) => ({
  user: one(users, { fields: [mintedNfts.userId], references: [users.id] }),
}));

export const activitiesRelations = relations(activities, ({ one }) => ({
  user: one(users, { fields: [activities.userId], references: [users.id] }),
}));

export const zkProofsRelations = relations(zkProofs, ({ one }) => ({
  user: one(users, { fields: [zkProofs.userId], references: [users.id] }),
}));

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertReputationScoreSchema = createInsertSchema(reputationScores).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastCalculated: true,
});

export const insertLeaderboardSchema = createInsertSchema(leaderboard).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMintedNftSchema = createInsertSchema(mintedNfts).omit({
  id: true,
  createdAt: true,
  mintedAt: true,
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  createdAt: true,
}).extend({
  timestamp: z.string().or(z.date()).transform((val) => new Date(val)),
});

export const insertZkProofSchema = createInsertSchema(zkProofs).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type ReputationScore = typeof reputationScores.$inferSelect;
export type InsertReputationScore = z.infer<typeof insertReputationScoreSchema>;

export type LeaderboardEntry = typeof leaderboard.$inferSelect;
export type InsertLeaderboardEntry = z.infer<typeof insertLeaderboardSchema>;

export type MintedNft = typeof mintedNfts.$inferSelect;
export type InsertMintedNft = z.infer<typeof insertMintedNftSchema>;

export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;

export type ZkProof = typeof zkProofs.$inferSelect;
export type InsertZkProof = z.infer<typeof insertZkProofSchema>;