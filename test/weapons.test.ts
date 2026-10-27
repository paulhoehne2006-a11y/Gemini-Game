import test from 'node:test';
import assert from 'node:assert/strict';
import { getWeaponLevelTrainCostNAT, getWeaponXpForNextLevel, MAX_WEAPON_LEVEL } from '../src/game/weapons.ts';

test('getWeaponLevelTrainCostNAT', async (t) => {
  await t.test('calculates correct cost for level 1 (boundary)', () => {
    const cost = getWeaponLevelTrainCostNAT(1);
    // formula: 140 + (1 - 1) * 75 + Math.pow(1 - 1, 1.5) * 22
    // = 140 + 0 + 0 = 140
    assert.equal(cost, 140);
  });

  await t.test('calculates correct cost for level 2 (normal)', () => {
    const cost = getWeaponLevelTrainCostNAT(2);
    // formula: 140 + (2 - 1) * 75 + Math.pow(2 - 1, 1.5) * 22
    // = 140 + 75 + 22 = 237
    assert.equal(cost, 237);
  });

  await t.test('calculates correct cost for level 3 (normal)', () => {
    const cost = getWeaponLevelTrainCostNAT(3);
    // formula: 140 + (3 - 1) * 75 + Math.pow(3 - 1, 1.5) * 22
    // = 140 + 2 * 75 + Math.pow(2, 1.5) * 22
    // = 140 + 150 + 2.828427 * 22
    // = 290 + 62.225... = 352.225... (rounded to 352)
    assert.equal(cost, 352);
  });

  await t.test(`calculates correct cost for level ${MAX_WEAPON_LEVEL} (boundary)`, () => {
    const cost = getWeaponLevelTrainCostNAT(MAX_WEAPON_LEVEL);
    // formula: 140 + (30 - 1) * 75 + Math.pow(30 - 1, 1.5) * 22
    // = 140 + 29 * 75 + Math.pow(29, 1.5) * 22
    // = 140 + 2175 + 156.16017 * 22
    // = 2315 + 3435.52... = 5750.52... (rounded to 5751)
    assert.equal(cost, 5751);
  });

  await t.test('clamps levels below 1 to 1', () => {
    assert.equal(getWeaponLevelTrainCostNAT(0), 140);
    assert.equal(getWeaponLevelTrainCostNAT(-5), 140);
  });

  await t.test(`clamps levels above ${MAX_WEAPON_LEVEL} to ${MAX_WEAPON_LEVEL}`, () => {
    const maxCost = getWeaponLevelTrainCostNAT(MAX_WEAPON_LEVEL);
    assert.equal(getWeaponLevelTrainCostNAT(MAX_WEAPON_LEVEL + 1), maxCost);
    assert.equal(getWeaponLevelTrainCostNAT(100), maxCost);
  });
});

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
    assert.equal(maxLevelXp, 4486);
    assert.equal(getWeaponXpForNextLevel(MAX_WEAPON_LEVEL + 1), maxLevelXp);
    assert.equal(getWeaponXpForNextLevel(100), maxLevelXp);
  });
});