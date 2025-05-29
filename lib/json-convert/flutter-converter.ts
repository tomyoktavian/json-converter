import { capitalize } from "../utils"

/**
 * Generate Flutter models from JSON
 */
export function generateFlutter(json: any, className = "Root"): string {
  if (typeof json !== "object" || json === null) {
    return `class ${className} {
  final ${getFlutterType(json)} value;

  ${className}({required this.value});

  factory ${className}.fromJson(Map<String, dynamic> json) {
    return ${className}(
      value: json['value'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'value': value,
    };
  }
}`
  }

  if (Array.isArray(json)) {
    if (json.length === 0) {
      return `class ${className} {
  final List<dynamic> items;

  ${className}({required this.items});

  factory ${className}.fromJson(Map<String, dynamic> json) {
    return ${className}(
      items: json['items'] ?? [],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'items': items,
    };
  }
}`
    }

    const sample = json[0]
    if (typeof sample === "object" && sample !== null) {
      const itemClassName = `${className}Item`
      return `${generateFlutter(sample, itemClassName)}

class ${className} {
  final List<${itemClassName}> items;

  ${className}({required this.items});

  factory ${className}.fromJson(Map<String, dynamic> json) {
    return ${className}(
      items: (json['items'] as List<dynamic>)
          .map((e) => ${itemClassName}.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'items': items.map((e) => e.toJson()).toList(),
    };
  }
}`
    } else {
      return `class ${className} {
  final List<${getFlutterType(sample)}> items;

  ${className}({required this.items});

  factory ${className}.fromJson(Map<String, dynamic> json) {
    return ${className}(
      items: (json['items'] as List<dynamic>).cast<${getFlutterType(sample)}>(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'items': items,
    };
  }
}`
    }
  }

  // Generate nested classes
  const nestedClasses: string[] = []

  // Process object properties
  const fields = Object.entries(json)
    .map(([key, value]) => {
      if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        // Generate class for nested object
        const nestedClassName = `${className}${capitalize(key)}`
        nestedClasses.push(generateFlutter(value, nestedClassName))
        return `  final ${nestedClassName} ${key};`
      } else if (Array.isArray(value) && value.length > 0 && typeof value[0] === "object" && value[0] !== null) {
        // Generate class for array of objects
        const itemClassName = `${className}${capitalize(key)}Item`
        nestedClasses.push(generateFlutter(value[0], itemClassName))
        return `  final List<${itemClassName}> ${key};`
      } else {
        const fieldType = getFlutterFieldType(value, `${className}${capitalize(key)}`)
        return `  final ${fieldType} ${key};`
      }
    })
    .join("\n")

  const constructorParams = Object.keys(json)
    .map((key) => {
      return `required this.${key}`
    })
    .join(", ")

  // Generate fromJson with proper formatting
  const fromJsonParams = Object.entries(json)
    .map(([key, value]) => {
      if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        const nestedClassName = `${className}${capitalize(key)}`
        return `      ${key}: ${nestedClassName}.fromJson(json['${key}'] as Map<String, dynamic>),`
      } else if (Array.isArray(value) && value.length > 0 && typeof value[0] === "object" && value[0] !== null) {
        const itemClassName = `${className}${capitalize(key)}Item`
        return `      ${key}: (json['${key}'] as List<dynamic>)
          .map((e) => ${itemClassName}.fromJson(e as Map<String, dynamic>))
          .toList(),`
      } else if (Array.isArray(value)) {
        return `      ${key}: (json['${key}'] as List<dynamic>).cast<${getFlutterType(value[0] || "dynamic")}>(),`
      } else {
        return `      ${key}: json['${key}'] as ${getFlutterType(value)},`
      }
    })
    .join("\n")

  // Generate toJson with proper formatting
  const toJsonParams = Object.entries(json)
    .map(([key, value]) => {
      if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        return `      '${key}': ${key}.toJson(),`
      } else if (Array.isArray(value) && value.length > 0 && typeof value[0] === "object" && value[0] !== null) {
        return `      '${key}': ${key}.map((e) => e.toJson()).toList(),`
      } else {
        return `      '${key}': ${key},`
      }
    })
    .join("\n")

  const mainClass = `class ${className} {
${fields}

  ${className}({${constructorParams}});

  factory ${className}.fromJson(Map<String, dynamic> json) {
    return ${className}(
${fromJsonParams}
    );
  }

  Map<String, dynamic> toJson() {
    return {
${toJsonParams}
    };
  }
}`

  if (nestedClasses.length > 0) {
    return `${nestedClasses.join("\n\n")}\n\n${mainClass}`
  }

  return mainClass
}

/**
 * Get Flutter type for a primitive value
 */
function getFlutterType(value: any): string {
  if (value === null) return "dynamic"
  if (typeof value === "string") return "String"
  if (typeof value === "number") {
    return Number.isInteger(value) ? "int" : "double"
  }
  if (typeof value === "boolean") return "bool"
  return "dynamic"
}

/**
 * Get Flutter field type for any value
 */
function getFlutterFieldType(value: any, className: string): string {
  if (value === null) return "dynamic"
  if (typeof value === "string") return "String"
  if (typeof value === "number") {
    return Number.isInteger(value) ? "int" : "double"
  }
  if (typeof value === "boolean") return "bool"

  if (Array.isArray(value)) {
    if (value.length === 0) return "List<dynamic>"
    const sample = value[0]
    if (typeof sample === "object" && sample !== null) {
      return `List<${className}Item>`
    }
    return `List<${getFlutterType(sample)}>`
  }

  if (typeof value === "object") return className

  return "dynamic"
}
