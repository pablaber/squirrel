export const niceFingerprint = (fingerprintBase64: string) => {
	return fingerprintBase64.replace(/=+/g, '').slice(0, 10).toLowerCase();
};
