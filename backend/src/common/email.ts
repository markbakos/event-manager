import { DomainError } from './domain-error.js'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const normalizeEmail = (value: string): string => value.trim().toLowerCase()

export const validateEmail = (value: string): string => {
  const email = normalizeEmail(value)

  if (!EMAIL_PATTERN.test(email)) {
    throw new DomainError(`Invalid email address: ${value}`)
  }

  return email
}

export const uniqueEmails = (emails: string[]): string[] => {
  const seen = new Set<string>()
  const result: string[] = []

  for (const email of emails) {
    const normalized = validateEmail(email)

    if (seen.has(normalized)) {
      continue
    }

    seen.add(normalized)
    result.push(normalized)
  }

  return result
}
