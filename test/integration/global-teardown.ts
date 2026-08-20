import { execSync } from 'child_process';

export default async function globalTeardown(): Promise<void> {
  execSync('docker compose -f docker-compose.test.yml down', { stdio: 'inherit' });
}
