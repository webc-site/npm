export type RelUpdate = [
  0 | 1, // from_is_update (source file update status)
  string[], // to_lang updates (updated target languages)
  string[] // missing target languages
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

export type Callback = (
  prefix: string,
  rel: string,
  from_lang: string,
  to_lang: string,
  log: (...args: any[]) => void,
  src_md5?: Uint8Array
) => Promise<void> | void;

declare function i18nScan(
  root: string,
  db_dir: string,
  from: string,
  to_li: string[],
  updateCache: Callback,
  tran: Callback,
  i18n_dir_name_li?: string[],
  ext_li?: string[]
): Promise<void>;

export default i18nScan;
