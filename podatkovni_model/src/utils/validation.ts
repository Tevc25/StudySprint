import { ValidationSchema } from '../models/schemas';

const primitiveTypeName = (value: unknown): string => {
  if (Array.isArray(value)) {
    return 'array';
  }
  return typeof value;
};

export const validateAgainstSchema = (
  payload: unknown,
  schema: ValidationSchema,
  allowUnknownFields = false
): string[] => {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return ['Body must be a JSON object.'];
  }

  const input = payload as Record<string, unknown>;
  const errors: string[] = [];

  for (const [fieldName, fieldSchema] of Object.entries(schema)) {
    const value = input[fieldName];

    if (value === undefined) {
      if (fieldSchema.required) {
        errors.push(`Field '${fieldName}' is required.`);
      }
      continue;
    }

    if (primitiveTypeName(value) !== fieldSchema.type) {
      errors.push(`Field '${fieldName}' must be of type ${fieldSchema.type}.`);
      continue;
    }

    if (fieldSchema.enumValues && !fieldSchema.enumValues.includes(value as string)) {
      errors.push(`Field '${fieldName}' must be one of: ${fieldSchema.enumValues.join(', ')}.`);
    }
  }

  if (!allowUnknownFields) {
    const allowedFields = new Set(Object.keys(schema));
    for (const key of Object.keys(input)) {
      if (!allowedFields.has(key)) {
        errors.push(`Unknown field '${key}'.`);
      }
    }
  }

  return errors;
};
