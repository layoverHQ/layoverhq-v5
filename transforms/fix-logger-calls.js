/**
 * JSCodeshift transformation to fix logger call arguments
 * Converts logger.info({props}, "message") to logger.info("message", {props})
 */

const transformer = (fileInfo, api) => {
  const j = api.jscodeshift
  const source = j(fileInfo.source)

  // Fix logger method calls with wrong argument order
  ;["info", "error", "warn", "debug"].forEach((method) => {
    source
      .find(j.CallExpression, {
        callee: {
          type: "MemberExpression",
          object: { name: "logger" },
          property: { name: method },
        },
      })
      .forEach((path) => {
        const args = path.value.arguments

        // If first arg is object and second is string, swap them
        if (
          args.length === 2 &&
          args[0].type === "ObjectExpression" &&
          (args[1].type === "Literal" || args[1].type === "StringLiteral")
        ) {
          const objectArg = args[0]
          const stringArg = args[1]

          // Swap arguments
          path.value.arguments = [stringArg, objectArg]
        }
      })
  })

  return source.toSource({ quote: "double" })
}

module.exports = transformer
module.exports.parser = "tsx"
