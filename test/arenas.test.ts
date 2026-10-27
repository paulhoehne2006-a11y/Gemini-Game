import test from 'node:test';
import assert from 'node:assert/strict';
import { checkArenaUnlocked } from '../src/game/three/arenas.ts';

test('checkArenaUnlocked', async (t) => {
  await t.test('always unlocks hessenpark', () => {
    assert.equal(checkArenaUnlocked('hessenpark', 0, []), true);
    assert.equal(checkArenaUnlocked('hessenpark', 10, ['othermap']), true);
  });

  await t.test('unlocks maps in the unlockedMapsList', () => {
    assert.equal(checkArenaUnlocked('berlin', 0, ['berlin', 'munich']), true);
  });

  await t.test('does not unlock maps missing from unlockedMapsList', () => {
    assert.equal(checkArenaUnlocked('munich', 0, ['berlin']), false);
  });
});
