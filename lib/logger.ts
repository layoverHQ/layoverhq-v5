import pino from "pino"
import type { LoggerProperties } from "./types/analytics"

const pinoLogger = pino({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  ...(process.env.NODE_ENV !== "production" && {
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
      },
    },
  }),
  base: {
    env: process.env.NODE_ENV,
    revision: process.env.VERCEL_GIT_COMMIT_SHA,
  },
})

export const logger = {
  info: (message: string, properties?: LoggerProperties) => {
    if (properties) {
      pinoLogger.info(properties, message)
    } else {
      pinoLogger.info(message)
    }
  },
  error: (message: string, properties?: LoggerProperties) => {
    if (properties) {
      pinoLogger.error(properties, message)
    } else {
      pinoLogger.error(message)
    }
  },
  warn: (message: string, properties?: LoggerProperties) => {
    if (properties) {
      pinoLogger.warn(properties, message)
    } else {
      pinoLogger.warn(message)
    }
  },
  debug: (message: string, properties?: LoggerProperties) => {
    if (properties) {
      pinoLogger.debug(properties, message)
    } else {
      pinoLogger.debug(message)
    }
  },
}
