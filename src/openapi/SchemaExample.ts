import {RefResolver} from "./RefResolver";
import {OpenAPIV3} from "openapi-types";

class SchemaExampleBuilder {
    private visitedRefs: Set<string> = new Set<string>();

    constructor(private resolver: RefResolver, refs?: Set<string>) {
        if (refs)
            this.visitedRefs = new Set([...refs])
    }

    build(schema: OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject, guessDefault: boolean = false): any {
        let refs: string[] | undefined;
        [schema, refs] = this.resolver.resolveRef(schema);

        let example: any = undefined;

        if (refs) {
            // Prevent infinite recursion
            for (const ref of refs) {
                if (this.visitedRefs.has(ref)) {
                    return {};
                }
                this.visitedRefs.add(ref);
            }
        }

        if (schema.example !== undefined) {
            return schema.example;
        }

        if (schema.default !== undefined) {
            return schema.default;
        }

        if ('oneOf' in schema) {
            return this.build(schema.oneOf!![0], guessDefault);
        }

        if ('allOf' in schema) {
            const examples = schema.allOf!!.map((s) => this.build(s, true));
            example = Object.assign({}, ...examples);
        }

        if (schema.properties) {
            const obj: any = example ?? {};
            for (const key in schema.properties) {
                obj[key] = (new SchemaExampleBuilder(this.resolver, this.visitedRefs)).build(schema.properties[key], true);
            }
            example = obj;
        }

        if (example) {
            return example;
        }

        if (schema.enum) {
            return schema.enum[0];
        }

        if ('items' in schema && schema.items) {
            if (schema.type === 'array' && schema.items && (schema.items as OpenAPIV3.SchemaObject).enum) {
                return (schema.items as OpenAPIV3.SchemaObject).enum;
            }
            return [this.build(schema.items, true) ?? "string"];
        }

        // In 3.1 schema.type can be an array
        let type = (schema.type && typeof schema.type !== "string") ? schema.type[0] : schema.type;
        if (type && guessDefault) {
            switch (type) {
                case 'boolean':
                    return true;
                case 'string':
                    return generateString(schema);
                case 'object':
                    return {};
                case 'array':
                    return []
                case 'number':
                case 'integer':
                    if (schema.maximum || schema.minimum || schema.exclusiveMinimum || schema.exclusiveMaximum || schema.multipleOf) {
                        return generateNumberWithConstraints(schema);
                    }
                    return generateNumberWithConstraints(schema);
                default: // null for OpenAPI 3.1
                    return null;
            }
        }
        return undefined;
    }
}

const generateString = (schema: OpenAPIV3.SchemaObject) => {
    const {format} = schema;

    switch (format) {
        case 'uuid':
            return "3fa85f64-5717-4562-b3fc-2c963f66afa6";
    }
    return "string";
}


function generateNumberWithConstraints(schema: OpenAPIV3.SchemaObject) {
    const {minimum, maximum, exclusiveMinimum, exclusiveMaximum} = schema;
    const {multipleOf} = schema;
    let defaultNumber = 0;
    switch (schema.format) {
        case 'int32':
            defaultNumber = (2 ** 30) >>> 0;
            break;
        case 'int64':
            defaultNumber = 2 ** 53 - 1;
            break;
        case 'float':
        case 'double':
            defaultNumber = 0.1;
            break;
    }

    const epsilon = Number.isInteger(defaultNumber) ? 1 : Number.EPSILON;
    let minValue = typeof minimum === "number" ? minimum : null;
    let maxValue = typeof maximum === "number" ? maximum : null;
    let constrainedNumber = defaultNumber;

    if (typeof exclusiveMinimum === "number") {
        minValue =
            minValue !== null
                ? Math.max(minValue, exclusiveMinimum + epsilon)
                : exclusiveMinimum + epsilon;
    }
    if (typeof exclusiveMaximum === "number") {
        maxValue =
            maxValue !== null
                ? Math.min(maxValue, exclusiveMaximum - epsilon)
                : exclusiveMaximum - epsilon;
    }
    constrainedNumber =
        (minValue as any > (maxValue as any) && defaultNumber) || minValue || maxValue || constrainedNumber;

    if (typeof multipleOf === "number" && multipleOf > 0) {
        const remainder = constrainedNumber % multipleOf;
        constrainedNumber =
            remainder === 0
                ? constrainedNumber
                : constrainedNumber + multipleOf - remainder;
    }

    return constrainedNumber;
}

export class SchemaExample {
    private resolver: RefResolver;

    constructor(doc: any) {
        this.resolver = new RefResolver(doc);
    }

    extractExample(schema: OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject): any {
        return new SchemaExampleBuilder(this.resolver).build(schema);
    }
}
