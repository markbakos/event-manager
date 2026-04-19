import { DataSource, EntityManager } from 'typeorm'

import { assertDateRange, parseIsoDate } from '../../common/date.js'
import { DomainError } from '../../common/domain-error.js'
import { uniqueEmails } from '../../common/email.js'
import { EventEntity, EventStatus } from '../../database/entities/event.entity.js'
import { ParticipantEntity } from '../../database/entities/participant.entity.js'
import {LOCATION_BY_ID, type LocationId} from '../../shared/locations.js'
import { NotificationQueue } from '../notifications/notification.queue.js'
import type { EventPublishedEmailJob } from '../notifications/notification.types.js'
import type { CreateEventInput, UpdateEventInput } from './events.types.js'

export class EventsService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly notificationQueue: NotificationQueue
  ) {}

  async listEvents(): Promise<EventEntity[]> {
    return this.dataSource.getRepository(EventEntity).find({
      relations: {
        participants: true
      },
      order: {
        startAt: 'ASC',
        createdAt: 'DESC'
      }
    })
  }

  async getEventById(id: string): Promise<EventEntity> {
    const event = await this.dataSource.getRepository(EventEntity).findOne({
      where: { id },
      relations: {
        participants: true
      }
    })

    if (!event) {
      throw new DomainError('Event not found', 'NOT_FOUND')
    }

    return event
  }

  async createEvent(input: CreateEventInput): Promise<EventEntity> {
    const normalized = this.normalizeCreateInput(input)

    const created = await this.dataSource.transaction(async (manager) => {
      if (normalized.status === EventStatus.PUBLISHED) {
        await this.assertNoPublishedOverlap(
          normalized.locationId,
          normalized.startAt,
          normalized.endAt,
          undefined,
          manager
        )
      }

      const event = manager.create(EventEntity, {
        title: normalized.title,
        status: normalized.status,
        locationId: normalized.locationId,
        startAt: normalized.startAt,
        endAt: normalized.endAt
      })

      const savedEvent = await manager.save(event)

      if (normalized.participantEmails.length > 0) {
        const participants = normalized.participantEmails.map((email) =>
          manager.create(ParticipantEntity, {
            eventId: savedEvent.id,
            email
          })
        )

        await manager.save(participants)
      }

      return this.findEvent(savedEvent.id, manager)
    })

    if (created.status === EventStatus.PUBLISHED) {
      await this.enqueuePublicationEmails(created)
    }

    return created
  }

  async updateEvent(id: string, input: UpdateEventInput): Promise<EventEntity> {
    const existing = await this.getEventById(id)
    const normalized = this.normalizeUpdateInput(existing, input)

    const updated = await this.dataSource.transaction(async (manager) => {
      if (normalized.status === EventStatus.PUBLISHED) {
        await this.assertNoPublishedOverlap(
          normalized.locationId,
          normalized.startAt,
          normalized.endAt,
          existing.id,
          manager
        )
      }

      await manager.update(EventEntity, { id }, {
        title: normalized.title,
        status: normalized.status,
        locationId: normalized.locationId,
        startAt: normalized.startAt,
        endAt: normalized.endAt
      })

      if (normalized.participantEmails !== undefined) {
        await manager.delete(ParticipantEntity, { eventId: id })

        if (normalized.participantEmails.length > 0) {
          const participants = normalized.participantEmails.map((email) =>
            manager.create(ParticipantEntity, {
              eventId: id,
              email
            })
          )

          await manager.save(participants)
        }
      }

      return this.findEvent(id, manager)
    })

    if (existing.status !== EventStatus.PUBLISHED && updated.status === EventStatus.PUBLISHED) {
      await this.enqueuePublicationEmails(updated)
    }

    return updated
  }

  async publishEvent(id: string): Promise<EventEntity> {
    return this.updateEvent(id, {
      status: EventStatus.PUBLISHED
    })
  }

  async deleteEvent(id: string): Promise<boolean> {
    const result = await this.dataSource.getRepository(EventEntity).delete({ id })
    return (result.affected || 0) > 0
  }

  private normalizeCreateInput(input: CreateEventInput) {
    const title = input.title.trim()

    if (!title) {
      throw new DomainError('Title is required')
    }

    this.assertLocationExists(input.locationId)

    const startAt = parseIsoDate(input.startAt, 'startAt')
    const endAt = parseIsoDate(input.endAt, 'endAt')
    assertDateRange(startAt, endAt)

    return {
      title,
      locationId: input.locationId,
      startAt,
      endAt,
      participantEmails: uniqueEmails(input.participantEmails || []),
      status: input.status ?? EventStatus.DRAFT
    }
  }

  private normalizeUpdateInput(existing: EventEntity, input: UpdateEventInput) {
    const title = input.title !== undefined ? input.title.trim() : existing.title

    if (!title) {
      throw new DomainError('Title is required')
    }

    const locationId = input.locationId || existing.locationId
    this.assertLocationExists(locationId)

    const startAt = input.startAt ? parseIsoDate(input.startAt, 'startAt') : existing.startAt
    const endAt = input.endAt ? parseIsoDate(input.endAt, 'endAt') : existing.endAt
    assertDateRange(startAt, endAt)

    const participantEmails =
      input.participantEmails !== undefined ? uniqueEmails(input.participantEmails) : undefined

    return {
      title,
      locationId,
      startAt,
      endAt,
      participantEmails,
      status: input.status || existing.status
    }
  }

  private assertLocationExists(locationId: LocationId): void {
    if (!LOCATION_BY_ID.has(locationId)) {
      throw new DomainError(`Unknown location: ${locationId}`)
    }
  }

  private async assertNoPublishedOverlap(
    locationId: string,
    startAt: Date,
    endAt: Date,
    excludeId: string | undefined,
    manager: EntityManager
  ): Promise<void> {
    const overlapping = await manager
      .getRepository(EventEntity)
      .createQueryBuilder('event')
      .where('event.status = :status', { status: EventStatus.PUBLISHED })
      .andWhere('event.locationId = :locationId', { locationId })
      .andWhere('event.startAt < :endAt', { endAt })
      .andWhere('event.endAt > :startAt', { startAt })
      .andWhere(excludeId ? 'event.id != :excludeId' : '1=1', excludeId ? { excludeId } : {})
      .getOne()

    if (overlapping) {
      throw new DomainError('Another published event already overlaps at this location')
    }
  }

  private async findEvent(id: string, manager: EntityManager): Promise<EventEntity> {
    const event = await manager.findOne(EventEntity, {
      where: { id },
      relations: {
        participants: true
      }
    })

    if (!event) {
      throw new DomainError('Event not found', 'NOT_FOUND')
    }

    return event
  }

  private async enqueuePublicationEmails(event: EventEntity): Promise<void> {
    if (event.participants.length === 0) {
      return
    }

    const locationName = LOCATION_BY_ID.get(event.locationId)?.name || event.locationId

    const jobs: EventPublishedEmailJob[] = event.participants.map((participant) => ({
      eventId: event.id,
      eventTitle: event.title,
      locationName,
      startAtIso: event.startAt.toISOString(),
      endAtIso: event.endAt.toISOString(),
      recipientEmail: participant.email
    }))

    await this.notificationQueue.enqueueEventPublishedEmails(jobs)
  }
}
