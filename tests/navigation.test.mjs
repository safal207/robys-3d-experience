import test from 'node:test';
import assert from 'node:assert/strict';
import { VIEWS, clamp, collisionAt, constrainedMove } from '../src/navigation.js';

test('all four camera destinations exist and have finite coordinates', () => {
  assert.equal(Object.keys(VIEWS).length, 4);
  for (const view of Object.values(VIEWS)) {
    assert.equal(view.position.length, 3);
    assert.equal(view.target.length, 3);
    assert.ok([...view.position, ...view.target].every(Number.isFinite));
  }
});
test('clamp respects both bounds', () => {
  assert.equal(clamp(3, 0, 2), 2);
  assert.equal(clamp(-1, 0, 2), 0);
  assert.equal(clamp(1, 0, 2), 1);
});
test('collision detects floor-matched rectangular furniture', () => {
  const blockers = [{ x: 0, z: 0, w: 2, d: 2, floor: 0 }];
  assert.equal(collisionAt(1, 1, blockers), true);
  assert.equal(collisionAt(2, 2, blockers), false);
  assert.equal(collisionAt(0, 0, blockers, 0.3, 1), false);
});
test('movement stays within floor boundaries', () => {
  const result = constrainedMove({ x: 6.2, z: 19 }, 10, 10, [], 0);
  assert.equal(result.x, 6.35);
  assert.equal(result.z, 19.5);
});
test('movement cannot pass through an obstruction', () => {
  const result = constrainedMove({ x: -2, z: 0 }, 2, 0, [{ x: 0, z: 0, w: 1, d: 1, floor: 0 }]);
  assert.equal(result.x, -2);
});