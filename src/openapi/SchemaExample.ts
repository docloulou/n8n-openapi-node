import {RefResolver} from "./RefResolver";
import {OpenAPIV3} from "openapi-types";

class SchemaExampleBuilder {
    private visitedRefs: Set<string> = new Set<string>();

    constructor(private resolver: RefResolver) {
    }

    build(schema: OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject): any {
        let refs: string[] | undefined
        [schema, refs] = this.resolver.resolveRef(schema)

        let example: any = undefined

        if (refs) {
            // Prevent infinite recursion
            for (const ref of refs) {
                if (this.visitedRefs.has(ref)) {
                    return {}
                }
                this.visitedRefs.add(ref);
            }
        }
        if ('oneOf' in schema) {
            return this.build(schema.oneOf!![0]);
        }
        if (schema.example !== undefined) {
            return schema.example;
        }
        if ('allOf' in schema) {
            const examples = schema.allOf!!.map((s) => this.build(s));
            example = Object.assign({}, ...examples);
        }

        if (schema.default !== undefined) {
            return schema.default;
        }
        if (schema.properties) {
            const obj: any = example ?? {};
            for (const key in schema.properties) {
                obj[key] = this.build(schema.properties[key]);
            }
            example = obj;
        }
        if (schema.enum) {
            return schema.enum[0];
        }
        if ('items' in schema && schema.items) {
            return [this.build(schema.items)];
        }
        if (example) {
            return example;
        }
        // In 3.1 schema.type can be an array
        let type = (schema.type && typeof schema.type !== "string") ? schema.type[0] : schema.type;
        if (type) {
            switch (type) {
                case 'boolean':
                    return true;
                case 'string':
                    return '';
                case 'object':
                    return {};
                case 'array':
                    return [];
                case 'number':
                case 'integer':
                    return 0;
                default: // null for OpenAPI 3.1
                    return null;
            }
        }
        return undefined;
    }
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
