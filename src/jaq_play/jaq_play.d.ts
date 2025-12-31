
export default function init(module_or_path?: string | Request | URL | Promise<unknown>): Promise<unknown>;
export function initSync(module: WebAssembly.Module): unknown;
export function run(filter: string, input: string, settings: any, scope: any): void;
