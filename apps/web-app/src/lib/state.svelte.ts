import { browser } from '$app/environment';
import { storageUtils, createCryptoUtils } from '$lib/utils';

export const userKeys = $state<{
	[keyId: string]:
		| (CryptoKeyPair & {
				publicKeyBase64Jwk: string;
				publicKeyFingerprint: string;
		  })
		| undefined;
}>({});

async function loadMainKeyPair(
	cryptoUtils: ReturnType<typeof createCryptoUtils>
) {
	const keyPair = await storageUtils.loadOrCreateKeyPair();
	const publicKeyFingerprint = await cryptoUtils.calculatePublicKeyFingerprint(
		keyPair.publicKey
	);
	const publicKeyBase64Jwk = await cryptoUtils.exportKey(keyPair.publicKey);
	return { ...keyPair, publicKeyBase64Jwk, publicKeyFingerprint };
}

if (browser) {
	const cryptoUtils = createCryptoUtils(crypto.subtle);
	loadMainKeyPair(cryptoUtils).then((userKeysEntry) => {
		userKeys[storageUtils.DEFAULT_KEY_ID] = userKeysEntry;
	});
}
