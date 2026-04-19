const toNumber = (value: string | undefined, fallback: number): number => {
    if (!value) return fallback;

    const parsed = Number(value);
    if (Number.isNaN(parsed)) return fallback;

    return parsed;
};

export const env = {
    NODE_ENV: process.env.NODE_ENV || 'development',
    HOST: process.env.HOST || '0.0.0.0',
    PORT: toNumber(process.env.PORT, 4000),

    DATABASE_URL:
        process.env.DATABASE_URL ||
        'postgresql://postgres:postgres@db:5432/event_manager',

    POSTGRES_HOST: process.env.POSTGRES_HOST || 'db',
    POSTGRES_PORT: toNumber(process.env.POSTGRES_PORT, 5432),
    POSTGRES_USER: process.env.POSTGRES_USER || 'postgres',
    POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD || 'postgres',
    POSTGRES_DB: process.env.POSTGRES_DB || 'event_manager',

    MAIL_HOST: process.env.MAIL_HOST || 'mailpit',
    MAIL_PORT: toNumber(process.env.MAIL_PORT, 1025),
    MAIL_FROM: process.env.MAIL_FROM || 'no-reply@event-manager.local'
} as const;