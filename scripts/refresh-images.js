#!/usr/bin/env node

/**
 * Script to refresh old images
 * Can be run manually or set up as a cron job
 *
 * Usage:
 *   node scripts/refresh-images.js
 *   node scripts/refresh-images.js --days 15
 *   node scripts/refresh-images.js --cities Dubai,Paris,London
 */

const https = require("https")
const http = require("http")

// Configuration
const API_URL = process.env.API_URL || "http://localhost:3001"
const API_KEY = process.env.IMAGE_REFRESH_API_KEY || "layoverhq-admin-2024"

// Parse command line arguments
const args = process.argv.slice(2)
const options = {}

for (let i = 0; i < args.length; i += 2) {
  const key = args[i].replace("--", "")
  const value = args[i + 1]

  if (key === "cities") {
    options.cities = value.split(",").map((c) => c.trim())
  } else if (key === "days") {
    options.daysOld = parseInt(value)
  }
}

console.log("🖼️  Image Refresh Script")
console.log("========================")
console.log(`API URL: ${API_URL}`)
console.log(`Options:`, options)
console.log("")

// Function to make HTTP request
function makeRequest(url, method, headers, body) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url)
    const client = urlObj.protocol === "https:" ? https : http

    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: headers,
    }

    const req = client.request(requestOptions, (res) => {
      let data = ""

      res.on("data", (chunk) => {
        data += chunk
      })

      res.on("end", () => {
        try {
          const parsed = JSON.parse(data)
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed)
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${parsed.error || "Unknown error"}`))
          }
        } catch (e) {
          reject(new Error(`Failed to parse response: ${data}`))
        }
      })
    })

    req.on("error", reject)

    if (body) {
      req.write(JSON.stringify(body))
    }

    req.end()
  })
}

// Get current cache stats
async function getCacheStats() {
  console.log("📊 Getting current cache statistics...")

  try {
    const stats = await makeRequest(`${API_URL}/api/images/refresh`, "GET", {})

    console.log("Current cache stats:")
    console.log(`  - Total images: ${stats.cacheInfo.totalImages}`)
    console.log(`  - Expired images: ${stats.cacheInfo.expiredImages}`)
    console.log(`  - Oldest image age: ${stats.cacheInfo.oldestImageAge}`)
    console.log(`  - Average age: ${stats.cacheInfo.averageAge}`)
    console.log("")

    return stats
  } catch (error) {
    console.error("Failed to get cache stats:", error.message)
    return null
  }
}

// Refresh images
async function refreshImages() {
  console.log("🔄 Refreshing images...")

  const body = {}

  if (options.daysOld) {
    body.daysOld = options.daysOld
    console.log(`  - Refreshing images older than ${options.daysOld} days`)
  }

  if (options.cities) {
    body.cities = options.cities
    console.log(`  - Refreshing cities: ${options.cities.join(", ")}`)
  }

  console.log("")

  try {
    const result = await makeRequest(
      `${API_URL}/api/images/refresh`,
      "POST",
      {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
      },
      body,
    )

    console.log("✅ Images refreshed successfully!")
    console.log("")
    console.log("Results:")
    console.log(`  - Images before: ${result.stats.before.totalImages}`)
    console.log(`  - Images after: ${result.stats.after.totalImages}`)
    console.log(`  - Images refreshed: ${result.stats.refreshed}`)

    return result
  } catch (error) {
    console.error("❌ Failed to refresh images:", error.message)
    throw error
  }
}

// Main execution
async function main() {
  try {
    // Get initial stats
    await getCacheStats()

    // Refresh images
    await refreshImages()

    // Get final stats
    console.log("")
    console.log("📊 Final cache statistics:")
    await getCacheStats()

    console.log("✅ Script completed successfully!")
    process.exit(0)
  } catch (error) {
    console.error("❌ Script failed:", error)
    process.exit(1)
  }
}

// Run the script
main()
