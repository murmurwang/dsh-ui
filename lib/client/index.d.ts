import type { ClientContext } from "@deepseek-ai/dsh-client-runtime/client";
/** 插件依赖的 ctx 服务（cordis fiber inject）。 */
export declare const inject: string[];
/**
 * 客户端插件主体。
 * @param ctx - 客户端根上下文。
 */
export declare function apply(ctx: ClientContext): void;
