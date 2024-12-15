export type ECCCurve = 'P-256' | 'P-384' | 'P-521';

/**
 * Utility function to convert a JSON object to a base64 encoded string
 */
function jsonToBase64(json: object) {
	return btoa(JSON.stringify(json));
}

/**
 * Utility function to convert a base64 encoded string to a JSON object
 */
function base64ToJson(base64: string) {
	return JSON.parse(atob(base64));
}

/**
 * Converts an ArrayBuffer to a base64 encoded string
 */
function arrayBufferToBase64(arrayBuffer: ArrayBuffer) {
	return btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
}

/**
 * Converts a base64 encoded string to an ArrayBuffer
 */
function base64ToArrayBuffer(base64: string) {
	return new Uint8Array(
		atob(base64)
			.split('')
			.map((char) => char.charCodeAt(0))
	);
}

/**
 * Generates a random IV for AES-GCM encryption
 */
function generateIv(length: number = 16) {
	return crypto.getRandomValues(new Uint8Array(length));
}

export function createCryptoUtils(subtle: SubtleCrypto) {
	/**
	 * Derives a key from the supplied public and private keys
	 */
	async function getDerivedKey(publicKey: CryptoKey, privateKey: CryptoKey) {
		return subtle.deriveKey(
			{
				name: 'ECDH',
				public: publicKey
			},
			privateKey,
			{ name: 'AES-GCM', length: 256 },
			false,
			['encrypt', 'decrypt']
		);
	}

	/**
	 * Generates an ECC key pair with the supplied named curve
	 */
	async function generateEccKeyPair(namedCurve: ECCCurve) {
		return subtle.generateKey(
			{
				name: 'ECDH',
				namedCurve
			},
			true,
			['deriveKey']
		);
	}

	async function encryptMessage(message: string, publicKey: CryptoKey, privateKey: CryptoKey) {
		const derivedKey = await getDerivedKey(publicKey, privateKey);
		const iv = generateIv();
		const encrypted = await subtle.encrypt(
			{ name: 'AES-GCM', iv },
			derivedKey,
			new TextEncoder().encode(message)
		);

		const ivBase64 = arrayBufferToBase64(iv);
		const encryptedBase64 = arrayBufferToBase64(encrypted);

		return `${ivBase64}.${encryptedBase64}`;
	}

	/**
	 * Decrypts a message using the supplied private and public keys
	 */
	async function decryptMessage(message: string, privateKey: CryptoKey, publicKey: CryptoKey) {
		const [ivBase64, encryptedBase64] = message.split('.');
		let iv: BufferSource;
		let encrypted: BufferSource;
		try {
			iv = base64ToArrayBuffer(ivBase64);
			encrypted = base64ToArrayBuffer(encryptedBase64);
		} catch {
			return null;
		}

		const derivedKey = await getDerivedKey(publicKey, privateKey);
		const decrypted = await subtle.decrypt({ name: 'AES-GCM', iv }, derivedKey, encrypted);
		return new TextDecoder().decode(decrypted);
	}

	/**
	 * Exports a key as a JWK.
	 */
	async function exportKey(key: CryptoKey) {
		const jwk = await subtle.exportKey('jwk', key);
		return jsonToBase64(jwk);
	}

	/**
	 * Imports a base64 encoded JWK into a CryptoKey.
	 */
	async function importKey(base64: string) {
		const jwk = base64ToJson(base64);
		try {
			const key = await subtle.importKey(
				'jwk',
				jwk,
				{
					name: 'ECDH',
					namedCurve: 'P-256'
				},
				true,
				jwk.key_ops || []
			);
			return key;
		} catch (error) {
			console.error('Failed to import key', error);
			throw error;
		}
	}

	/**
	 * Creates a SHA-256 hash of the given string data
	 */
	function createHash(data: string) {
		return subtle.digest('SHA-256', new TextEncoder().encode(data));
	}

	/**
	 * Calculates a fingerprint for a given CryptoKey.
	 */
	async function calculateFingerprint(key: CryptoKey) {
		// Export the key as a JWK
		const jwk = await subtle.exportKey('jwk', key);

		// Extract relevant properties from the JWK
		const keyProperties = {
			kty: jwk.kty,
			crv: jwk.crv,
			x: jwk.x,
			y: jwk.y
		};

		// Stringify the sorted JWK
		const base64JwkString = jsonToBase64(keyProperties);

		// Create a hash of the sorted JWK
		const hashBuffer = await createHash(base64JwkString);

		// Convert the hash to an array of bytes
		const hashArray = Array.from(new Uint8Array(hashBuffer));

		// Convert hash array to base64 string
		return btoa(String.fromCharCode(...hashArray));
	}

	return {
		generateEccKeyPair,
		encryptMessage,
		decryptMessage,
		importKey,
		exportKey,
		createHash,
		calculateFingerprint
	};
}
