import { capitalize } from "../utils"

/**
 * Generate Kotlin data classes from JSON
 */
export function generateKotlin(json: any, className = "Root"): string {
  if (typeof json !== "object" || json === null) {
    return `data class ${className}(
    val value: ${getKotlinType(json)}
)`
  }

  if (Array.isArray(json)) {
    if (json.length === 0) {
      return `data class ${className}(
    val items: List<Any> = listOf()
)`
    }

    const sample = json[0]
    if (typeof sample === "object" && sample !== null) {
      const itemClassName = `${className}Item`
      return `${generateKotlin(sample, itemClassName)}

data class ${className}(
    val items: List<${itemClassName}> = listOf()
)`
    } else {
      return `data class ${className}(
    val items: List<${getKotlinType(sample)}> = listOf()
)`
    }
  }

  // Generate nested classes
  const nestedClasses: string[] = []

  // Process object properties
  const properties = Object.entries(json)
    .map(([key, value]) => {
      const propertyName = formatKotlinPropertyName(key)

      if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        // Generate class for nested object
        const nestedClassName = `${className}${capitalize(key)}`
        nestedClasses.push(generateKotlin(value, nestedClassName))
        return `    val ${propertyName}: ${nestedClassName}`
      } else if (Array.isArray(value) && value.length > 0 && typeof value[0] === "object" && value[0] !== null) {
        // Generate class for array of objects
        const itemClassName = `${className}${capitalize(key)}Item`
        nestedClasses.push(generateKotlin(value[0], itemClassName))
        return `    val ${propertyName}: List<${itemClassName}> = listOf()`
      } else if (Array.isArray(value)) {
        if (value.length === 0) {
          return `    val ${propertyName}: List<Any> = listOf()`
        }
        return `    val ${propertyName}: List<${getKotlinType(value[0])}> = listOf()`
      } else {
        const fieldType = getKotlinFieldType(value)
        // Make primitives nullable if the value is null
        const nullableSuffix = value === null ? "?" : ""
        return `    val ${propertyName}: ${fieldType}${nullableSuffix}`
      }
    })
    .join(",\n")

  const mainClass = `@Serializable
data class ${className}(
${properties}
)`

  if (nestedClasses.length > 0) {
    return `import kotlinx.serialization.Serializable

${nestedClasses.join("\n\n")}

${mainClass}`
  }

  return `import kotlinx.serialization.Serializable

${mainClass}`
}

/**
 * Get Kotlin type for a primitive value
 */
function getKotlinType(value: any): string {
  if (value === null) return "Any?"
  if (typeof value === "string") return "String"
  if (typeof value === "number") {
    // Check if it's an integer
    return Number.isInteger(value) ? "Int" : "Double"
  }
  if (typeof value === "boolean") return "Boolean"
  return "Any"
}

/**
 * Get Kotlin field type for any value
 */
function getKotlinFieldType(value: any): string {
  if (value === null) return "Any"
  if (typeof value === "string") return "String"
  if (typeof value === "number") {
    return Number.isInteger(value) ? "Int" : "Double"
  }
  if (typeof value === "boolean") return "Boolean"
  return "Any"
}

/**
 * Format property name to follow Kotlin naming conventions
 * Converts snake_case or kebab-case to camelCase
 */
function formatKotlinPropertyName(name: string): string {
  // Handle reserved keywords
  const reservedKeywords = [
    "as",
    "break",
    "class",
    "continue",
    "do",
    "else",
    "false",
    "for",
    "fun",
    "if",
    "in",
    "interface",
    "is",
    "null",
    "object",
    "package",
    "return",
    "super",
    "this",
    "throw",
    "true",
    "try",
    "typealias",
    "typeof",
    "val",
    "var",
    "when",
    "while",
  ]

  // Convert to camelCase
  const camelCase = name.replace(/[-_]([a-z])/g, (_, letter) => letter.toUpperCase())

  // If it's a reserved keyword, prefix with an underscore
  if (reservedKeywords.includes(camelCase)) {
    return `\`${camelCase}\``
  }

  return camelCase
}
