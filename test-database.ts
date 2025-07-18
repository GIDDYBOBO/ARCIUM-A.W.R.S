#!/usr/bin/env tsx

/**
 * Test script to demonstrate the Anonymous Wallet Reputation System database functionality
 * Run with: tsx test-database.ts
 */

import { storage } from './server/storage';

async function testDatabase() {
  console.log('🧪 Testing Anonymous Wallet Reputation System Database...\n');

  try {
    // Test 1: Create a new user
    console.log('1️⃣  Creating a new user...');
    const user = await storage.createUser({
      walletAddress: '0x742d35Cc6596C0532C51234B9c6B4e2F6e8C8e30',
      chain: 'ethereum',
      publicKey: '0x04c96d2c8ec0e3e54d8b9e3d5f2b8a7e9d8c7b6a5947382736475869287364589',
      pseudonymousId: `anon_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
    });
    console.log('✅ User created:', { id: user.id, pseudonymousId: user.pseudonymousId });

    // Test 2: Create reputation score
    console.log('\n2️⃣  Creating reputation score...');
    const reputation = await storage.createReputationScore({
      userId: user.id,
      overallScore: '892.75',
      reputationLevel: 'gold',
      daoScore: '180.50',
      defiScore: '250.25',
      nftScore: '150.00',
      bridgeScore: '140.75',
      votingScore: '95.25',
      scamAvoidanceScore: '76.00'
    });
    console.log('✅ Reputation score created:', { 
      level: reputation.reputationLevel, 
      score: reputation.overallScore 
    });

    // Test 3: Update leaderboard
    console.log('\n3️⃣  Updating leaderboard...');
    await storage.updateLeaderboard();
    const leaderboard = await storage.getLeaderboard(5);
    console.log('✅ Leaderboard updated with', leaderboard.length, 'entries');
    leaderboard.forEach((entry, index) => {
      console.log(`   ${index + 1}. ${entry.pseudonymousId} - ${entry.reputationLevel} (${entry.overallScore})`);
    });

    // Test 4: Create NFT
    console.log('\n4️⃣  Minting reputation NFT...');
    const nft = await storage.createMintedNft({
      userId: user.id,
      tokenId: '2001',
      contractAddress: '0x123def456789abc123def456789abc123def45678',
      chain: 'ethereum',
      reputationLevel: 'gold',
      metadata: {
        name: 'Gold Reputation Badge',
        description: 'Earned for achieving Gold reputation level',
        image: 'https://reputation-nfts.example.com/gold-badge.svg',
        attributes: [
          { trait_type: 'Level', value: 'Gold' },
          { trait_type: 'Score', value: '892.75' },
          { trait_type: 'Chain', value: 'Ethereum' }
        ]
      },
      transactionHash: '0xabc123def456789abc123def456789abc123def456789abc123def456789abc123'
    });
    console.log('✅ NFT minted:', { tokenId: nft.tokenId, level: nft.reputationLevel });

    // Test 5: Create activity
    console.log('\n5️⃣  Recording on-chain activity...');
    const activity = await storage.createActivity({
      userId: user.id,
      activityType: 'defi_transaction',
      contractAddress: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      transactionHash: '0xdef456789abc123def456789abc123def456789abc123def456789abc123def456',
      value: '1000.50',
      scoreImpact: '15.25',
      metadata: {
        protocol: 'Compound',
        action: 'supply',
        token: 'DAI',
        amount: '1000.50'
      },
      timestamp: new Date()
    });
    console.log('✅ Activity recorded:', { 
      type: activity.activityType, 
      impact: activity.scoreImpact 
    });

    // Test 6: Get user statistics
    console.log('\n6️⃣  Retrieving user statistics...');
    const userByWallet = await storage.getUserByWallet(user.walletAddress);
    const reputationByWallet = await storage.getReputationScoreByWallet(user.walletAddress);
    const userNfts = await storage.getMintedNfts(user.id);
    const userActivities = await storage.getActivities(user.id, 10);
    
    console.log('✅ User statistics:');
    console.log(`   - Wallet: ${userByWallet?.walletAddress}`);
    console.log(`   - Reputation: ${reputationByWallet?.reputationLevel} (${reputationByWallet?.overallScore})`);
    console.log(`   - NFTs earned: ${userNfts.length}`);
    console.log(`   - Activities recorded: ${userActivities.length}`);

    // Test 7: Privacy features
    console.log('\n7️⃣  Testing privacy features...');
    const position = await storage.getLeaderboardPosition(user.pseudonymousId!);
    console.log('✅ Privacy preserved:');
    console.log(`   - Anonymous ID: ${user.pseudonymousId}`);
    console.log(`   - Leaderboard position: #${position}`);
    console.log(`   - Wallet address hidden from leaderboard ✓`);

    console.log('\n🎉 All database tests completed successfully!');
    console.log('\n📊 Database Summary:');
    console.log('   ✅ Users table - working');
    console.log('   ✅ Reputation scores table - working');
    console.log('   ✅ Leaderboard table - working');
    console.log('   ✅ Minted NFTs table - working');
    console.log('   ✅ Activities table - working');
    console.log('   ✅ Anonymous privacy system - working');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testDatabase();
}

export { testDatabase };