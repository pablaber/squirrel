import { browser } from '$app/environment';
import { storageUtils, createCryptoUtils } from '$lib/utils';

export const userKeys = $state<{
	[keyId: string]: CryptoKeyPair & { publicKeyBase64Jwk: string };
}>({});

async function loadMainKeyPair(
	cryptoUtils: ReturnType<typeof createCryptoUtils>
) {
	const keyPair = await storageUtils.loadOrCreateKeyPair();
	const publicKeyBase64Jwk = await cryptoUtils.exportKey(keyPair.publicKey);
	return { ...keyPair, publicKeyBase64Jwk };
}

if (browser) {
	const cryptoUtils = createCryptoUtils(crypto.subtle);
	loadMainKeyPair(cryptoUtils).then((userKeysEntry) => {
		userKeys[storageUtils.DEFAULT_KEY_ID] = userKeysEntry;
	});
}
