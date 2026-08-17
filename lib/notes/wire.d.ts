import { z } from "zod";
/**
 * 笔记 wire 契约：host TYPERT 清单与 client 远程贡献共享的
 * zod v4 schema 与 invocation descriptor 列表。
 */
export declare const noteClipSchema: z.ZodObject<{
    id: z.ZodString;
    text: z.ZodString;
    sessionId: z.ZodString;
    sessionTitle: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodNumber;
}, z.core.$strip>;
export declare const noteSchema: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    body: z.ZodString;
    clips: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        text: z.ZodString;
        sessionId: z.ZodString;
        sessionTitle: z.ZodOptional<z.ZodString>;
        createdAt: z.ZodNumber;
    }, z.core.$strip>>;
    version: z.ZodString;
    createdAt: z.ZodNumber;
    updatedAt: z.ZodNumber;
}, z.core.$strip>;
export declare const noteListItemSchema: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    clipCount: z.ZodNumber;
    bodyLength: z.ZodNumber;
    version: z.ZodString;
    createdAt: z.ZodNumber;
    updatedAt: z.ZodNumber;
}, z.core.$strip>;
export declare const listRequestSchema: z.ZodObject<{}, z.core.$strip>;
export declare const listResultSchema: z.ZodUnion<readonly [z.ZodObject<{
    ok: z.ZodLiteral<true>;
    value: z.ZodObject<{
        items: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            title: z.ZodString;
            clipCount: z.ZodNumber;
            bodyLength: z.ZodNumber;
            version: z.ZodString;
            createdAt: z.ZodNumber;
            updatedAt: z.ZodNumber;
        }, z.core.$strip>>;
    }, z.core.$strip>;
}, z.core.$strip>, z.ZodObject<{
    ok: z.ZodLiteral<false>;
    error: z.ZodUnion<readonly [z.ZodObject<{
        code: z.ZodLiteral<"not-found">;
        id: z.ZodString;
    }, z.core.$strip>, z.ZodObject<{
        code: z.ZodLiteral<"version-conflict">;
        current: z.ZodNullable<z.ZodObject<{
            id: z.ZodString;
            title: z.ZodString;
            body: z.ZodString;
            clips: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                text: z.ZodString;
                sessionId: z.ZodString;
                sessionTitle: z.ZodOptional<z.ZodString>;
                createdAt: z.ZodNumber;
            }, z.core.$strip>>;
            version: z.ZodString;
            createdAt: z.ZodNumber;
            updatedAt: z.ZodNumber;
        }, z.core.$strip>>;
    }, z.core.$strip>, z.ZodObject<{
        code: z.ZodLiteral<"invalid-argument">;
        message: z.ZodString;
    }, z.core.$strip>]>;
}, z.core.$strip>]>;
export declare const getRequestSchema: z.ZodObject<{
    id: z.ZodString;
}, z.core.$strip>;
export declare const getResultSchema: z.ZodUnion<readonly [z.ZodObject<{
    ok: z.ZodLiteral<true>;
    value: z.ZodObject<{
        note: z.ZodObject<{
            id: z.ZodString;
            title: z.ZodString;
            body: z.ZodString;
            clips: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                text: z.ZodString;
                sessionId: z.ZodString;
                sessionTitle: z.ZodOptional<z.ZodString>;
                createdAt: z.ZodNumber;
            }, z.core.$strip>>;
            version: z.ZodString;
            createdAt: z.ZodNumber;
            updatedAt: z.ZodNumber;
        }, z.core.$strip>;
    }, z.core.$strip>;
}, z.core.$strip>, z.ZodObject<{
    ok: z.ZodLiteral<false>;
    error: z.ZodUnion<readonly [z.ZodObject<{
        code: z.ZodLiteral<"not-found">;
        id: z.ZodString;
    }, z.core.$strip>, z.ZodObject<{
        code: z.ZodLiteral<"version-conflict">;
        current: z.ZodNullable<z.ZodObject<{
            id: z.ZodString;
            title: z.ZodString;
            body: z.ZodString;
            clips: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                text: z.ZodString;
                sessionId: z.ZodString;
                sessionTitle: z.ZodOptional<z.ZodString>;
                createdAt: z.ZodNumber;
            }, z.core.$strip>>;
            version: z.ZodString;
            createdAt: z.ZodNumber;
            updatedAt: z.ZodNumber;
        }, z.core.$strip>>;
    }, z.core.$strip>, z.ZodObject<{
        code: z.ZodLiteral<"invalid-argument">;
        message: z.ZodString;
    }, z.core.$strip>]>;
}, z.core.$strip>]>;
export declare const createRequestSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const createResultSchema: z.ZodUnion<readonly [z.ZodObject<{
    ok: z.ZodLiteral<true>;
    value: z.ZodObject<{
        note: z.ZodObject<{
            id: z.ZodString;
            title: z.ZodString;
            body: z.ZodString;
            clips: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                text: z.ZodString;
                sessionId: z.ZodString;
                sessionTitle: z.ZodOptional<z.ZodString>;
                createdAt: z.ZodNumber;
            }, z.core.$strip>>;
            version: z.ZodString;
            createdAt: z.ZodNumber;
            updatedAt: z.ZodNumber;
        }, z.core.$strip>;
    }, z.core.$strip>;
}, z.core.$strip>, z.ZodObject<{
    ok: z.ZodLiteral<false>;
    error: z.ZodUnion<readonly [z.ZodObject<{
        code: z.ZodLiteral<"not-found">;
        id: z.ZodString;
    }, z.core.$strip>, z.ZodObject<{
        code: z.ZodLiteral<"version-conflict">;
        current: z.ZodNullable<z.ZodObject<{
            id: z.ZodString;
            title: z.ZodString;
            body: z.ZodString;
            clips: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                text: z.ZodString;
                sessionId: z.ZodString;
                sessionTitle: z.ZodOptional<z.ZodString>;
                createdAt: z.ZodNumber;
            }, z.core.$strip>>;
            version: z.ZodString;
            createdAt: z.ZodNumber;
            updatedAt: z.ZodNumber;
        }, z.core.$strip>>;
    }, z.core.$strip>, z.ZodObject<{
        code: z.ZodLiteral<"invalid-argument">;
        message: z.ZodString;
    }, z.core.$strip>]>;
}, z.core.$strip>]>;
export declare const addClipSchema: z.ZodObject<{
    text: z.ZodString;
    sessionId: z.ZodString;
    sessionTitle: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const updateRequestSchema: z.ZodObject<{
    id: z.ZodString;
    ifVersion: z.ZodString;
    title: z.ZodOptional<z.ZodString>;
    body: z.ZodOptional<z.ZodString>;
    addClip: z.ZodOptional<z.ZodObject<{
        text: z.ZodString;
        sessionId: z.ZodString;
        sessionTitle: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    removeClipId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const updateResultSchema: z.ZodUnion<readonly [z.ZodObject<{
    ok: z.ZodLiteral<true>;
    value: z.ZodObject<{
        note: z.ZodObject<{
            id: z.ZodString;
            title: z.ZodString;
            body: z.ZodString;
            clips: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                text: z.ZodString;
                sessionId: z.ZodString;
                sessionTitle: z.ZodOptional<z.ZodString>;
                createdAt: z.ZodNumber;
            }, z.core.$strip>>;
            version: z.ZodString;
            createdAt: z.ZodNumber;
            updatedAt: z.ZodNumber;
        }, z.core.$strip>;
    }, z.core.$strip>;
}, z.core.$strip>, z.ZodObject<{
    ok: z.ZodLiteral<false>;
    error: z.ZodUnion<readonly [z.ZodObject<{
        code: z.ZodLiteral<"not-found">;
        id: z.ZodString;
    }, z.core.$strip>, z.ZodObject<{
        code: z.ZodLiteral<"version-conflict">;
        current: z.ZodNullable<z.ZodObject<{
            id: z.ZodString;
            title: z.ZodString;
            body: z.ZodString;
            clips: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                text: z.ZodString;
                sessionId: z.ZodString;
                sessionTitle: z.ZodOptional<z.ZodString>;
                createdAt: z.ZodNumber;
            }, z.core.$strip>>;
            version: z.ZodString;
            createdAt: z.ZodNumber;
            updatedAt: z.ZodNumber;
        }, z.core.$strip>>;
    }, z.core.$strip>, z.ZodObject<{
        code: z.ZodLiteral<"invalid-argument">;
        message: z.ZodString;
    }, z.core.$strip>]>;
}, z.core.$strip>]>;
export declare const deleteRequestSchema: z.ZodObject<{
    id: z.ZodString;
}, z.core.$strip>;
export declare const deleteResultSchema: z.ZodUnion<readonly [z.ZodObject<{
    ok: z.ZodLiteral<true>;
    value: z.ZodObject<{
        ok: z.ZodOptional<z.ZodLiteral<true>>;
        absent: z.ZodOptional<z.ZodLiteral<true>>;
    }, z.core.$strip>;
}, z.core.$strip>, z.ZodObject<{
    ok: z.ZodLiteral<false>;
    error: z.ZodUnion<readonly [z.ZodObject<{
        code: z.ZodLiteral<"not-found">;
        id: z.ZodString;
    }, z.core.$strip>, z.ZodObject<{
        code: z.ZodLiteral<"version-conflict">;
        current: z.ZodNullable<z.ZodObject<{
            id: z.ZodString;
            title: z.ZodString;
            body: z.ZodString;
            clips: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                text: z.ZodString;
                sessionId: z.ZodString;
                sessionTitle: z.ZodOptional<z.ZodString>;
                createdAt: z.ZodNumber;
            }, z.core.$strip>>;
            version: z.ZodString;
            createdAt: z.ZodNumber;
            updatedAt: z.ZodNumber;
        }, z.core.$strip>>;
    }, z.core.$strip>, z.ZodObject<{
        code: z.ZodLiteral<"invalid-argument">;
        message: z.ZodString;
    }, z.core.$strip>]>;
}, z.core.$strip>]>;
/** invocation descriptors（host 清单的 invocations / client 贡献的 descriptors 共用）。 */
export declare const NOTES_DESCRIPTORS: readonly [{
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
            schema: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
        };
    }[];
    readonly result: {
        mode: "strict";
        typeSymbol: string;
        schema: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
    };
    readonly sourceLocation: {
        readonly file: "src/notes/service.ts";
        readonly line: 1;
        readonly column: 1;
    };
}, {
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
            schema: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
        };
    }[];
    readonly result: {
        mode: "strict";
        typeSymbol: string;
        schema: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
    };
    readonly sourceLocation: {
        readonly file: "src/notes/service.ts";
        readonly line: 2;
        readonly column: 1;
    };
}, {
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
            schema: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
        };
    }[];
    readonly result: {
        mode: "strict";
        typeSymbol: string;
        schema: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
    };
    readonly sourceLocation: {
        readonly file: "src/notes/service.ts";
        readonly line: 3;
        readonly column: 1;
    };
}, {
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
            schema: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
        };
    }[];
    readonly result: {
        mode: "strict";
        typeSymbol: string;
        schema: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
    };
    readonly sourceLocation: {
        readonly file: "src/notes/service.ts";
        readonly line: 4;
        readonly column: 1;
    };
}, {
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
            schema: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
        };
    }[];
    readonly result: {
        mode: "strict";
        typeSymbol: string;
        schema: z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>;
    };
    readonly sourceLocation: {
        readonly file: "src/notes/service.ts";
        readonly line: 5;
        readonly column: 1;
    };
}];
