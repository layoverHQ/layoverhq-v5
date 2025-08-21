const puppeteer = require("puppeteer")

async function testAdminUI() {
  const browser = await puppeteer.launch({
    headless: false,
    devtools: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  })

  try {
    const page = await browser.newPage()

    // Set viewport
    await page.setViewport({ width: 1920, height: 1080 })

    // Navigate to admin page
    console.log("Navigating to admin page...")
    await page.goto("http://localhost:3000/admin/tenants", {
      waitUntil: "networkidle2",
      timeout: 30000,
    })

    // Take screenshot
    await page.screenshot({
      path: "admin-tenants-screenshot.png",
      fullPage: true,
    })
    console.log("Screenshot saved as admin-tenants-screenshot.png")

    // Check for CSS issues
    const missingStyles = await page.evaluate(() => {
      const elements = document.querySelectorAll("*")
      const issues = []

      elements.forEach((el) => {
        const styles = window.getComputedStyle(el)

        // Check if element has Tailwind classes but no styling
        if (el.className && typeof el.className === "string") {
          const classes = el.className.split(" ")
          const hasTailwind = classes.some(
            (c) =>
              c.includes("bg-") ||
              c.includes("text-") ||
              c.includes("p-") ||
              c.includes("m-") ||
              c.includes("flex") ||
              c.includes("grid"),
          )

          if (hasTailwind) {
            // Check if basic styles are missing
            if (styles.backgroundColor === "rgba(0, 0, 0, 0)" && el.className.includes("bg-")) {
              issues.push({
                element: el.tagName,
                classes: el.className,
                issue: "Background color not applied",
              })
            }
          }
        }
      })

      return issues
    })

    if (missingStyles.length > 0) {
      console.log("CSS Issues found:")
      console.log(missingStyles.slice(0, 10)) // Show first 10 issues
    } else {
      console.log("No obvious CSS issues detected")
    }

    // Check for console errors
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        console.log("Console error:", msg.text())
      }
    })

    // Navigate to other admin pages
    const pages = ["/admin/configuration", "/admin/white-label", "/admin/monitoring"]

    for (const adminPage of pages) {
      console.log(`Testing ${adminPage}...`)
      await page.goto(`http://localhost:3000${adminPage}`, {
        waitUntil: "networkidle2",
        timeout: 30000,
      })

      const filename = adminPage.replace(/\//g, "-").substring(1) + "-screenshot.png"
      await page.screenshot({
        path: filename,
        fullPage: true,
      })
      console.log(`Screenshot saved as ${filename}`)
    }

    // Keep browser open for manual inspection
    console.log("\nBrowser will remain open for manual inspection.")
    console.log("Press Ctrl+C to close.")

    // Keep process running
    await new Promise(() => {})
  } catch (error) {
    console.error("Error during testing:", error)
    await browser.close()
  }
}

testAdminUI().catch(console.error)
