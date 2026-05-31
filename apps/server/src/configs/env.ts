import dotenv from 'dotenv';
import { z } from 'zod';
import chalk from 'chalk';

dotenv.config({ path: new URL('../../../../.env', import.meta.url).pathname });

const envSchema = z.object({
    SERVER_PORT: z
        .string()
        .default('8080')
        .transform((val) => parseInt(val, 10)),
    SERVER_NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    SERVER_JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters'),
    SERVER_JWT_REFRESH_SECRET: z
        .string()
        .min(32, 'JWT refresh secret must be at least 32 characters'),
    SERVER_REDIS_URL: z.url('Invalid Redis URL'),
    SERVER_WEB_URL: z.string().min(1, 'Web URL is required'),
    DATABASE_URL: z.string().min(1, 'Database URL is required'),
});

function parseEnv() {
    try {
        return envSchema.parse(process.env);
    } catch (err) {
        if (err instanceof z.ZodError) {
            console.error(`\n${chalk.bold('Environment validation failed:')}`);

            err.issues.forEach((issue) => {
                const envVar = issue.path.join('.');

                if (issue.code === 'invalid_type') {
                    const received = 'received' in issue ? issue.received : 'unknown';
                    if (received === 'undefined') {
                        console.error(`   ${envVar}: ${chalk.red('not provided')}`);
                    } else {
                        console.error(
                            `   ${envVar}: ${chalk.red(`expected ${issue.expected}, received ${received}`)}`,
                        );
                    }
                } else if (issue.code === 'too_small') {
                    console.error(`   ${envVar}: ${chalk.red(issue.message)}`);
                } else {
                    console.error(`   ${envVar}: ${chalk.red(issue.message)}`);
                }
            });

            console.error('\n');
        } else {
            console.error('Environment validation failed:', err);
        }
        process.exit(1);
    }
}

export const env = parseEnv();
export const isDevelopment = () => env.SERVER_NODE_ENV === 'development';
export const isProduction = () => env.SERVER_NODE_ENV === 'production';