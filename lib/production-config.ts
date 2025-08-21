export interface ProductionConfig {
  environment: "development" | "staging" | "production"
  database: {
    maxConnections: number
    connectionTimeout: number
    queryTimeout: number
  }
  redis: {
    maxRetries: number
    retryDelay: number
  }
  monitoring: {
    metricsInterval: number
    alertThresholds: {
      errorRate: number
      responseTime: number
      memoryUsage: number
      cpuUsage: number
    }
  }
  security: {
    rateLimiting: {
      windowMs: number
      maxRequests: number
    }
    cors: {
      origins: string[]
    }
  }
}

const configs: Record<string, ProductionConfig> = {
  development: {
    environment: "development",
    database: {
      maxConnections: 10,
      connectionTimeout: 5000,
      queryTimeout: 10000,
    },
    redis: {
      maxRetries: 3,
      retryDelay: 1000,
    },
    monitoring: {
      metricsInterval: 30000,
      alertThresholds: {
        errorRate: 0.1,
        responseTime: 2000,
        memoryUsage: 0.8,
        cpuUsage: 0.8,
      },
    },
    security: {
      rateLimiting: {
        windowMs: 15 * 60 * 1000,
        maxRequests: 1000,
      },
      cors: {
        origins: ["http://localhost:3000", "http://localhost:3001"],
      },
    },
  },
  staging: {
    environment: "staging",
    database: {
      maxConnections: 20,
      connectionTimeout: 5000,
      queryTimeout: 15000,
    },
    redis: {
      maxRetries: 5,
      retryDelay: 2000,
    },
    monitoring: {
      metricsInterval: 15000,
      alertThresholds: {
        errorRate: 0.05,
        responseTime: 1500,
        memoryUsage: 0.75,
        cpuUsage: 0.75,
      },
    },
    security: {
      rateLimiting: {
        windowMs: 15 * 60 * 1000,
        maxRequests: 500,
      },
      cors: {
        origins: ["https://staging.layoverhq.com"],
      },
    },
  },
  production: {
    environment: "production",
    database: {
      maxConnections: 50,
      connectionTimeout: 3000,
      queryTimeout: 20000,
    },
    redis: {
      maxRetries: 10,
      retryDelay: 3000,
    },
    monitoring: {
      metricsInterval: 10000,
      alertThresholds: {
        errorRate: 0.01,
        responseTime: 1000,
        memoryUsage: 0.7,
        cpuUsage: 0.7,
      },
    },
    security: {
      rateLimiting: {
        windowMs: 15 * 60 * 1000,
        maxRequests: 100,
      },
      cors: {
        origins: ["https://layoverhq.com", "https://www.layoverhq.com"],
      },
    },
  },
}

export function getProductionConfig(): ProductionConfig {
  const env = process.env.NODE_ENV || "development"
  return configs[env] || configs.development
}

export function validateEnvironment(): boolean {
  const requiredEnvVars = [
    "SUPABASE_URL",
    "SUPABASE_ANON_KEY",
    "KV_REST_API_URL",
    "KV_REST_API_TOKEN",
  ]

  const missing = requiredEnvVars.filter((envVar) => !process.env[envVar])

  if (missing.length > 0) {
    console.error("Missing required environment variables:", missing)
    return false
  }

  return true
}
