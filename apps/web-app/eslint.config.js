import { config } from '@squirrel/eslint-config/base';
import { includeIgnoreFile } from '@eslint/compat';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import { fileURLToPath } from 'node:url';
import ts from 'typescript-eslint';
const gitignorePath = fileURLToPath(new URL('./.gitignore', import.meta.url));

export default ts.config(
	...config,
	includeIgnoreFile(gitignorePath),
	...svelte.configs['flat/recommended'],
	...svelte.configs['flat/prettier'],
	{
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node
			}
		}
	},
	{
		files: ['**/*.svelte'],

		languageOptions: {
			globals: {
				CryptoKeyPair: 'readonly'
			},
			parserOptions: {
				parser: ts.parser
			}
		}
	}
);
