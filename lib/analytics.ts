import { track } from "@vercel/analytics"
import type { AnalyticsProperties } from "./types/analytics"

export type { AnalyticsProperties }

export const trackEvent = (eventName: string, properties?: AnalyticsProperties) => {
  if (properties) {
    track(eventName, properties)
  } else {
    track(eventName)
  }
}

export const analytics = {
  // User management events
  userCreated: (userId: string, role: string) => track("user_created", { userId, role }),
  userUpdated: (userId: string, changes: string[]) =>
    track("user_updated", { userId, changes: changes.join(",") }),
  userDeleted: (userId: string) => track("user_deleted", { userId }),

  // System events
  serviceHealthCheck: (service: string, status: string) =>
    track("service_health", { service, status }),
  apiCall: (endpoint: string, method: string, duration: number) =>
    track("api_call", { endpoint, method, duration }),

  // Admin actions
  adminLogin: (userId: string) => track("admin_login", { userId }),
  bulkOperation: (operation: string, count: number) =>
    track("bulk_operation", { operation, count }),
}
