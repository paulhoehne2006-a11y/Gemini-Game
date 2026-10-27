import test from 'node:test';
import assert from 'node:assert/strict';
import { getReputationRank, REPUTATION_RANKS } from '../src/game/missions.ts';

test('getReputationRank: returns the correct rank based on points', () => {
  // Test lower bounds and Rank 1
  assert.equal(getReputationRank(0).rank, 1, '0 points should be Rank 1');
  assert.equal(getReputationRank(299).rank, 1, '299 points should be Rank 1');

  // Test Rank 2 boundary
  assert.equal(getReputationRank(300).rank, 2, '300 points should be Rank 2');

  // Test Rank 5 boundaries
  assert.equal(getReputationRank(2300).rank, 5, '2300 points should be Rank 5');
  assert.equal(getReputationRank(3499).rank, 5, '3499 points should be Rank 5');

  // Test Rank 6 (max rank) boundary
  assert.equal(getReputationRank(3500).rank, 6, '3500 points should be Rank 6');
  assert.equal(getReputationRank(5000).rank, 6, '5000 points should be Rank 6');

  // Test edge case: negative points
  assert.equal(getReputationRank(-10).rank, 1, 'Negative points should default to Rank 1');

  // Test against the original rank objects to ensure they are returned completely
  assert.deepEqual(getReputationRank(0), REPUTATION_RANKS[0]);
  assert.deepEqual(getReputationRank(300), REPUTATION_RANKS[1]);
  assert.deepEqual(getReputationRank(2300), REPUTATION_RANKS[4]);
  assert.deepEqual(getReputationRank(3500), REPUTATION_RANKS[5]);
});
