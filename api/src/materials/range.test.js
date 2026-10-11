import test from 'node:test'
import assert from 'node:assert/strict'
import { matchesIfNoneMatch, parseByteRange } from './range.js'

test('parses closed, open-ended, and suffix byte ranges', () => {
  assert.deepEqual(parseByteRange('bytes=2-5', 10), { start: 2, end: 5, count: 4 })
  assert.deepEqual(parseByteRange('bytes=7-', 10), { start: 7, end: 9, count: 3 })
  assert.deepEqual(parseByteRange('bytes=-4', 10), { start: 6, end: 9, count: 4 })
  assert.deepEqual(parseByteRange('bytes=-20', 10), { start: 0, end: 9, count: 10 })
  assert.equal(parseByteRange(null, 10), null)
})

test('rejects malformed and unsatisfiable ranges', () => {
  for (const value of ['bytes=10-', 'bytes=5-3', 'bytes=-0', 'bytes=0-1,4-5', 'items=0-2']) {
    assert.deepEqual(parseByteRange(value, 10), { unsatisfiable: true })
  }
  assert.deepEqual(parseByteRange('bytes=0-', 0), { unsatisfiable: true })
})

test('matches wildcard and weak If-None-Match values', () => {
  assert.equal(matchesIfNoneMatch('*', '"blob-v1"'), true)
  assert.equal(matchesIfNoneMatch('W/"blob-v1"', '"blob-v1"'), true)
  assert.equal(matchesIfNoneMatch('"other", "blob-v1"', '"blob-v1"'), true)
  assert.equal(matchesIfNoneMatch('"other"', '"blob-v1"'), false)
})
