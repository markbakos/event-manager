export class DomainError extends Error {
  public readonly code: string

  constructor(message: string, code = 'BAD_USER_INPUT') {
    super(message)
    this.name = 'DomainError'
    this.code = code
  }
}
