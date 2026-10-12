import z85e from "../src/z85e.js";

const size_encode = 1000000,
  size_decode = 1000000,
  data_large = crypto.getRandomValues(new Uint8Array(size_encode)),
  raw_for_decode = crypto.getRandomValues(new Uint8Array((size_decode / 5) * 4)),
  encoded_large = z85e(raw_for_decode),
  data_16 = crypto.getRandomValues(new Uint8Array(16)),
  raw_16_for_decode = crypto.getRandomValues(new Uint8Array(16)),
  encoded_20 = z85e(raw_16_for_decode),
  data_32 = crypto.getRandomValues(new Uint8Array(32)),
  raw_32_for_decode = crypto.getRandomValues(new Uint8Array(32)),
  encoded_40 = z85e(raw_32_for_decode);

export default [
  ["Z85 Encoding (1MB)", { type: "encode", bytes: data_large }],
  ["Z85 Decoding (1MB)", { type: "decode", bytes: encoded_large }],
  ["Z85 Encoding (16B)", { type: "encode", bytes: data_16 }],
  ["Z85 Decoding (20B)", { type: "decode", bytes: encoded_20 }],
  ["Z85 Encoding (32B)", { type: "encode", bytes: data_32 }],
  ["Z85 Decoding (40B)", { type: "decode", bytes: encoded_40 }]
];
