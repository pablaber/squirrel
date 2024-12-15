import { z } from 'zod';
import * as staticPrivateEnv from '$env/static/private';
import { createHash } from 'node:crypto';

const errorMap: z.ZodErrorMap = (issue, ctx) => {
	if (issue.code === z.ZodIssueCode.invalid_type) {
		return { message: `Missing required environment variable: ${issue.path[0]}` };
	}
	return { message: ctx.defaultError };
};

z.setErrorMap(errorMap);

export const serverConfigSchema = z.object({
	DATABASE_URL: z.string(),
	MASTER_PASSWORD: z.string().default('')
});

const { data: serverEnv, error } = serverConfigSchema.safeParse(staticPrivateEnv);

if (error) {
	throw new Error(error.errors[0].message);
}

const hashedMasterPassword = createHash('sha256').update(serverEnv.MASTER_PASSWORD).digest('hex');

export const serverConfig = {
	databaseUrl: serverEnv.DATABASE_URL,
	hashedMasterPassword
} as const;
