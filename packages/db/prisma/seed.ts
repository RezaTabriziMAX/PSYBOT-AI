import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  await prisma.module.upsert({
    where: { name_version: { name: "hello-module", version: "0.1.0" } },
    update: {},
    create: {
      name: "hello-module",
      version: "0.1.0",
      description: "Example module shipped with Nuttoo",
      manifest: {
        name: "hello-module",
        version: "0.1.0",
        entrypoint: "index.js",
        inputs: [{ name: "name", type: "string", required: false, default: "world" }],
        outputs: [{ name: "message", type: "string" }],
        permissions: { network: false, filesystem: "read-only" },
      },
    },
  });
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
