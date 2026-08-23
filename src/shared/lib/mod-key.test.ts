import { describe, expect, it } from 'vitest';
import { modKeyLabel } from '@/shared/lib/mod-key';

describe('modKeyLabel', () => {
	it('uses Ctrl off Apple', () => {
		expect(modKeyLabel('Linux x86_64', 'X11; Linux x86_64')).toBe('Ctrl');
		expect(modKeyLabel('Win32', 'Windows NT 10.0')).toBe('Ctrl');
	});

	it('uses the command glyph on Apple', () => {
		expect(modKeyLabel('MacIntel', 'Macintosh')).toBe('⌘');
	});
});
