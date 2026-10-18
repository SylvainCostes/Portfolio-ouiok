import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  constructionPose,
  CYCLE_DURATION
} from '../maintenance/scripts/construction-cycle.ts'

test('the module and hoist return continuously to their starting position', () => {
  const initial = constructionPose(0)
  assert.deepEqual(constructionPose(CYCLE_DURATION), initial)
  assert.deepEqual(constructionPose(CYCLE_DURATION - 1e-6), initial)
  for (let t = 0; t < CYCLE_DURATION; t += 0.01) {
    const a = constructionPose(t),
      b = constructionPose(t + 0.01)
    assert.ok(
      Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z) < 0.03,
      `discontinuity at ${t}`
    )
    assert.ok(a.y >= 0.9 && a.y <= 7.96)
    assert.ok(a.activation >= 0 && a.activation <= 1)
    assert.ok(9.38 - (a.y + 0.71) > 0, 'hoist cable must never invert')
  }
})

test('horizontal transport only happens after the payload clears the tower', () => {
  for (let t = 0; t < CYCLE_DURATION; t += 0.01) {
    const a = constructionPose(t),
      b = constructionPose(t + 0.01)
    if (Math.abs(a.x - b.x) > 1e-6 || Math.abs(a.z - b.z) > 1e-6)
      assert.ok(a.y > 7.94)
    if (a.activation > 0.001) {
      assert.ok(Math.abs(a.x - 0.35) < 1e-8)
      assert.ok(Math.abs(a.y - 6.38) < 1e-8)
      assert.ok(Math.abs(a.z - 0.35) < 1e-8)
    }
  }
})

test('assembly pauses before activation, then recovers the same visible payload', () => {
  assert.equal(constructionPose(1).phase, 'prepare')
  assert.equal(constructionPose(5).phase, 'hoist')
  assert.equal(constructionPose(10).phase, 'transport')
  assert.equal(constructionPose(15).phase, 'assemble')
  assert.equal(constructionPose(20).phase, 'activate')
  assert.equal(constructionPose(30).phase, 'recover')
  assert.equal(constructionPose(20).activation, 1)
})
