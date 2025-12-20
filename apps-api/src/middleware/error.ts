import type { FastifyPluginAsync } from "fastify";
import { HttpError } from "@nuttoo/errors";
import type { ApiErrorBody } from "../types/http.js";

export const errorPlugin: FastifyPluginAsync = async (app) => {
  app.setErrorHandler((err, req, reply) => {
    const requestId = (req as any).requestId as string | undefined;

    if (err instanceof HttpError) {
      const body: ApiErrorBody = {
        error: {
          code: err.code,
          message: err.message,
          requestId,
          details: err.details,
        },
      };
      reply.status(err.statusCode).send(body);
      return;
    }

    const statusCode =
      (err as any).statusCode && Number.isInteger((err as any).statusCode) ? (err as any).statusCode : 500;

    const body: ApiErrorBody = {
      error: {
        code: "INTERNAL_ERROR",
        message: statusCode >= 500 ? "Internal error" : String((err as any).message ?? "Error"),
        requestId,
      },
    };

    app.log.error({ err, requestId }, "unhandled_error");
    reply.status(statusCode).send(body);
  });
};
