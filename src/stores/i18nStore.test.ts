import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { translations } from './i18nStore.ts'

describe('translations', () => {
  it('keeps zh-CN and en key sets in sync', () => {
    const zhKeys = Object.keys(translations['zh-CN']).sort()
    const enKeys = Object.keys(translations.en).sort()

    assert.deepEqual(zhKeys, enKeys)
  })

  it('does not keep empty translation values', () => {
    for (const [language, dict] of Object.entries(translations)) {
      const emptyKeys = Object.entries(dict)
        .filter(([, value]) => value.trim().length === 0)
        .map(([key]) => key)

      assert.deepEqual(emptyKeys, [], `${language} has empty translations`)
    }
  })
})
