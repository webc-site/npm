import { DIR, FILE } from "./_.js";

declare const walkRelIgnore: (
  dir: string,
  parse: (
    kind: typeof DIR | typeof FILE,
    path: string
  ) => boolean | Promise<boolean> | void | Promise<void>,
  concurrency?: number
) => Promise<void>;

export default walkRelIgnore;
