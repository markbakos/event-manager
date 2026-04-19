export const EVENT_LOCATIONS = [
    {
        id: 'budapest-office',
        name: 'Budapest Office'
    },
    {
        id: 'debrecen-office',
        name: 'Debrecen Office'
    },
    {
        id: 'remote',
        name: 'Remote'
    }
] as const;

export const LOCATION_BY_ID = new Map(EVENT_LOCATIONS.map((location) => [location.id, location]))
