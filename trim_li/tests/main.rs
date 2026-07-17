use aok::{OK, Void};
use log::info;
use trim_li::trim_li;

#[static_init::constructor(0)]
extern "C" fn _log_init() {
  log_init::init();
}

#[test]
fn test_trim_li() -> Void {
  info!("Running trim_li and restore tests (unified \\n)...");

  // 辅助函数，测试 trim_li 后的非空行内容以及还原后的文本（统一以 \n 还原）
  let check = |input: &str, expected_li: Vec<&str>, expected_restored: &str| {
    let (restore, li) = trim_li(input);
    let li_strs: Vec<&str> = li.iter().map(|s| s.as_str()).collect();
    assert_eq!(li_strs, expected_li);
    let restored = restore.load(&li).unwrap();
    assert_eq!(restored.as_str(), expected_restored);
  };

  // 1. 空白/全空行测试
  check("", vec![], "");
  check("   ", vec![], "");
  check("\n", vec![], "");
  check("\r", vec![], "");
  check("\r\n", vec![], "");
  check(" \n \r \r\n ", vec![], "");

  // 2. 普通单行与多行
  check("foo", vec!["foo"], "foo");
  check("  foo  ", vec!["  foo"], "  foo");
  check("foo\nbar", vec!["foo", "bar"], "foo\nbar");
  check("foo\rbar", vec!["foo", "bar"], "foo\nbar");
  check("foo\r\nbar", vec!["foo", "bar"], "foo\nbar");

  // 3. 尾部空白与空行过滤
  check("foo  \nbar  ", vec!["foo", "bar"], "foo\nbar");
  check("  foo  \r  bar  ", vec!["  foo", "  bar"], "  foo\n  bar");
  check("  foo  \r\n  bar  ", vec!["  foo", "  bar"], "  foo\n  bar");

  // 4. 中间空行（在 li 中不存在，但还原后存在且去除了尾缩进，统一使用 \n）
  check("foo\n\nbar", vec!["foo", "bar"], "foo\n\nbar");
  check("foo\r\rbar", vec!["foo", "bar"], "foo\n\nbar");
  check("foo\r\n\r\nbar", vec!["foo", "bar"], "foo\n\nbar");
  check("foo\r\n\nbar", vec!["foo", "bar"], "foo\n\nbar");

  // 5. 尾部空行（完全被 trim 掉）
  check("foo\nbar\n", vec!["foo", "bar"], "foo\nbar");
  check("foo\nbar\n\n", vec!["foo", "bar"], "foo\nbar");
  check("foo\nbar\n   \n ", vec!["foo", "bar"], "foo\nbar");

  // 6. 各种组合
  check("foo\n \r", vec!["foo"], "foo");
  check("foo\n\r", vec!["foo"], "foo");
  check("foo\r\n\r", vec!["foo"], "foo");
  check("foo\r\n\n", vec!["foo"], "foo");
  check("foo\n\r\nbar\r\n\r", vec!["foo", "bar"], "foo\n\nbar");
  check("\r\n\r\nfoo", vec!["foo"], "\n\nfoo");
  check("\r\n\r\nfoo\n\r\n", vec!["foo"], "\n\nfoo");

  // UTF-8
  check("你好\r\n世界\r", vec!["你好", "世界"], "你好\n世界");
  check("你好\r世界\n", vec!["你好", "世界"], "你好\n世界");
  check("你好\n\r世界", vec!["你好", "世界"], "你好\n\n世界");
  check(
    "🦀\n\r\n\r   \n   \r\n🐙",
    vec!["🦀", "🐙"],
    "🦀\n\n\n\n\n🐙",
  );

  // 混合复杂场景
  check(
    "  foo  \r\n  \r\n  bar  \n\n  ",
    vec!["  foo", "  bar"],
    "  foo\n\n  bar",
  );

  // 7. 测试 load 传入修改后的内容
  let (restore, li) = trim_li("  foo  \n  \n  bar  \n\n  ");
  assert_eq!(li.len(), 2);
  let modified_li = vec![
    hipstr::HipStr::borrowed("  FOO"),
    hipstr::HipStr::borrowed("  BAR"),
  ];
  let restored = restore.load(&modified_li).unwrap();
  assert_eq!(restored.as_str(), "  FOO\n\n  BAR");

  // 长度不一致返回 None
  let invalid_li = vec![hipstr::HipStr::borrowed("  FOO")];
  assert!(restore.load(&invalid_li).is_none());

  // 测试 From / Into 序列化与反序列化
  let serialized: Vec<u8> = restore.clone().into();
  let deserialized = trim_li::Restore::from(&serialized[..]);
  assert_eq!(restore, deserialized);

  let deserialized_vec = trim_li::Restore::from(serialized);
  assert_eq!(restore, deserialized_vec);

  info!("All trim_li and restore tests passed!");
  OK
}

fn reference_trim_and_restore(s: &str) -> String {
  let s_unified = s.replace("\r\n", "\n").replace('\r', "\n");
  let mut lines: Vec<&str> = s_unified.split('\n').map(|l| l.trim_end()).collect();
  while let Some(last) = lines.last() {
    if last.is_empty() {
      lines.pop();
    } else {
      break;
    }
  }
  lines.join("\n")
}

use proptest::{
  collection::vec,
  prelude::{ProptestConfig, any},
  prop_oneof, proptest,
  strategy::{Just, Strategy},
};

proptest! {
  #![proptest_config(ProptestConfig::with_cases(500))]

  #[test]
  fn test_trim_li_any_string(s in any::<String>()) {
    let (restore, li) = trim_li(&s);
    for line in &li {
      assert!(!line.is_empty(), "li should not contain empty lines: {li:?} for input {s:?}");
      assert_eq!(line.trim_end(), line.as_str(), "li elements should be right-trimmed: {line:?} for input {s:?}");
    }

    let restored = restore.load(&li).unwrap();
    let expected = reference_trim_and_restore(&s);
    assert_eq!(restored.as_str(), expected.as_str(), "restore failed for input {s:?}");
  }

  #[test]
  fn test_trim_li_custom_whitespace(s in vec(
    prop_oneof![
      Just('a'), Just('b'), Just(' '), Just('\t'), Just('\r'), Just('\n')
    ],
    0..100
  ).prop_map(|chars| chars.into_iter().collect::<String>())) {
    let (restore, li) = trim_li(&s);
    for line in &li {
      assert!(!line.is_empty(), "li should not contain empty lines: {li:?} for input {s:?}");
      assert_eq!(line.trim_end(), line.as_str(), "li elements should be right-trimmed: {line:?} for input {s:?}");
    }

    let restored = restore.load(&li).unwrap();
    let expected = reference_trim_and_restore(&s);
    assert_eq!(restored.as_str(), expected.as_str(), "restore failed for input {s:?}");
  }
}
