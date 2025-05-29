import { capitalize } from "../utils"

/**
 * Generate Go structs from JSON
 */
export function generateGo(json: any, structName = "Root"): string {
  if (typeof json !== "object" || json === null) {
    return `type ${structName} struct {
\tValue ${getGoType(json)} \`json:"value"\`
}`
  }

  if (Array.isArray(json)) {
    if (json.length === 0) {
      return `type ${structName} struct {
\tItems []interface{} \`json:"items"\`
}`
    }

    const sample = json[0]
    if (typeof sample === "object" && sample !== null) {
      const itemStructName = `${structName}Item`
      return `${generateGo(sample, itemStructName)}

type ${structName} struct {
\tItems []${itemStructName} \`json:"items"\`
}`
    } else {
      return `type ${structName} struct {
\tItems []${getGoType(sample)} \`json:"items"\`
}`
    }
  }

  // Generate nested structs
  const nestedStructs: string[] = []

  // Process object properties
  const fields = Object.entries(json)
    .map(([key, value]) => {
      const fieldName = formatGoFieldName(key)

      if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        // Generate struct for nested object
        const nestedStructName = `${structName}${capitalize(key)}`
        nestedStructs.push(generateGo(value, nestedStructName))
        return `\t${fieldName} ${nestedStructName} \`json:"${key}"\``
      } else if (Array.isArray(value) && value.length > 0 && typeof value[0] === "object" && value[0] !== null) {
        // Generate struct for array of objects
        const itemStructName = `${structName}${capitalize(key)}Item`
        nestedStructs.push(generateGo(value[0], itemStructName))
        return `\t${fieldName} []${itemStructName} \`json:"${key}"\``
      } else if (Array.isArray(value)) {
        if (value.length === 0) {
          return `\t${fieldName} []interface{} \`json:"${key}"\``
        }
        return `\t${fieldName} []${getGoType(value[0])} \`json:"${key}"\``
      } else {
        return `\t${fieldName} ${getGoFieldType(value)} \`json:"${key}"\``
      }
    })
    .join("\n")

  const mainStruct = `type ${structName} struct {
${fields}
}`

  if (nestedStructs.length > 0) {
    return `${nestedStructs.join("\n\n")}\n\n${mainStruct}`
  }

  return mainStruct
}

/**
 * Get Go type for a primitive value
 */
function getGoType(value: any): string {
  if (value === null) return "interface{}"
  if (typeof value === "string") return "string"
  if (typeof value === "number") {
    // Check if it's an integer
    return Number.isInteger(value) ? "int" : "float64"
  }
  if (typeof value === "boolean") return "bool"
  return "interface{}"
}

/**
 * Get Go field type for any value
 */
function getGoFieldType(value: any): string {
  if (value === null) return "interface{}"
  if (typeof value === "string") return "string"
  if (typeof value === "number") {
    return Number.isInteger(value) ? "int" : "float64"
  }
  if (typeof value === "boolean") return "bool"
  return "interface{}"
}

/**
 * Format field name to follow Go naming conventions
 * Converts snake_case or kebab-case to PascalCase for exported fields
 */
function formatGoFieldName(name: string): string {
  // Handle reserved keywords
  const reservedKeywords = [
    "break",
    "default",
    "func",
    "interface",
    "select",
    "case",
    "defer",
    "go",
    "map",
    "struct",
    "chan",
    "else",
    "goto",
    "package",
    "switch",
    "const",
    "fallthrough",
    "if",
    "range",
    "type",
    "continue",
    "for",
    "import",
    "return",
    "var",
  ]

  // Convert to PascalCase for exported fields
  const pascalCase = name
    .split(/[-_]/)
    .map((word) => capitalize(word))
    .join("")

  // If it's a reserved keyword, add an underscore suffix
  if (reservedKeywords.includes(pascalCase.toLowerCase())) {
    return `${pascalCase}_`
  }

  return pascalCase
}
