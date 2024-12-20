import { cookieUtils } from '$lib/server/utils';
import { fail, redirect } from '@sveltejs/kit';
import { getServerConfig } from '$lib/server/server-config';
import { createHash } from 'node:crypto';
import { setTimeout } from 'node:timers';
import { minutesToMilliseconds } from 'date-fns';

const MAX_ATTEMPTS = 3;
const TIME_WINDOW_MS = minutesToMilliseconds(5);

type RateLimitEntry = {
	timeout: NodeJS.Timeout;
	count: number;
};
const rateLimitMap = new Map<string, RateLimitEntry>();

export const actions = {
	/**
	 * Handles the password login form submission.
	 */
	default: async ({ request, cookies, getClientAddress }) => {
		const formData = await request.formData();
		const password = formData.get('password')?.toString() || '';
		const hashedPassword = createHash('sha256').update(password).digest('hex');

		// Get the rate limit entry for the given IP address
		const requestIp = getClientAddress();
		const rateLimitEntry = rateLimitMap.get(requestIp);
		// Clear the timeout if it exists, we will set a new one below
		if (rateLimitEntry) {
			clearTimeout(rateLimitEntry.timeout);
			if (rateLimitEntry.count >= MAX_ATTEMPTS) {
				rateLimitEntry.timeout = setTimeout(() => {
					rateLimitMap.delete(requestIp);
				}, TIME_WINDOW_MS);
				rateLimitMap.set(requestIp, rateLimitEntry);
				return fail(429, {
					errorMessage: 'too many attempts'
				});
			}
		}

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

		// At this point we've failed, so we can update the rate limit entry
		const timeout = setTimeout(() => {
			rateLimitMap.delete(requestIp);
		}, TIME_WINDOW_MS);
		rateLimitMap.set(requestIp, {
			timeout,
			count: (rateLimitEntry?.count || 0) + 1
		});
		console.log(
			`Rate limit entry set for ${requestIp}: ${rateLimitMap.get(requestIp)?.count}`
		);

		return fail(401, {
			errorMessage: 'invalid password'
		});
	}
};
