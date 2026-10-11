export const create: (callback: (name: string, arguments: string[]) => string) => object;
export const evaluate: (handle: object, source: string, filename: string) => string;
export const call: (handle: object, name: string, arguments: string[]) => string;
export const destroy: (handle: object) => void;
