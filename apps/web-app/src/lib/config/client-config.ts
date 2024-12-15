import * as staticPublicEnv from '$env/static/public';
import { z } from 'zod';

export const clientConfigSchema = z.object({
	PUBLIC_MESSAGE_SERVICE_URL_BASE: z.string()
});

const clientEnv = clientConfigSchema.parse(staticPublicEnv);

export const clientConfig = {
	messageServiceUrlBase: clientEnv.PUBLIC_MESSAGE_SERVICE_URL_BASE,
} as const;
