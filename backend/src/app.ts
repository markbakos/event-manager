import Fastify from 'fastify';

import { env } from './config/env.js';
import {
    AppDataSource,
    destroyDatabase,
    initializeDatabase
} from './database/data-source.js';
import { registerGraphQL } from './plugins/graphql.js';
import {NotificationQueue} from "./modules/notifications/notification.queue.js";

export const buildApp = async () => {
    await initializeDatabase();

    const app = Fastify({
        logger: env.NODE_ENV === 'development'
    });

    const notificationQueue = new NotificationQueue(env.DATABASE_URL)
    await notificationQueue.start()
    await notificationQueue.ensureQueues()

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
        await notificationQueue.stop()
        await destroyDatabase();
    });

    return app;
};