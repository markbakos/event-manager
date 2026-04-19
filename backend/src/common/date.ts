import { DomainError } from './domain-error.js'

export const parseIsoDate = (value: string, fieldName: string): Date => {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    throw new DomainError(`Invalid date for ${fieldName}`)
  }

  return date
}

export const assertDateRange = (startAt: Date, endAt: Date): void => {
  if (startAt.getTime() > endAt.getTime()) {
    throw new DomainError('Event start date cannot be later than end date')
  }
}
