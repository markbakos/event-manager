import 'reflect-metadata'

import { DataSource } from 'typeorm'

import { env } from '../config/env.js'

export const AppDataSource = new DataSource({
    type: 'postgres',
    url: env.DATABASE_URL,
    synchronize: env.NODE_ENV === 'development',
    logging: env.NODE_ENV === 'development',
    migrations: [],
    subscribers: []
})

const sleep = async (ms: number): Promise<void> =>
    new Promise((resolve) => setTimeout(resolve, ms))

export const initializeDatabase = async (maxAttempts = 10, delayMs = 3000): Promise<void> => {
    if (AppDataSource.isInitialized) {
        return
    }

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        try {
            await AppDataSource.initialize()
            return
        } catch (error) {
            if (attempt === maxAttempts) {
                throw error
            }

            console.warn(
                `Database connection attempt ${attempt}/${maxAttempts} failed. Retrying in ${delayMs}ms...`
            )

            await sleep(delayMs)
        }
    }
}

export const destroyDatabase = async (): Promise<void> => {
    if (!AppDataSource.isInitialized) {
        return
    }

    await AppDataSource.destroy()
}
