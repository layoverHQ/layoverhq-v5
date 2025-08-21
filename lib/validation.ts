import { z } from "zod"

// Authentication schemas
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

export const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  role: z.enum(["user", "agent", "manager", "admin"]).default("user"),
})

// Flight schemas
export const flightSearchSchema = z.object({
  origin: z.string().length(3, "Origin must be a 3-letter airport code"),
  destination: z.string().length(3, "Destination must be a 3-letter airport code"),
  departure_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  return_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)")
    .optional(),
  passengers: z.number().min(1).max(9).default(1),
  class: z.enum(["economy", "premium_economy", "business", "first"]).default("economy"),
})

export const flightCreateSchema = z.object({
  flight_number: z.string().min(2, "Flight number is required"),
  airline_id: z.string().uuid("Invalid airline ID"),
  departure_airport_id: z.string().uuid("Invalid departure airport ID"),
  arrival_airport_id: z.string().uuid("Invalid arrival airport ID"),
  departure_time: z.string().datetime("Invalid departure time"),
  arrival_time: z.string().datetime("Invalid arrival time"),
  price_economy: z.number().positive("Economy price must be positive"),
  price_premium_economy: z.number().positive().optional(),
  price_business: z.number().positive().optional(),
  price_first: z.number().positive().optional(),
  available_seats: z.number().min(0, "Available seats cannot be negative"),
})

// Booking schemas
export const bookingCreateSchema = z.object({
  flights: z
    .array(
      z.object({
        flight_id: z.string().uuid("Invalid flight ID"),
        passenger_name: z.string().min(2, "Passenger name is required"),
        passenger_email: z.string().email("Invalid passenger email"),
        seat_class: z.enum(["economy", "premium_economy", "business", "first"]),
      }),
    )
    .min(1, "At least one flight is required"),
  layovers: z
    .array(
      z.object({
        layover_package_id: z.string().uuid("Invalid layover package ID"),
        participants: z.number().min(1).max(10).default(1),
      }),
    )
    .optional(),
  currency: z.string().length(3, "Currency must be a 3-letter code").default("USD"),
})

// File upload schemas
export const fileUploadSchema = z.object({
  bucket: z.string().min(1, "Bucket name is required"),
  folder: z.string().optional(),
  processImage: z.boolean().default(false),
})

// Integration schemas
export const integrationConfigSchema = z.object({
  name: z.string().min(1, "Integration name is required"),
  config: z.record(z.any()),
  enabled: z.boolean().default(true),
})

// Validation helper function
export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): { success: true; data: T } | { success: false; error: string } {
  try {
    const result = schema.parse(data)
    return { success: true, data: result }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors
        .map((err) => `${err.path.join(".")}: ${err.message}`)
        .join(", ")
      return { success: false, error: errorMessage }
    }
    return { success: false, error: "Validation failed" }
  }
}
