export const eventsSchema = /* GraphQL */ `
  enum EventStatus {
    DRAFT
    PUBLISHED
  }

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

  type Participant {
    id: ID!
    email: String!
    createdAt: String!
  }

  type Event {
    id: ID!
    title: String!
    status: EventStatus!
    locationId: String!
    location: Location!
    startAt: String!
    endAt: String!
    participants: [Participant!]!
    createdAt: String!
    updatedAt: String!
  }

  input CreateEventInput {
    title: String!
    locationId: String!
    startAt: String!
    endAt: String!
    participantEmails: [String!]
    status: EventStatus
  }

  input UpdateEventInput {
    title: String
    locationId: String
    startAt: String
    endAt: String
    participantEmails: [String!]
    status: EventStatus
  }

  type Query {
    health: HealthCheck!
    locations: [Location!]!
    events: [Event!]!
    event(id: ID!): Event!
  }

  type Mutation {
    createEvent(input: CreateEventInput!): Event!
    updateEvent(id: ID!, input: UpdateEventInput!): Event!
    publishEvent(id: ID!): Event!
    deleteEvent(id: ID!): Boolean!
  }
`
