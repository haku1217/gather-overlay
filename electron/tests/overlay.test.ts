import { describe, it, expect } from 'vitest';
import { generateColor, createLaneManager } from '../src/renderer/overlay.js';

describe('generateColor', () => {
  it('同じキーに対して同じ色を返す', () => {
    const color1 = generateColor('general:John');
    const color2 = generateColor('general:John');
    expect(color1).toBe(color2);
  });

  it('異なるキーに対して異なる色を返す', () => {
    const color1 = generateColor('general:John');
    const color2 = generateColor('random:Alice');
    expect(color1).not.toBe(color2);
  });

  it('hsl形式の文字列を返す', () => {
    const color = generateColor('test:user');
    expect(color).toMatch(/^hsl\(\d+, 80%, 70%\)$/);
  });

  it('空文字列でもクラッシュしない', () => {
    const color = generateColor('');
    expect(color).toMatch(/^hsl\(\d+, 80%, 70%\)$/);
  });
});

describe('createLaneManager', () => {
  it('空いているレーンを順番に割り当てる', () => {
    const manager = createLaneManager(200, 50); // 4レーン
    expect(manager.acquireLane()).toBe(0);
    expect(manager.acquireLane()).toBe(1);
    expect(manager.acquireLane()).toBe(2);
    expect(manager.acquireLane()).toBe(3);
  });

  it('解放されたレーンを再利用する', () => {
    const manager = createLaneManager(100, 50); // 2レーン
    const lane0 = manager.acquireLane(); // 0
    manager.acquireLane(); // 1
    manager.releaseLane(lane0);
    expect(manager.acquireLane()).toBe(0); // 解放された0を再取得
  });

  it('全レーン使用中でもクラッシュしない', () => {
    const manager = createLaneManager(100, 50); // 2レーン
    manager.acquireLane(); // 0
    manager.acquireLane(); // 1
    const lane = manager.acquireLane(); // 全使用中 → ランダム
    expect(lane).toBeGreaterThanOrEqual(0);
    expect(lane).toBeLessThan(2);
  });

  it('containerHeightが0でも最低1レーン確保する', () => {
    const manager = createLaneManager(0, 50);
    const lane = manager.acquireLane();
    expect(lane).toBe(0);
  });
});
