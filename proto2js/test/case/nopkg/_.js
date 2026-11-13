export const type = "CallLi",
  mod_name = "CallLi",
  pb_payload = {
    li: [
      { id: 100, url: "http://test", args: new Uint8Array([1, 2, 3]) },
      { id: 200, url: "http://api", args: new Uint8Array([4, 5]) }
    ]
  },
  payload = [
    [
      [100, "http://test", new Uint8Array([1, 2, 3])],
      [200, "http://api", new Uint8Array([4, 5])]
    ]
  ];
