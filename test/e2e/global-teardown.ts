import { execSync } from 'child_process';

export default async function globalTeardown(): Promise<void> {
  execSync('docker compose -f docker-compose.e2e.yml down', { stdio: 'inherit' });
}
