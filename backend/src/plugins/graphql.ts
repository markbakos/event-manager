import type { FastifyInstance } from 'fastify';
import mercurius from 'mercurius';

import { env } from '../config/env.js';
import { resolvers, schema } from '../graphql/schema.js';

export const registerGraphQL = async (
    app: FastifyInstance
): Promise<void> => {
    await app.register(mercurius, {
        schema,
        resolvers,
        path: '/graphql',
        graphiql: env.NODE_ENV !== 'production'
    });
};