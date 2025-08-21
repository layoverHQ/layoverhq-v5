const puppeteer = require("puppeteer")

async function checkCSS() {
  const browser = await puppeteer.launch({
    headless: false,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  })

  try {
    const page = await browser.newPage()
    await page.setViewport({ width: 1920, height: 1080 })

    console.log("Navigating to admin page...")
    await page.goto("http://localhost:3000/admin/tenants", {
      waitUntil: "networkidle2",
      timeout: 30000,
    })

    // Take screenshot
    await page.screenshot({
      path: "current-admin-page.png",
      fullPage: true,
    })
    console.log("Screenshot saved as current-admin-page.png")

    // Check if CSS is loaded
    const cssFiles = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
      return links.map((link) => ({
        href: link.href,
        loaded: link.sheet !== null,
      }))
    })

    console.log("CSS Files:", cssFiles)

    // Check computed styles
    const elementStyles = await page.evaluate(() => {
      const body = document.body
      const styles = window.getComputedStyle(body)
      return {
        backgroundColor: styles.backgroundColor,
        color: styles.color,
        fontFamily: styles.fontFamily,
      }
    })

    console.log("Body styles:", elementStyles)

    // Check if Tailwind classes are working
    const tailwindCheck = await page.evaluate(() => {
      const element = document.querySelector(".bg-background")
      if (element) {
        const styles = window.getComputedStyle(element)
        return {
          hasClass: true,
          computedBackground: styles.backgroundColor,
        }
      }
      return { hasClass: false }
    })

    console.log("Tailwind check:", tailwindCheck)

    await browser.close()
  } catch (error) {
    console.error("Error:", error)
    await browser.close()
  }
}

checkCSS()
