import { capitalize } from "../utils"

/**
 * Generate Swift structs from JSON
 */
export function generateSwift(json: any, className = "Root"): string {
  if (typeof json !== "object" || json === null) {
    return `struct ${className}: Codable {
    let value: ${getSwiftType(json)}
    
    enum CodingKeys: String, CodingKey {
        case value
    }
}`
  }

  if (Array.isArray(json)) {
    if (json.length === 0) {
      return `struct ${className}: Codable {
    let items: [Any]
    
    enum CodingKeys: String, CodingKey {
        case items
    }
}`
    }

    const sample = json[0]
    if (typeof sample === "object" && sample !== null) {
      const itemClassName = `${className}Item`
      return `${generateSwift(sample, itemClassName)}

struct ${className}: Codable {
    let items: [${itemClassName}]
    
    enum CodingKeys: String, CodingKey {
        case items
    }
}`
    } else {
      return `struct ${className}: Codable {
    let items: [${getSwiftType(sample)}]
    
    enum CodingKeys: String, CodingKey {
        case items
    }
}`
    }
  }

  // Generate nested structs
  const nestedStructs: string[] = []

  // Process object properties
  const properties = Object.entries(json)
    .map(([key, value]) => {
      if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        // Generate struct for nested object
        const nestedClassName = `${className}${capitalize(key)}`
        nestedStructs.push(generateSwift(value, nestedClassName))
        return `    let ${formatSwiftPropertyName(key)}: ${nestedClassName}`
      } else if (Array.isArray(value) && value.length > 0 && typeof value[0] === "object" && value[0] !== null) {
        // Generate struct for array of objects
        const itemClassName = `${className}${capitalize(key)}Item`
        nestedStructs.push(generateSwift(value[0], itemClassName))
        return `    let ${formatSwiftPropertyName(key)}: [${itemClassName}]`
      } else {
        const fieldType = getSwiftFieldType(value, `${className}${capitalize(key)}`)
        return `    let ${formatSwiftPropertyName(key)}: ${fieldType}`
      }
    })
    .join("\n")

  // Generate CodingKeys enum
  const codingKeys = Object.keys(json)
    .map((key) => {
      const propertyName = formatSwiftPropertyName(key)
      if (key === propertyName) {
        return `        case ${key}`
      } else {
        return `        case ${propertyName} = "${key}"`
      }
    })
    .join("\n")

  const mainStruct = `struct ${className}: Codable {
${properties}
    
    enum CodingKeys: String, CodingKey {
${codingKeys}
    }
}`

  if (nestedStructs.length > 0) {
    return `${nestedStructs.join("\n\n")}\n\n${mainStruct}`
  }

  return mainStruct
}

/**
 * Get Swift type for a primitive value
 */
function getSwiftType(value: any): string {
  if (value === null) return "Any?"
  if (typeof value === "string") return "String"
  if (typeof value === "number") {
    // Check if it's an integer
    return Number.isInteger(value) ? "Int" : "Double"
  }
  if (typeof value === "boolean") return "Bool"
  return "Any"
}

/**
 * Get Swift field type for any value
 */
function getSwiftFieldType(value: any, className: string): string {
  if (value === null) return "Any?"
  if (typeof value === "string") return "String"
  if (typeof value === "number") {
    return Number.isInteger(value) ? "Int" : "Double"
  }
  if (typeof value === "boolean") return "Bool"

  if (Array.isArray(value)) {
    if (value.length === 0) return "[Any]"
    const sample = value[0]
    if (typeof sample === "object" && sample !== null) {
      return `[${className}Item]`
    }
    return `[${getSwiftType(sample)}]`
  }

  if (typeof value === "object") return className

  return "Any"
}

/**
 * Format property name to follow Swift naming conventions
 * Converts snake_case or kebab-case to camelCase
 */
function formatSwiftPropertyName(name: string): string {
  // Handle reserved keywords
  const reservedKeywords = [
    "class",
    "struct",
    "enum",
    "protocol",
    "extension",
    "var",
    "let",
    "func",
    "if",
    "else",
    "for",
    "while",
    "switch",
    "case",
    "default",
    "break",
    "continue",
    "return",
    "true",
    "false",
    "nil",
  ]

  // Convert to camelCase
  const camelCase = name.replace(/[-_]([a-z])/g, (_, letter) => letter.toUpperCase())

  // If it's a reserved keyword, prefix with an underscore
  if (reservedKeywords.includes(camelCase)) {
    return `_${camelCase}`
  }

  return camelCase
}
