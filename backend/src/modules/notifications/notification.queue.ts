import { PgBoss } from 'pg-boss'

import type { EventPublishedEmailJob } from './notification.types.js'

export const QUEUE_NAMES = {
  eventPublishedEmail: 'event-published-email'
} as const

type WorkerHandlers = {
  onEventPublishedEmail: (payload: EventPublishedEmailJob) => Promise<void>
}

export class NotificationQueue {
  private readonly boss: PgBoss

  constructor(connectionString: string) {
    this.boss = new PgBoss(connectionString)
    this.boss.on('error', (error) => {
      console.error('pg-boss error', error)
    })
  }

  async start(): Promise<void> {
    await this.boss.start()
  }

  async stop(): Promise<void> {
    await this.boss.stop()
  }

  async ensureQueues(): Promise<void> {
    try {
      await this.boss.createQueue(QUEUE_NAMES.eventPublishedEmail)
    } catch (error) {
      if (error instanceof Error && /already exists|duplicate/i.test(error.message)) {
        return
      }

      throw error
    }
  }

  async registerWorkers(handlers: WorkerHandlers): Promise<void> {
    await this.boss.work<EventPublishedEmailJob>(
      QUEUE_NAMES.eventPublishedEmail,
      async (jobs) => {
        for (const job of jobs) {
          await handlers.onEventPublishedEmail(job.data)
        }
      }
    )
  }

  async enqueueEventPublishedEmails(payloads: EventPublishedEmailJob[]): Promise<void> {
    for (const payload of payloads) {
      await this.boss.send(QUEUE_NAMES.eventPublishedEmail, payload)
    }
  }
}
