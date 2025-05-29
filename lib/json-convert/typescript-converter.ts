/**
 * Generate TypeScript interfaces from JSON
 */
export function generateTypeScript(json: any, rootName = "Root"): string {
  if (typeof json !== "object" || json === null) {
    return `type ${rootName} = ${typeof json === "string" ? "string" : typeof json};`
  }

  if (Array.isArray(json)) {
    if (json.length === 0) {
      return `type ${rootName} = any[];`
    }

    // Use the first item as a sample
    const sample = json[0]
    if (typeof sample === "object" && sample !== null) {
      return `type ${rootName} = ${generateTypeScriptInlineType(sample, 0)}[];`
    } else {
      return `type ${rootName} = ${typeof sample}[];`
    }
  }

  return `export interface ${rootName} ${generateTypeScriptInlineType(json, 0)}`
}

/**
 * Generate inline type definition for an object with proper indentation
 */
function generateTypeScriptInlineType(json: any, indentLevel: number): string {
  if (typeof json !== "object" || json === null) {
    return typeof json === "string" ? "string" : typeof json
  }

  if (Array.isArray(json)) {
    if (json.length === 0) {
      return "any[]"
    }

    const sample = json[0]
    if (typeof sample === "object" && sample !== null) {
      return `${generateTypeScriptInlineType(sample, indentLevel + 2)}[]`
    } else {
      return `${typeof sample}[]`
    }
  }

  const indent = " ".repeat(indentLevel)
  const nestedIndent = " ".repeat(indentLevel + 2)
  const closingIndent = " ".repeat(indentLevel)

  const properties = Object.entries(json).map(([key, value]) => {
    const propertyType = getInlineTypeScriptType(value, indentLevel + 2)
    return `${nestedIndent}${key}: ${propertyType};`
  })

  return `{\n${properties.join("\n")}\n${closingIndent}}`
}

/**
 * Get TypeScript type for a value, with inline object definitions and proper indentation
 */
function getInlineTypeScriptType(value: any, indentLevel: number): string {
  if (value === null) return "any"
  if (typeof value === "string") return "string"
  if (typeof value === "number") return "number"
  if (typeof value === "boolean") return "boolean"

  if (Array.isArray(value)) {
    if (value.length === 0) return "any[]"
    const sample = value[0]
    if (typeof sample === "object" && sample !== null) {
      return `${generateTypeScriptInlineType(sample, indentLevel)}[]`
    }
    return `${typeof sample}[]`
  }

  if (typeof value === "object") {
    return generateTypeScriptInlineType(value, indentLevel)
  }

  return "any"
}
