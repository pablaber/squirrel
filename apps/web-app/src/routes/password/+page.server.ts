import { cookieUtils } from '$lib/server/utils';
import { fail, redirect } from '@sveltejs/kit';
import { getServerConfig } from '$lib/server/server-config';
import { createHash } from 'node:crypto';

export const actions = {
	default: async ({ request, cookies }) => {
		const formData = await request.formData();
		const password = formData.get('password')?.toString() || '';
		const hashedPassword = createHash('sha256').update(password).digest('hex');

		let redirectPath = '/';
		const redirectTo = formData.get('redirectTo')?.toString();
		if (redirectTo) {
			try {
				redirectPath = Buffer.from(redirectTo, 'base64url').toString('utf-8');
			} catch {
				/* nop */
			}
		}

		const serverConfig = getServerConfig();

		if (hashedPassword === serverConfig.hashedMasterPassword) {
			const cookieMonster = cookieUtils.init(cookies);
			cookieMonster.setMasterPasswordCookie(password);
			return redirect(302, redirectPath);
		}

		return fail(401, {
			errorMessage: 'invalid password'
		});
	}
};
