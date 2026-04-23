import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { buildFolderKey } from './objectKeys.ts'

describe('buildFolderKey', () => {
  it('creates folders under the current prefix', () => {
    assert.equal(buildFolderKey('photos/2026/', 'raw'), 'photos/2026/raw/')
  })

  it('creates root folders without adding a leading slash', () => {
    assert.equal(buildFolderKey('', 'raw'), 'raw/')
  })
})
