import {N8NPropertiesBuilder} from "../src/N8NPropertiesBuilder";
import {INodeProperties} from "n8n-workflow";

test('petstore.json', () => {
    const doc = require('./samples/jsonapi-openapi.json');
    const config = {}
    const parser = new N8NPropertiesBuilder(doc, config);
    const result = parser.build()

    const expected: INodeProperties[] =  [
        {
            "displayName": "Resource",
            "name": "resource",
            "type": "options",
            "noDataExpression": true,
            "options": [
                {
                    "name": "Model",
                    "value": "Model",
                    "description": "Endpoints for the `Model` resource."
                }
            ],
            "default": ""
        },
        {
            "displayName": "Operation",
            "name": "operation",
            "type": "options",
            "noDataExpression": true,
            "displayOptions": {
                "show": {
                    "resource": [
                        "Model"
                    ]
                }
            },
            "options": [
                {
                    "name": "Create Model",
                    "value": "Create Model",
                    "action": "Create a new model",
                    "description": "Creates a new model resource with the provided data.",
                    "routing": {
                        "request": {
                            "encoding": "json",
                            "json": true,
                            "method": "POST",
                            "url": "=/model/"
                        }
                    }
                }
            ],
            "default": ""
        },
        {
            "displayName": "POST /model/",
            "name": "operation",
            "type": "notice",
            "typeOptions": {
                "theme": "info"
            },
            "default": "",
            "displayOptions": {
                "show": {
                    "resource": [
                        "Model"
                    ],
                    "operation": [
                        "Create Model"
                    ]
                }
            }
        },
        {
            "displayName": "Fields Model",
            "name": "fields%5Bmodel%5D",
            "description": "Specifies which fields should be returned.",
            "default": [
                "componentType", "count",
                    "array",
                    "modelType",
                    "subModel",
                    "view",
                    "name"
            ],
            "type": "multiOptions",
            "options": [
                {
                    "name": "Component Type",
                    "value": "componentType"
                },
                {
                    "name": "Count",
                    "value": "count"
                },
                {
                    "name": "Array",
                    "value": "array"
                },
                {
                    "name": "Model Type",
                    "value": "modelType"
                },
                {
                    "name": "Sub Model",
                    "value": "subModel"
                },
                {
                    "name": "View",
                    "value": "view"
                },
                {
                    "name": "Name",
                    "value": "name"
                }
            ],
            "routing": {
                "send": {
                    "type": "query",
                    "property": "fields[model]",
                    "value": "={{ $value.join(',') }}",
                    "propertyInDotNotation": false
                }
            },
            "displayOptions": {
                "show": {
                    "resource": [
                        "Model"
                    ],
                    "operation": [
                        "Create Model"
                    ]
                }
            }
        },
        {
            "displayName": "Include",
            "name": "include",
            "description": "Specifies which related resources should be returned.",
            "default": [
                "view", "subModel"
            ],
            "type": "multiOptions",
            "options": [
                {
                    "name": "View",
                    "value": "view"
                },
                {
                    "name": "Sub Model",
                    "value": "subModel"
                }
            ],
            "routing": {
                "send": {
                    "type": "query",
                    "property": "include",
                    "value": "={{ $value.join(',') }}",
                    "propertyInDotNotation": false
                }
            },
            "displayOptions": {
                "show": {
                    "resource": [
                        "Model"
                    ],
                    "operation": [
                        "Create Model"
                    ]
                }
            }
        },
        {
            "required": true,
            "displayName": "Data",
            "name": "data",
            "type": "json",
            "default": "{\n  \"type\": \"model\",\n  \"attributes\": {\n    \"byteOffset\": 0,\n    \"componentType\": 0,\n    \"count\": 1073741824,\n    \"type\": \"TYPE_A\",\n    \"array\": [\n      \"string\"\n    ],\n    \"name\": \"string\"\n  },\n  \"relationships\": {\n    \"view\": null,\n    \"subModel\": null\n  }\n}",
            "routing": {
                "send": {
                    "property": "data",
                    "propertyInDotNotation": false,
                    "type": "body",
                    "value": "={{ JSON.parse($value) }}"
                }
            },
            "displayOptions": {
                "show": {
                    "resource": [
                        "Model"
                    ],
                    "operation": [
                        "Create Model"
                    ]
                }
            }
        }
    ]

    expect(result).toEqual(expected);
})
