// Single source of truth for the ports/credentials docker-compose.e2e.yml exposes on the host,
// shared between global-setup, the env bootstrap and the test file itself.
export const API_URL = 'http://localhost:3100';

export const DB_HOST = 'localhost';
export const DB_PORT = 5436;
export const DB_USER = 'e2e';
export const DB_PASSWORD = 'e2e';
export const DB_NAME = 'e2e';

export const MONGO_URI = 'mongodb://root:root@localhost:27019/?authSource=admin';

export const SQS_ENDPOINT = 'http://localhost:4566';
export const QUEUE_NAME = 'e2e-notifications';
export const QUEUE_URL = `${SQS_ENDPOINT}/000000000000/${QUEUE_NAME}`;
