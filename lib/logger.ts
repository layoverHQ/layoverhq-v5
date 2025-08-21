import pino from "pino"
import type { LoggerProperties } from "./types/analytics"

const pinoLogger = pino({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
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

export class Logger {
  private context: string

  constructor(context: string) {
    this.context = context
  }

  info(message: string, properties?: LoggerProperties) {
    const contextMessage = `[${this.context}] ${message}`
    if (properties) {
      pinoLogger.info(properties, contextMessage)
    } else {
      pinoLogger.info(contextMessage)
    }
  }

  error(message: string, error?: any) {
    const contextMessage = `[${this.context}] ${message}`
    if (error) {
      pinoLogger.error({ error: error instanceof Error ? error.message : error }, contextMessage)
    } else {
      pinoLogger.error(contextMessage)
    }
  }

  warn(message: string, properties?: LoggerProperties) {
    const contextMessage = `[${this.context}] ${message}`
    if (properties) {
      pinoLogger.warn(properties, contextMessage)
    } else {
      pinoLogger.warn(contextMessage)
    }
  }

  debug(message: string, properties?: LoggerProperties) {
    const contextMessage = `[${this.context}] ${message}`
    if (properties) {
      pinoLogger.debug(properties, contextMessage)
    } else {
      pinoLogger.debug(contextMessage)
    }
  }
}
