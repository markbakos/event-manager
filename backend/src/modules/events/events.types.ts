import type { EventStatus } from '../../database/entities/event.entity.js'
import type { LocationId } from '../../shared/locations.js'

export type CreateEventInput = {
  title: string
  locationId: LocationId
  startAt: string
  endAt: string
  participantEmails?: string[]
  status?: EventStatus
}

export type UpdateEventInput = {
  title?: string
  locationId?: LocationId
  startAt?: string
  endAt?: string
  participantEmails?: string[]
  status?: EventStatus
}
