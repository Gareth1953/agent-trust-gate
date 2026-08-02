import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

export type JsonSchema = Record<string, unknown>;

export interface JsonSchemaValidationResult {
  valid: boolean;
  errors: readonly string[];
}

export function validateJsonSchemaFile(schemaPath: string, value: unknown): JsonSchemaValidationResult {
  const absolute = resolve(schemaPath);
  const schema = readJsonSchema(absolute);
  const errors = errorsFor(schema, value, "$", absolute, schema);
  return { valid: errors.length === 0, errors };
}

export function validateJsonSchema(schema: JsonSchema, value: unknown): JsonSchemaValidationResult {
  const errors = errorsFor(schema, value, "$", "<inline-schema>", schema);
  return { valid: errors.length === 0, errors };
}

function errorsFor(
  schema: JsonSchema,
  value: unknown,
  path: string,
  schemaPath: string,
  rootSchema: JsonSchema,
): string[] {
  if (typeof schema.$ref === "string") {
    const [filePart = "", fragment = ""] = schema.$ref.split("#", 2);
    const referencedPath = filePart === "" ? schemaPath : resolve(dirname(schemaPath), filePart);
    const referencedRoot = filePart === "" ? rootSchema : readJsonSchema(referencedPath);
    const referenced = resolveJsonPointer(referencedRoot, fragment);
    return errorsFor(referenced, value, path, referencedPath, referencedRoot);
  }

  const errors: string[] = [];
  if (Array.isArray(schema.allOf)) {
    for (const candidate of schema.allOf) {
      if (isRecord(candidate)) errors.push(...errorsFor(candidate, value, path, schemaPath, rootSchema));
    }
  }
  if (Array.isArray(schema.anyOf)) {
    const matches = schema.anyOf.filter((candidate) =>
      isRecord(candidate) && errorsFor(candidate, value, path, schemaPath, rootSchema).length === 0
    );
    if (matches.length === 0) errors.push(`${path} must match at least one schema`);
  }
  if (Array.isArray(schema.oneOf)) {
    const matches = schema.oneOf.filter((candidate) =>
      isRecord(candidate) && errorsFor(candidate, value, path, schemaPath, rootSchema).length === 0
    );
    if (matches.length !== 1) errors.push(`${path} must match exactly one schema`);
  }
  if (isRecord(schema.not) && errorsFor(schema.not, value, path, schemaPath, rootSchema).length === 0) {
    errors.push(`${path} must not match the excluded schema`);
  }
  if (Object.hasOwn(schema, "const") && !deepEqual(value, schema.const)) {
    errors.push(`${path} must equal const`);
  }
  if (Array.isArray(schema.enum) && !schema.enum.some((candidate) => deepEqual(candidate, value))) {
    errors.push(`${path} must match enum`);
  }
  if (!matchesSchemaType(schema.type, value)) {
    errors.push(`${path} has wrong type`);
    return errors;
  }

  if (isRecord(value)) {
    const properties = isRecord(schema.properties) ? schema.properties : {};
    const required = Array.isArray(schema.required)
      ? schema.required.filter((field): field is string => typeof field === "string")
      : [];
    for (const field of required) {
      if (!Object.hasOwn(value, field)) errors.push(`${path}.${field} is required`);
    }
    if (schema.additionalProperties === false) {
      for (const field of Object.keys(value)) {
        if (!Object.hasOwn(properties, field)) errors.push(`${path}.${field} is not allowed`);
      }
    } else if (isRecord(schema.additionalProperties)) {
      for (const [field, child] of Object.entries(value)) {
        if (!Object.hasOwn(properties, field)) {
          errors.push(...errorsFor(
            schema.additionalProperties,
            child,
            `${path}.${field}`,
            schemaPath,
            rootSchema,
          ));
        }
      }
    }
    for (const [field, childSchema] of Object.entries(properties)) {
      if (Object.hasOwn(value, field) && isRecord(childSchema)) {
        errors.push(...errorsFor(childSchema, value[field], `${path}.${field}`, schemaPath, rootSchema));
      }
    }
    const propertyCount = Object.keys(value).length;
    if (typeof schema.minProperties === "number" && propertyCount < schema.minProperties) {
      errors.push(`${path} has too few properties`);
    }
    if (typeof schema.maxProperties === "number" && propertyCount > schema.maxProperties) {
      errors.push(`${path} has too many properties`);
    }
  }

  if (Array.isArray(value)) {
    if (typeof schema.minItems === "number" && value.length < schema.minItems) {
      errors.push(`${path} has too few items`);
    }
    if (typeof schema.maxItems === "number" && value.length > schema.maxItems) {
      errors.push(`${path} has too many items`);
    }
    if (schema.uniqueItems === true) {
      const encoded = value.map(stableEncode);
      if (new Set(encoded).size !== encoded.length) errors.push(`${path} must contain unique items`);
    }
    if (isRecord(schema.items)) {
      value.forEach((item, index) => {
        errors.push(...errorsFor(schema.items as JsonSchema, item, `${path}[${index}]`, schemaPath, rootSchema));
      });
    }
  }

  if (typeof value === "string") {
    if (typeof schema.minLength === "number" && value.length < schema.minLength) {
      errors.push(`${path} is too short`);
    }
    if (typeof schema.maxLength === "number" && value.length > schema.maxLength) {
      errors.push(`${path} is too long`);
    }
    if (typeof schema.pattern === "string" && !new RegExp(schema.pattern).test(value)) {
      errors.push(`${path} pattern mismatch`);
    }
    if (schema.format === "date" && !isDate(value)) errors.push(`${path} is not a date`);
    if (schema.format === "date-time" && !isDateTime(value)) errors.push(`${path} is not date-time`);
    if (schema.format === "uri" && !isUri(value)) errors.push(`${path} is not a URI`);
  }

  if (typeof value === "number") {
    if (typeof schema.minimum === "number" && value < schema.minimum) errors.push(`${path} is below minimum`);
    if (typeof schema.maximum === "number" && value > schema.maximum) errors.push(`${path} is above maximum`);
    if (typeof schema.exclusiveMinimum === "number" && value <= schema.exclusiveMinimum) {
      errors.push(`${path} is not above exclusive minimum`);
    }
    if (typeof schema.exclusiveMaximum === "number" && value >= schema.exclusiveMaximum) {
      errors.push(`${path} is not below exclusive maximum`);
    }
  }

  return errors;
}

function resolveJsonPointer(root: JsonSchema, fragment: string): JsonSchema {
  if (fragment === "") return root;
  return fragment.replace(/^\//, "").split("/").reduce<unknown>((value, segment) => {
    if (!isRecord(value)) throw new Error(`Invalid schema pointer #${fragment}`);
    return value[segment.replace(/~1/g, "/").replace(/~0/g, "~")];
  }, root) as JsonSchema;
}

function matchesSchemaType(type: unknown, value: unknown): boolean {
  if (type === undefined) return true;
  if (Array.isArray(type)) return type.some((candidate) => matchesSchemaType(candidate, value));
  if (type === "null") return value === null;
  if (type === "object") return isRecord(value);
  if (type === "array") return Array.isArray(value);
  if (type === "string") return typeof value === "string";
  if (type === "boolean") return typeof value === "boolean";
  if (type === "number") return typeof value === "number" && Number.isFinite(value);
  if (type === "integer") return Number.isSafeInteger(value);
  return true;
}

function readJsonSchema(path: string): JsonSchema {
  const value = JSON.parse(readFileSync(path, "utf8")) as unknown;
  if (!isRecord(value)) throw new Error(`JSON Schema must be an object: ${path}`);
  return value;
}

function isDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

function isDateTime(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}T/.test(value) && !Number.isNaN(Date.parse(value));
}

function isUri(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol.length > 1;
  } catch {
    return false;
  }
}

function deepEqual(left: unknown, right: unknown): boolean {
  return stableEncode(left) === stableEncode(right);
}

function stableEncode(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableEncode).join(",")}]`;
  if (isRecord(value)) {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableEncode(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
