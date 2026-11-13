#!/usr/bin/env bun

import { bench, run } from "mitata";
import indentTxtLi from "../src/indentTxtLi.js";
import splitTrim from "./splitTrim.js";

const small_txt = "  line 1\n    line 2\n  line 3",
  large_txt = "  line\n".repeat(1000),
  long_line_txt = ("  " + "a".repeat(500) + "   \n").repeat(100);

bench("indentTxtLi (small)", () => {
  indentTxtLi(small_txt);
});

bench("splitTrim (small)", () => {
  splitTrim(small_txt);
});

bench("indentTxtLi (large)", () => {
  indentTxtLi(large_txt);
});

bench("splitTrim (large)", () => {
  splitTrim(large_txt);
});

bench("indentTxtLi (long lines)", () => {
  indentTxtLi(long_line_txt);
});

bench("splitTrim (long lines)", () => {
  splitTrim(long_line_txt);
});

await run();
