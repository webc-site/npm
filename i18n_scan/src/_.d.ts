export type RelUpdate = [
  0 | 1, // from_is_update (source file update status)
  string[], // to_lang updates (updated target languages)
  string[], // missing target languages
];

export interface ResultTree {
  [prefix: string]: {
    [rel: string]: RelUpdate;
  };
}

export interface UpsertFunction {
  (rel_path: string): Promise<void>;
  [Symbol.dispose]?(): void;
}

export const OPT_DIR: 0;
export const OPT_EXT: 1;

export type ConfigItem = [0, string[]] | [1, string[]];

export type Callback = (
  prefix: string,
  rel: string,
  from_lang: string,
  to_lang: string,
  log: (...args: any[]) => void,
) => Promise<void> | void;

declare function i18nScan(
  root: string,
  db_path: string,
  from: string,
  to_li: string[],
  update_cache: Callback,
  tran: Callback,
  conf_li?: ConfigItem[],
): Promise<void>;

export default i18nScan;
