/**
 * Typert host 清单：dsh-typert-loader 自动发现本包 exports["./typert"]，
 * 校验后注册进 `ctx.typert`，把 `notes` 远程的 schema 与调用描述
 * 交给 Typert Gateway（客户端据此获得 `remote.notes` 命名空间）。
 */
export declare const TYPERT: {
    package: string;
    face: "host";
    schemas: never[];
    model: {
        services: {
            description: string;
            summary: string;
            tags: never[];
            jsDoc: string;
            key: string;
            exportName: string;
            members: {
                kind: string;
                name: string;
                signature: string;
                summary: string;
                jsDoc: string;
            }[];
            types: {
                name: string;
                declaration: string;
            }[];
        }[];
        events: never[];
        objects: never[];
    };
    invocations: ({
        readonly id: "dsh-ui#notes/list";
        readonly service: "notes";
        readonly namespace: "notes";
        readonly method: "list";
        readonly invocation: {
            readonly kind: "direct";
        };
        readonly parameters: {
            name: string;
            wire: string;
            source: "json";
            codec: {
                mode: "strict";
                typeSymbol: string;
                schema: import("zod").ZodType<unknown, unknown, import("zod/v4/core").$ZodTypeInternals<unknown, unknown>>;
            };
        }[];
        readonly result: {
            mode: "strict";
            typeSymbol: string;
            schema: import("zod").ZodType<unknown, unknown, import("zod/v4/core").$ZodTypeInternals<unknown, unknown>>;
        };
        readonly sourceLocation: {
            readonly file: "src/notes/service.ts";
            readonly line: 1;
            readonly column: 1;
        };
    } | {
        readonly id: "dsh-ui#notes/get";
        readonly service: "notes";
        readonly namespace: "notes";
        readonly method: "get";
        readonly invocation: {
            readonly kind: "direct";
        };
        readonly parameters: {
            name: string;
            wire: string;
            source: "json";
            codec: {
                mode: "strict";
                typeSymbol: string;
                schema: import("zod").ZodType<unknown, unknown, import("zod/v4/core").$ZodTypeInternals<unknown, unknown>>;
            };
        }[];
        readonly result: {
            mode: "strict";
            typeSymbol: string;
            schema: import("zod").ZodType<unknown, unknown, import("zod/v4/core").$ZodTypeInternals<unknown, unknown>>;
        };
        readonly sourceLocation: {
            readonly file: "src/notes/service.ts";
            readonly line: 2;
            readonly column: 1;
        };
    } | {
        readonly id: "dsh-ui#notes/create";
        readonly service: "notes";
        readonly namespace: "notes";
        readonly method: "create";
        readonly invocation: {
            readonly kind: "direct";
        };
        readonly parameters: {
            name: string;
            wire: string;
            source: "json";
            codec: {
                mode: "strict";
                typeSymbol: string;
                schema: import("zod").ZodType<unknown, unknown, import("zod/v4/core").$ZodTypeInternals<unknown, unknown>>;
            };
        }[];
        readonly result: {
            mode: "strict";
            typeSymbol: string;
            schema: import("zod").ZodType<unknown, unknown, import("zod/v4/core").$ZodTypeInternals<unknown, unknown>>;
        };
        readonly sourceLocation: {
            readonly file: "src/notes/service.ts";
            readonly line: 3;
            readonly column: 1;
        };
    } | {
        readonly id: "dsh-ui#notes/update";
        readonly service: "notes";
        readonly namespace: "notes";
        readonly method: "update";
        readonly invocation: {
            readonly kind: "direct";
        };
        readonly parameters: {
            name: string;
            wire: string;
            source: "json";
            codec: {
                mode: "strict";
                typeSymbol: string;
                schema: import("zod").ZodType<unknown, unknown, import("zod/v4/core").$ZodTypeInternals<unknown, unknown>>;
            };
        }[];
        readonly result: {
            mode: "strict";
            typeSymbol: string;
            schema: import("zod").ZodType<unknown, unknown, import("zod/v4/core").$ZodTypeInternals<unknown, unknown>>;
        };
        readonly sourceLocation: {
            readonly file: "src/notes/service.ts";
            readonly line: 4;
            readonly column: 1;
        };
    } | {
        readonly id: "dsh-ui#notes/delete";
        readonly service: "notes";
        readonly namespace: "notes";
        readonly method: "delete";
        readonly invocation: {
            readonly kind: "direct";
        };
        readonly parameters: {
            name: string;
            wire: string;
            source: "json";
            codec: {
                mode: "strict";
                typeSymbol: string;
                schema: import("zod").ZodType<unknown, unknown, import("zod/v4/core").$ZodTypeInternals<unknown, unknown>>;
            };
        }[];
        readonly result: {
            mode: "strict";
            typeSymbol: string;
            schema: import("zod").ZodType<unknown, unknown, import("zod/v4/core").$ZodTypeInternals<unknown, unknown>>;
        };
        readonly sourceLocation: {
            readonly file: "src/notes/service.ts";
            readonly line: 5;
            readonly column: 1;
        };
    } | {
        readonly id: "dsh-ui#files/list";
        readonly service: "files";
        readonly namespace: "files";
        readonly method: "list";
        readonly invocation: {
            readonly kind: "direct";
        };
        readonly parameters: {
            name: string;
            wire: string;
            source: "json";
            codec: {
                mode: "strict";
                typeSymbol: string;
                schema: import("zod").ZodType<unknown, unknown, import("zod/v4/core").$ZodTypeInternals<unknown, unknown>>;
            };
        }[];
        readonly result: {
            mode: "strict";
            typeSymbol: string;
            schema: import("zod").ZodType<unknown, unknown, import("zod/v4/core").$ZodTypeInternals<unknown, unknown>>;
        };
        readonly sourceLocation: {
            readonly file: "src/notes/files-service.ts";
            readonly line: 1;
            readonly column: 1;
        };
    } | {
        readonly id: "dsh-ui#files/upload";
        readonly service: "files";
        readonly namespace: "files";
        readonly method: "upload";
        readonly invocation: {
            readonly kind: "direct";
        };
        readonly parameters: {
            name: string;
            wire: string;
            source: "json";
            codec: {
                mode: "strict";
                typeSymbol: string;
                schema: import("zod").ZodType<unknown, unknown, import("zod/v4/core").$ZodTypeInternals<unknown, unknown>>;
            };
        }[];
        readonly result: {
            mode: "strict";
            typeSymbol: string;
            schema: import("zod").ZodType<unknown, unknown, import("zod/v4/core").$ZodTypeInternals<unknown, unknown>>;
        };
        readonly sourceLocation: {
            readonly file: "src/notes/files-service.ts";
            readonly line: 2;
            readonly column: 1;
        };
    } | {
        readonly id: "dsh-ui#files/get";
        readonly service: "files";
        readonly namespace: "files";
        readonly method: "get";
        readonly invocation: {
            readonly kind: "direct";
        };
        readonly parameters: {
            name: string;
            wire: string;
            source: "json";
            codec: {
                mode: "strict";
                typeSymbol: string;
                schema: import("zod").ZodType<unknown, unknown, import("zod/v4/core").$ZodTypeInternals<unknown, unknown>>;
            };
        }[];
        readonly result: {
            mode: "strict";
            typeSymbol: string;
            schema: import("zod").ZodType<unknown, unknown, import("zod/v4/core").$ZodTypeInternals<unknown, unknown>>;
        };
        readonly sourceLocation: {
            readonly file: "src/notes/files-service.ts";
            readonly line: 3;
            readonly column: 1;
        };
    } | {
        readonly id: "dsh-ui#files/getBytes";
        readonly service: "files";
        readonly namespace: "files";
        readonly method: "getBytes";
        readonly invocation: {
            readonly kind: "direct";
        };
        readonly parameters: {
            name: string;
            wire: string;
            source: "json";
            codec: {
                mode: "strict";
                typeSymbol: string;
                schema: import("zod").ZodType<unknown, unknown, import("zod/v4/core").$ZodTypeInternals<unknown, unknown>>;
            };
        }[];
        readonly result: {
            mode: "strict";
            typeSymbol: string;
            schema: import("zod").ZodType<unknown, unknown, import("zod/v4/core").$ZodTypeInternals<unknown, unknown>>;
        };
        readonly sourceLocation: {
            readonly file: "src/notes/files-service.ts";
            readonly line: 4;
            readonly column: 1;
        };
    } | {
        readonly id: "dsh-ui#files/delete";
        readonly service: "files";
        readonly namespace: "files";
        readonly method: "delete";
        readonly invocation: {
            readonly kind: "direct";
        };
        readonly parameters: {
            name: string;
            wire: string;
            source: "json";
            codec: {
                mode: "strict";
                typeSymbol: string;
                schema: import("zod").ZodType<unknown, unknown, import("zod/v4/core").$ZodTypeInternals<unknown, unknown>>;
            };
        }[];
        readonly result: {
            mode: "strict";
            typeSymbol: string;
            schema: import("zod").ZodType<unknown, unknown, import("zod/v4/core").$ZodTypeInternals<unknown, unknown>>;
        };
        readonly sourceLocation: {
            readonly file: "src/notes/files-service.ts";
            readonly line: 5;
            readonly column: 1;
        };
    })[];
};
export type TypertManifest = typeof TYPERT;
