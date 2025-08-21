/**
 * JSCodeshift transformation to fix analytics tracking type issues
 */

const transformer = (fileInfo, api) => {
  const j = api.jscodeshift
  const source = j(fileInfo.source)

  // Find all trackEvent calls and ensure they have proper typing
  source
    .find(j.CallExpression, {
      callee: {
        type: "Identifier",
        name: "trackEvent",
      },
    })
    .forEach((path) => {
      // Ensure the second argument (properties) exists and is an object
      if (path.value.arguments.length >= 2) {
        const propertiesArg = path.value.arguments[1]
        if (propertiesArg.type === "ObjectExpression") {
          // Add type assertion to satisfy TypeScript
          path.value.arguments[1] = j.tsAsExpression(
            propertiesArg,
            j.tsTypeReference(j.identifier("AnalyticsProperties")),
          )
        }
      }
    })

  return source.toSource({ quote: "double" })
}

module.exports = transformer
module.exports.parser = "tsx"
