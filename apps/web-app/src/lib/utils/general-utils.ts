export const niceFingerprint = (fingerprintBase64: string) => {
	const fingerprint = fingerprintBase64.replace(/=+/g, '').slice(0, 10).toLowerCase();
	return fingerprint;
};
