import { env } from '../config/env.js';
import { AppDataSource } from '../database/data-source.js';
import { EVENT_LOCATIONS } from '../shared/locations.js';

export const schema = /* GraphQL */ `
  type HealthCheck {
    status: String!
    database: String!
    environment: String!
    timestamp: String!
  }

  type Location {
    id: ID!
    name: String!
  }

  type Query {
    health: HealthCheck!
    locations: [Location!]!
  }
`;

export const resolvers = {
    Query: {
        health: async () => ({
            status: 'ok',
            database: AppDataSource.isInitialized ? 'up' : 'down',
            environment: env.NODE_ENV,
            timestamp: new Date().toISOString()
        }),
        locations: async () => EVENT_LOCATIONS
    }
};