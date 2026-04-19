import Fastify from 'fastify';

import { env } from './config/env.js';
import {
    AppDataSource,
    destroyDatabase,
    initializeDatabase
} from './database/data-source.js';
import { registerGraphQL } from './plugins/graphql.js';
import {NotificationQueue} from "./modules/notifications/notification.queue.js";
import {EmailService} from "./modules/notifications/email.service.js";

export const buildApp = async () => {
    await initializeDatabase();

    const app = Fastify({
        logger: env.NODE_ENV === 'development'
    });

    const notificationQueue = new NotificationQueue(env.DATABASE_URL)
    await notificationQueue.start()
    await notificationQueue.ensureQueues()

    const emailService = new EmailService({
        host: env.MAIL_HOST,
        port: env.MAIL_PORT,
        from: env.MAIL_FROM
    })

    await notificationQueue.registerWorkers({
        onEventPublishedEmail: async (payload) => {
            await emailService.sendEventPublishedEmail(payload)
        }
    })

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