import { getServerConfig } from '$lib/server/server-config';
import { cookieUtils } from '$lib/server/utils/index.js';
import { redirect } from '@sveltejs/kit';

const NO_AUTH_ROUTES: (string | null)[] = ['/password'];

export const load = async ({ route, cookies, request }) => {
	const { pathname, search } = new URL(request.url);
	const serverConfig = getServerConfig();
	const masterPasswordSet = serverConfig.hashedMasterPassword !== '';
	const passwordRequired = !NO_AUTH_ROUTES.includes(route.id) && masterPasswordSet;

	const redirectTo = Buffer.from(`${pathname}${search}`).toString('base64url');

	if (passwordRequired) {
		const cookieMonster = cookieUtils.init(cookies);
		const passwordCorrect = cookieMonster.testMasterPasswordCookie();
		if (!passwordCorrect) {
			return redirect(302, `/password?redirectTo=${redirectTo}`);
		}
	}
};
