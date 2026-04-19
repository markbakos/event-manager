import type { FastifyInstance } from 'fastify'
import mercurius from 'mercurius'

import { DomainError } from '../common/domain-error.js'
import { env } from '../config/env.js'
import { AppDataSource } from '../database/data-source.js'
import { eventsSchema } from '../modules/events/events.graphql.js'
import {LOCATION_BY_ID, EVENT_LOCATIONS, type LocationId} from '../shared/locations.js'
import type { EventsService } from '../modules/events/events.service.js'

type GraphQLDependencies = {
    eventsService: EventsService
}

export const registerGraphQL = async (
    app: FastifyInstance,
    dependencies: GraphQLDependencies
): Promise<void> => {
    await app.register(mercurius, {
        schema: eventsSchema,
        resolvers: {
            Query: {
                health: async () => ({
                    status: 'ok',
                    database: AppDataSource.isInitialized ? 'up' : 'down',
                    environment: env.NODE_ENV,
                    timestamp: new Date().toISOString()
                }),
                locations: async () => EVENT_LOCATIONS,
                events: async () => dependencies.eventsService.listEvents(),
                event: async (_source, args: { id: string }) => dependencies.eventsService.getEventById(args.id)
            },
            Mutation: {
                createEvent: async (_source, args: { input: Parameters<EventsService['createEvent']>[0] }) =>
                    dependencies.eventsService.createEvent(args.input),
                updateEvent: async (
                    _source,
                    args: { id: string; input: Parameters<EventsService['updateEvent']>[1] }
                ) => dependencies.eventsService.updateEvent(args.id, args.input),
                publishEvent: async (_source, args: { id: string }) =>
                    dependencies.eventsService.publishEvent(args.id),
                deleteEvent: async (_source, args: { id: string }) =>
                    dependencies.eventsService.deleteEvent(args.id)
            },
            Event: {
                location: async (event: { locationId: LocationId }) => {
                    const location = LOCATION_BY_ID.get(event.locationId)

                    if (!location) {
                        throw new DomainError(`Unknown location: ${event.locationId}`)
                    }

                    return location
                },
                startAt: async (event: { startAt: Date }) => event.startAt.toISOString(),
                endAt: async (event: { endAt: Date }) => event.endAt.toISOString(),
                createdAt: async (event: { createdAt: Date }) => event.createdAt.toISOString(),
                updatedAt: async (event: { updatedAt: Date }) => event.updatedAt.toISOString()
            },
            Participant: {
                createdAt: async (participant: { createdAt: Date }) => participant.createdAt.toISOString()
            }
        },

        path: '/graphql',
        graphiql: env.NODE_ENV !== 'production',
        errorFormatter: (executionResult, context) => {
            const error = executionResult.errors?.[0]
            const originalError = error?.originalError

            if (originalError instanceof DomainError) {
                return {
                    statusCode: originalError.code === 'NOT_FOUND' ? 404 : 400,
                    response: {
                        data: executionResult.data,
                        errors: executionResult.errors ?? []
                    }
                }
            }

            return {
                statusCode: 500,
                response: {
                    data: executionResult.data,
                    errors: executionResult.errors ?? []
                }
            }
        }
    })
}
