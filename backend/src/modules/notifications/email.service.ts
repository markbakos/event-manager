import nodemailer from 'nodemailer'

import type { EventPublishedEmailJob } from './notification.types.js'

type EmailServiceOptions = {
  host: string
  port: number
  from: string
}

export class EmailService {
  private readonly transporter
  private readonly from: string

  constructor(options: EmailServiceOptions) {
    this.from = options.from
    this.transporter = nodemailer.createTransport({
      host: options.host,
      port: options.port,
      secure: false
    })
  }

  async sendEventPublishedEmail(payload: EventPublishedEmailJob): Promise<void> {
    await this.transporter.sendMail({
      from: this.from,
      to: payload.recipientEmail,
      subject: `Event published: ${payload.eventTitle}`,
      text: [
        `Your event has been published.`,
        '',
        `Title: ${payload.eventTitle}`,
        `Location: ${payload.locationName}`,
        `Start: ${payload.startAtIso}`,
        `End: ${payload.endAtIso}`
      ].join('')
    })
  }
}
