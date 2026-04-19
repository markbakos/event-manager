import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm'

import { ParticipantEntity } from './participant.entity.js'

export enum EventStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED'
}

@Entity({ name: 'events' })
@Index('idx_events_status_location_time', ['status', 'locationId', 'startAt', 'endAt'])
export class EventEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar', length: 255 })
  title!: string

  @Column({ type: 'enum', enum: EventStatus, default: EventStatus.DRAFT })
  status!: EventStatus

  @Column({ type: 'varchar', length: 100 })
  locationId!: string

  @Column({ type: 'timestamptz' })
  startAt!: Date

  @Column({ type: 'timestamptz' })
  endAt!: Date

  @OneToMany(() => ParticipantEntity, (participant) => participant.event, {
    cascade: false
  })
  participants!: ParticipantEntity[]

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date
}
