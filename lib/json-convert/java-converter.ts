import { capitalize } from "../utils"

/**
 * Generate Java classes from JSON
 */
export function generateJava(json: any, className = "Root"): string {
  if (typeof json !== "object" || json === null) {
    return `public class ${className} {
  private ${getJavaType(json)} value;

  public ${getJavaType(json)} getValue() {
    return value;
  }

  public void setValue(${getJavaType(json)} value) {
    this.value = value;
  }
}`
  }

  if (Array.isArray(json)) {
    if (json.length === 0) {
      return `import java.util.List;

public class ${className} {
  private List<Object> items;

  public List<Object> getItems() {
    return items;
  }

  public void setItems(List<Object> items) {
    this.items = items;
  }
}`
    }

    const sample = json[0]
    if (typeof sample === "object" && sample !== null) {
      const itemClassName = `${className}Item`
      return `${generateJava(sample, itemClassName)}

import java.util.List;

public class ${className} {
  private List<${itemClassName}> items;

  public List<${itemClassName}> getItems() {
    return items;
  }

  public void setItems(List<${itemClassName}> items) {
    this.items = items;
  }
}`
    } else {
      return `import java.util.List;

public class ${className} {
  private List<${getJavaType(sample)}> items;

  public List<${getJavaType(sample)}> getItems() {
    return items;
  }

  public void setItems(List<${getJavaType(sample)}> items) {
    this.items = items;
  }
}`
    }
  }

  // Generate nested classes
  const nestedClasses: string[] = []
  const imports = new Set<string>()
  imports.add("import java.util.List;")

  // Process object properties
  const fields = Object.entries(json)
    .map(([key, value]) => {
      if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        // Generate class for nested object
        const nestedClassName = `${className}${capitalize(key)}`
        nestedClasses.push(generateJava(value, nestedClassName))
        return `  private ${nestedClassName} ${key};`
      } else if (Array.isArray(value) && value.length > 0 && typeof value[0] === "object" && value[0] !== null) {
        // Generate class for array of objects
        const itemClassName = `${className}${capitalize(key)}Item`
        nestedClasses.push(generateJava(value[0], itemClassName))
        return `  private List<${itemClassName}> ${key};`
      } else {
        const fieldType = getJavaFieldType(value, `${className}${capitalize(key)}`)
        return `  private ${fieldType} ${key};`
      }
    })
    .join("\n")

  // Generate getters and setters with proper formatting
  const gettersAndSetters = Object.entries(json)
    .map(([key, value]) => {
      if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        const nestedClassName = `${className}${capitalize(key)}`
        return `  public ${nestedClassName} get${capitalize(key)}() {
    return ${key};
  }

  public void set${capitalize(key)}(${nestedClassName} ${key}) {
    this.${key} = ${key};
  }`
      } else if (Array.isArray(value) && value.length > 0 && typeof value[0] === "object" && value[0] !== null) {
        const itemClassName = `${className}${capitalize(key)}Item`
        return `  public List<${itemClassName}> get${capitalize(key)}() {
    return ${key};
  }

  public void set${capitalize(key)}(List<${itemClassName}> ${key}) {
    this.${key} = ${key};
  }`
      } else {
        const fieldType = getJavaFieldType(value, `${className}${capitalize(key)}`)
        return `  public ${fieldType} get${capitalize(key)}() {
    return ${key};
  }

  public void set${capitalize(key)}(${fieldType} ${key}) {
    this.${key} = ${key};
  }`
      }
    })
    .join("\n\n")

  const mainClass = `${Array.from(imports).join("\n")}

public class ${className} {
${fields}

${gettersAndSetters}
}`

  if (nestedClasses.length > 0) {
    return `${nestedClasses.join("\n\n")}\n\n${mainClass}`
  }

  return mainClass
}

/**
 * Get Java type for a primitive value
 */
function getJavaType(value: any): string {
  if (value === null) return "Object"
  if (typeof value === "string") return "String"
  if (typeof value === "number") {
    // Check if it's an integer
    return Number.isInteger(value) ? "int" : "double"
  }
  if (typeof value === "boolean") return "boolean"
  return "Object"
}

/**
 * Get Java field type for any value
 */
function getJavaFieldType(value: any, className: string): string {
  if (value === null) return "Object"
  if (typeof value === "string") return "String"
  if (typeof value === "number") {
    return Number.isInteger(value) ? "int" : "double"
  }
  if (typeof value === "boolean") return "boolean"

  if (Array.isArray(value)) {
    if (value.length === 0) return "List<Object>"
    const sample = value[0]
    if (typeof sample === "object" && sample !== null) {
      return `List<${className}Item>`
    }
    return `List<${getJavaType(sample)}>`
  }

  if (typeof value === "object") return className

  return "Object"
}
