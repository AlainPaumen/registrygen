import AjvModule, { type AnySchema, type AnySchemaObject, type ErrorObject, type ValidateFunction } from "ajv";
import draft7MetaSchema from "ajv/dist/refs/json-schema-draft-07.json" with { type: "json" };

import type { RegistryJsonDocument } from "./buildRegistryJson.js";

type AjvConstructor = typeof AjvModule.default;
const AjvClass: AjvConstructor = (AjvModule as unknown as { default: AjvConstructor }).default;

const validatorCache = new Map<string, ValidateFunction>();
const schemaCache = new Map<string, AnySchemaObject>();

function normalizeSchema(schema: AnySchema): AnySchemaObject {
    if (schema === true) {
        return {};
    }
    if (schema === false) {
        return { not: {} };
    }
    return schema;
}

async function fetchSchema(schemaUrl: string): Promise<AnySchemaObject> {
    if (schemaCache.has(schemaUrl)) {
        return schemaCache.get(schemaUrl)!;
    }

    const response = await fetch(schemaUrl);
    if (!response.ok) {
        throw new Error(`Failed to download schema from ${schemaUrl}: ${response.status} ${response.statusText}`);
    }

    const schemaJson = (await response.json()) as AnySchema;
    const normalized = normalizeSchema(schemaJson);
    schemaCache.set(schemaUrl, normalized);
    return normalized;
}

const ajv = new AjvClass({
    allErrors: true,
    strict: false,
    meta: false,
    loadSchema: fetchSchema,
});

const META_SCHEMA_IDS = [
    "http://json-schema.org/draft-07/schema",
    "http://json-schema.org/draft-07/schema#",
    "https://json-schema.org/draft-07/schema",
    "https://json-schema.org/draft-07/schema#",
];

for (const id of META_SCHEMA_IDS) {
    if (!ajv.getSchema(id)) {
        ajv.addMetaSchema({ ...draft7MetaSchema, $id: id });
    }
}

async function getValidator(schemaUrl: string): Promise<ValidateFunction> {
    const cachedValidator = validatorCache.get(schemaUrl);
    if (cachedValidator) {
        return cachedValidator;
    }

    const schema = await fetchSchema(schemaUrl);
    const validate = await ajv.compileAsync(schema);
    validatorCache.set(schemaUrl, validate);
    return validate;
}

export type ValidationResult =
    | { valid: true }
    | {
        valid: false;
        errors: ErrorObject[];
    };

export async function validateRegistryJson(document: RegistryJsonDocument): Promise<ValidationResult> {
    const validator = await getValidator(document.$schema);
    const isValid = validator(document);
    if (isValid) {
        return { valid: true };
    }

    return {
        valid: false,
        errors: validator.errors ?? [],
    };
}
