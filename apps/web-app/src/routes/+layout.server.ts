import { serverConfig } from '$lib/server/server-config';
import { cookieUtils } from '$lib/server/utils/index.js';
import { redirect } from '@sveltejs/kit';

const NO_AUTH_ROUTES: (string | null)[] = ['/password'];

export const load = async ({ route, cookies }) => {
	const masterPasswordSet = serverConfig.masterPassword !== '';
	const passwordRequired = !NO_AUTH_ROUTES.includes(route.id) && masterPasswordSet;

	if (passwordRequired) {
		const cookieMonster = cookieUtils.init(cookies);
		const passwordCorrect = cookieMonster.testMasterPasswordCookie(serverConfig.masterPassword);
		if (!passwordCorrect) {
			return redirect(302, '/password');
		}
	}
};
