import { buildApp } from './app.js';
import { env } from './config/env.js';

const start = async (): Promise<void> => {
    const app = await buildApp();

    const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
        app.log.info({ signal }, 'Shutting down application');

        try {
            await app.close();
            process.exit(0);
        } catch (error) {
            app.log.error({ error }, 'Failed to shut down cleanly');
            process.exit(1);
        }
    };

    process.on('SIGINT', () => {
        void shutdown('SIGINT');
    });

    process.on('SIGTERM', () => {
        void shutdown('SIGTERM');
    });

    try {
        await app.listen({
            host: env.HOST,
            port: env.PORT
        });

        app.log.info(`Backend running at http://${env.HOST}:${env.PORT}`);
    } catch (error) {
        app.log.error({ error }, 'Failed to start server');
        process.exit(1);
    }
};

void start();