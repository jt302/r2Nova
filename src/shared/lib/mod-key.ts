export function isApplePlatform(
	platform = typeof navigator === 'undefined' ? '' : navigator.platform,
	userAgent = typeof navigator === 'undefined' ? '' : navigator.userAgent,
): boolean {
	return /mac/i.test(platform) || /mac/i.test(userAgent);
}

export function modKeyLabel(
	platform = typeof navigator === 'undefined' ? '' : navigator.platform,
	userAgent = typeof navigator === 'undefined' ? '' : navigator.userAgent,
): string {
	return isApplePlatform(platform, userAgent) ? '⌘' : 'Ctrl';
}
