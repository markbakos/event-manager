import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique
} from 'typeorm'

import { EventEntity } from './event.entity.js'

@Entity({ name: 'participants' })
@Unique('uq_participants_event_email', ['eventId', 'email'])
@Index('idx_participants_event_id', ['eventId'])
export class ParticipantEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'uuid' })
  eventId!: string

  @ManyToOne(() => EventEntity, (event) => event.participants, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'eventId' })
  event!: EventEntity

  @Column({ type: 'varchar', length: 320 })
  email!: string

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date
}
