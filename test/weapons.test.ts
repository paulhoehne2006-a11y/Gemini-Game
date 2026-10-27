import test from 'node:test';
import assert from 'node:assert/strict';
import { getWeaponXpForNextLevel, MAX_WEAPON_LEVEL } from '../src/game/weapons.ts';

test('getWeaponXpForNextLevel', async (t) => {
  await t.test('returns correct XP for base level 1', () => {
    assert.equal(getWeaponXpForNextLevel(1), 180);
  });

  await t.test('clamps level below 1', () => {
    assert.equal(getWeaponXpForNextLevel(0), 180);
    assert.equal(getWeaponXpForNextLevel(-5), 180);
  });

  await t.test('returns correct XP for intermediate levels', () => {
    assert.equal(getWeaponXpForNextLevel(2), 288);
    assert.equal(getWeaponXpForNextLevel(15), 2075);
  });

  await t.test('clamps level above MAX_WEAPON_LEVEL', () => {
    const maxLevelXp = getWeaponXpForNextLevel(MAX_WEAPON_LEVEL);
    assert.equal(maxLevelXp, 4486); // From console output
    assert.equal(getWeaponXpForNextLevel(MAX_WEAPON_LEVEL + 1), maxLevelXp);
    assert.equal(getWeaponXpForNextLevel(100), maxLevelXp);
  });
});
