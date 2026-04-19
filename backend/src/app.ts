import Fastify from 'fastify';

import { env } from './config/env.js';
import {
    AppDataSource,
    destroyDatabase,
    initializeDatabase
} from './database/data-source.js';
import { registerGraphQL } from './plugins/graphql.js';

export const buildApp = async () => {
    await initializeDatabase();

    const app = Fastify({
        logger: env.NODE_ENV === 'development'
    });

    app.get('/healthz', async () => {
        return {
            status: 'ok',
            service: 'event-manager-backend',
            database: AppDataSource.isInitialized ? 'up' : 'down',
            timestamp: new Date().toISOString()
        };
    });

    await registerGraphQL(app);

    app.addHook('onClose', async () => {
        await destroyDatabase();
    });

    return app;
};