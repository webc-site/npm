import { mock } from "bun:test";
import { Database } from "bun:sqlite";

mock.module("node:sqlite", () => ({
  DatabaseSync: class {
    constructor(path) {
      this.db = new Database(path === ":memory:" ? ":memory:" : path);
    }
    exec(sql) {
      this.db.run(sql);
    }
    prepare(sql) {
      try {
        const stmt = this.db.prepare(sql);
        return {
          run(...args) {
            try {
              return stmt.run(...args);
            } catch (err) {
              err.errcode = 1;
              throw err;
            }
          },
          all(...args) {
            try {
              return stmt.all(...args);
            } catch (err) {
              err.errcode = 1;
              throw err;
            }
          },
          get(...args) {
            try {
              return stmt.get(...args);
            } catch (err) {
              err.errcode = 1;
              throw err;
            }
          },
        };
      } catch (err) {
        err.errcode = 1;
        throw err;
      }
    }
    close() {
      this.db.close();
    }
  },
}));
