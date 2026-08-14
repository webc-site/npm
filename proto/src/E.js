/*@__NO_SIDE_EFFECTS__*/
const metaSet = (func, wire_type = 0) => {
    func._w = wire_type;
    return func;
  },
  /*@__NO_SIDE_EFFECTS__*/
  packed = (encoder) => metaSet((li) => concat(li.map(encoder)), 2),
  /*@__NO_SIDE_EFFECTS__*/
  numPut = (byte_len, attr) => {
    attr = "set" + attr;
    return (val) => {
      const buf = new DataView(new ArrayBuffer(byte_len));
      buf[attr](0, val, true);
      return new Uint8Array(buf.buffer);
    };
  },
  TEXT = new TextEncoder(),
  utf8e = TEXT.encode.bind(TEXT),
  concat = (list) => {
    const total_len = list.reduce((len, arr) => len + arr.length, 0),
      result = new Uint8Array(total_len);
    let offset = 0;
    for (const arr of list) {
      result.set(arr, offset);
      offset += arr.length;
    }
    return result;
  },
  encodeTag = (field, wire) => uint32((field << 3) | wire),
  lengthDelimited = (encoder) => (val) => {
    const data = encoder(val);
    return concat([uint32(data.length), data]);
  };

export const uint32 = metaSet((val) => {
    const r = [];
    let i = 0;
    while (val >= 0x80) {
      r[i] = (val & 0x7f) | 0x80;
      ++i;
      val >>>= 7;
    }
    r[i] = val;
    return new Uint8Array(r);
  }),
  uint64 = metaSet((val) => {
    val = BigInt(val);
    const r = [];
    let i = 0;
    while (val >= 0x80n) {
      r[i] = Number(val & 0x7fn) | 0x80;
      ++i;
      val >>= 7n;
    }
    r[i] = Number(val);
    return new Uint8Array(r);
  }),
  int32 = metaSet((v) => uint64(BigInt.asUintN(64, BigInt(v)))),
  int64 = metaSet((v) => uint64(BigInt.asUintN(64, BigInt(v)))),
  sint32 = metaSet((val) => uint32(((val << 1) ^ (val >> 31)) >>> 0)),
  sint64 = metaSet((val) => {
    val = BigInt(val);
    return uint64((val << 1n) ^ (val >> 63n));
  }),
  double = metaSet(numPut(8, "Float64"), 1),
  float = metaSet(numPut(4, "Float32"), 5),
  fixed32 = metaSet(numPut(4, "Uint32"), 5),
  fixed64 = metaSet((v) => numPut(8, "BigUint64")(BigInt(v)), 1),
  sfixed32 = metaSet(numPut(4, "Int32"), 5),
  sfixed64 = metaSet((v) => numPut(8, "BigInt64")(BigInt(v)), 1),
  bool = metaSet((b) => new Uint8Array([b ? 1 : 0])),
  string = metaSet(utf8e, 2),
  bytes = metaSet((v) => v, 2),
  boolLi = packed(bool),
  doubleLi = packed(double),
  fixed32Li = packed(fixed32),
  fixed64Li = packed(fixed64),
  floatLi = packed(float),
  int32Li = packed(int32),
  int64Li = packed(int64),
  sfixed32Li = packed(sfixed32),
  sfixed64Li = packed(sfixed64),
  sint32Li = packed(sint32),
  sint64Li = packed(sint64),
  uint32Li = packed(uint32),
  uint64Li = packed(uint64),
  /*@__NO_SIDE_EFFECTS__*/
  map = (key_encoder, val_encoder) => {
    const key_wire_type = key_encoder._w ?? 0,
      val_wire_type = val_encoder._w ?? 2,
      key_tag = encodeTag(1, key_wire_type),
      val_tag = encodeTag(2, val_wire_type),
      key_data_encoder = key_wire_type === 2 ? lengthDelimited(key_encoder) : key_encoder,
      val_data_encoder = val_wire_type === 2 ? lengthDelimited(val_encoder) : val_encoder,
      map_entry_encoder = ([key, val]) => {
        const key_buf = concat([key_tag, key_data_encoder(key)]),
          val_buf = concat([val_tag, val_data_encoder(val)]);
        return concat([key_buf, val_buf]);
      };
    return [map_entry_encoder];
  },
  $ = (encode_li) => (val_li) =>
    concat(
      val_li.reduce((bufs, val, i) => {
        if (!val || ((val instanceof Uint8Array || Array.isArray(val)) && !val.length)) {
          return bufs;
        }

        const field = 1 + i,
          encoder = encode_li[i];

        if (Array.isArray(encoder)) {
          const e = encoder[0],
            wire_type = e._w ?? 2,
            tag = encodeTag(field, wire_type),
            data_encoder = wire_type === 2 ? lengthDelimited(e) : e,
            entry_bufs = val.map((item) => concat([tag, data_encoder(item)]));
          bufs.push(concat(entry_bufs));
        } else {
          const wire_type = encoder._w ?? 2,
            tag = encodeTag(field, wire_type),
            data_encoder = wire_type === 2 ? lengthDelimited(encoder) : encoder;
          bufs.push(concat([tag, data_encoder(val)]));
        }
        return bufs;
      }, [])
    );
