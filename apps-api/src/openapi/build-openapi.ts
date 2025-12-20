import type { FastifyInstance } from "fastify";

export async function registerOpenApi(app: FastifyInstance) {
  await app.register(import("@fastify/swagger"), {
    openapi: {
      info: {
        title: "Nuttoo API",
        description: "API surface for modules, forks, runs, and health.",
        version: "0.1.0",
      },
      servers: [{ url: "/" }],
    },
  });

  await app.register(import("@fastify/swagger-ui"), {
    routePrefix: "/docs",
    uiConfig: {
      docExpansion: "list",
      deepLinking: false,
    },
  });
}
