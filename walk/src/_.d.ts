export const DIR: 1;
export const FILE: 2;

declare const walk: (
  dir: string,
  parse: (
    kind: typeof DIR | typeof FILE,
    path: string,
  ) => boolean | Promise<boolean> | void | Promise<void>,
  concurrency?: number,
) => Promise<void>;

export default walk;
