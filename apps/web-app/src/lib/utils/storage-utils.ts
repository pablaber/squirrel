import { browser } from '$app/environment';
import { createCryptoUtils } from './crypto-utils';

const cryptoUtils = createCryptoUtils(crypto.subtle);

function verifyBrowser() {
	if (!browser) {
		throw new Error('This function can only be used in the browser');
	}
}

const KEY_PAIR_PREFIX = 'sq-ks-';

/**
 * Generates a storage key ID for the given key ID. Uses "main" as default.
 */
const storageKeyId = (keyId?: string) => {
	const keyIdFinal = keyId || 'main';
	return `${KEY_PAIR_PREFIX}${keyIdFinal}`;
};

/**
 * Loads a key pair from storage or generates a new one if it doesn't exist and
 * saves it to storage.
 */
export async function loadOrCreateKeyPair(
	keyId?: string
): Promise<CryptoKeyPair> {
	const keyPair = await loadKeyPair(keyId);

	if (keyPair) return keyPair;

	const generatedKeyPair = await cryptoUtils.generateEccKeyPair('P-256');

	await saveKeyPair(generatedKeyPair, keyId);

	return generatedKeyPair;
}

/**
 * Loads the key pair for the given key ID from local storage. Will return
 * null if the key pair is not found. Will return the base 64 formatted JSON
 * Web Key (JWK) for the private and public keys.
 */
export async function loadKeyPair(
	keyId?: string
): Promise<CryptoKeyPair | null> {
	verifyBrowser();
	const keyPairRaw = localStorage.getItem(storageKeyId(keyId));

	if (!keyPairRaw) return null;

	const [privateKeyB64Jwk, publicKeyB64Jwk] = keyPairRaw.split(':');

	const privateKey = await cryptoUtils.importKey(privateKeyB64Jwk);
	const publicKey = await cryptoUtils.importKey(publicKeyB64Jwk);

	return {
		privateKey,
		publicKey
	};
}

/**
 * Saves the crypto key pair to local storage.
 */
export async function saveKeyPair(keyPair: CryptoKeyPair, keyId?: string) {
	verifyBrowser();

	const privateKeyB64Jwk = await cryptoUtils.exportKey(keyPair.privateKey);
	const publicKeyB64Jwk = await cryptoUtils.exportKey(keyPair.publicKey);

	localStorage.setItem(
		storageKeyId(keyId),
		`${privateKeyB64Jwk}:${publicKeyB64Jwk}`
	);
}
