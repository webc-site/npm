export const type = "nested.Outer",
  modName = "nested/Outer",
  pbPayload = {
    inner: { code: 200, msg: "success" },
    list: [
      { code: 1, msg: "item1" },
      { code: 2, msg: "item2" }
    ]
  },
  payload = [
    [pbPayload.inner.code, pbPayload.inner.msg],
    pbPayload.list.map((i) => [i.code, i.msg])
  ];
