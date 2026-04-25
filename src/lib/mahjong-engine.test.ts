import { describe, it, expect } from 'vitest';
import { parseTiles, MahjongEngine } from './mahjong-engine';
import { Shoupai } from '@kobalab/majiang-core';

describe('MahjongEngine', () => {
  it('parses Shoupai string correctly', () => {
    // Normal case
    expect(parseTiles('m123p456s789z11122')).toEqual([
      'm1', 'm2', 'm3', 'p4', 'p5', 'p6', 's7', 's8', 's9', 'z1', 'z1', 'z1', 'z2', 'z2'
    ]);
    
    // With aka-dora (0 represents red 5)
    expect(parseTiles('m05s1')).toEqual([
      'm0', 'm5', 's1'
    ]);
  });

  it('initializes game and creates hands', () => {
    let stateUpdates = 0;
    const engine = new MahjongEngine(() => {
      stateUpdates++;
    });
    
    engine.start();
    const state = engine.getGameState();
    
    expect(state.kyoku).toBe('東1局');
    // Human hand should have 13 tiles initially (before zimo) or 14 (if qijia)
    expect(state.tehai.length + (state.tsumo ? 1 : 0)).toBeGreaterThanOrEqual(13);
    // There are 4 players
    expect(state.kawa.player).toEqual([]);
    expect(state.kawa.kamicha).toEqual([]);
    expect(state.kawa.toimen).toEqual([]);
    expect(state.kawa.shimocha).toEqual([]);
  });

  it('calculates shanten and discard candidates correctly', () => {
    // 1-shanten hand
    const hand = Shoupai.fromString('m11123p456s789z11z1');
    const { calculateCandidates } = require('./mahjong-engine');
    const candidates = calculateCandidates(hand);
    
    expect(candidates).toBeDefined();
    expect(candidates.length).toBeGreaterThan(0);
    
    // Sort logic should put lowest shanten at index 0
    const best = candidates[0];
    expect(best.shanten).toBe(0); // If we discard something it might be tenpai (shanten 0)
    expect(best.ukeire).toBeInstanceOf(Array);
  });
});
