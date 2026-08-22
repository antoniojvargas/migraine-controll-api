import { readFileSync } from 'fs';
import { join } from 'path';
import { FastifyInstance } from 'fastify';
import { envs } from '@/config/env';

const SWAGGER_UI_CDN = 'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css';
const SWAGGER_UI_BUNDLE_CDN = 'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js';

export interface DocsOptions {
  enabled?: boolean;
}

export const docsEnabledByDefault = (): boolean => envs.NODE_ENV !== 'production';

const buildSwaggerHtml = (): string => `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Migraine Control API - Swagger UI</title>
    <link rel="stylesheet" href="${SWAGGER_UI_CDN}" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="${SWAGGER_UI_BUNDLE_CDN}"></script>
    <script>
      window.onload = () => {
        window.ui = SwaggerUIBundle({ url: '/docs/openapi.yml', dom_id: '#swagger-ui' });
      };
    </script>
  </body>
</html>`;

let cachedSpec: string | undefined;

const loadSpec = (): string => {
  if (cachedSpec === undefined) {
    cachedSpec = readFileSync(join(process.cwd(), 'openapi.yml'), 'utf8');
  }
  return cachedSpec;
};

export const registerDocs = (app: FastifyInstance, options: DocsOptions = {}): void => {
  const enabled = options.enabled ?? docsEnabledByDefault();
  if (enabled === false) {
    return;
  }

  app.get('/docs', async (_request, reply) =>
    reply.type('text/html; charset=utf-8').send(buildSwaggerHtml()),
  );
  app.get('/docs/openapi.yml', async (_request, reply) =>
    reply.type('application/yaml; charset=utf-8').send(loadSpec()),
  );
};
