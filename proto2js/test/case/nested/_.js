const item = ({ code, msg }) => [code, msg];

export const type = "nested.Outer",
  mod_name = "nested/Outer",
  pb_payload = {
    inner: { code: 200, msg: "success" },
    list: [
      { code: 1, msg: "item1" },
      { code: 2, msg: "item2" }
    ]
  },
  payload = [item(pb_payload.inner), pb_payload.list.map(item)];
