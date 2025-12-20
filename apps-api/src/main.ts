import { buildServer } from "./server.js";

async function main() {
  const { app, env } = await buildServer();

  const close = async () => {
    try {
      await app.close();
    } finally {
      process.exit(0);
    }
  };

  process.on("SIGINT", close);
  process.on("SIGTERM", close);

  await app.listen({ host: env.HOST, port: env.PORT });
  app.log.info({ host: env.HOST, port: env.PORT }, "api_listening");
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
