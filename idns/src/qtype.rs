use std::fmt::{self, Display, Formatter};

/// DNS 记录类型 / DNS record type
#[derive(Debug, Clone, Copy, Default)]
#[repr(u16)]
pub enum QType {
  #[default]
  A = 1,
  Ns = 2,
  Md = 3, // 过时
  Mf = 4, // 过时
  Cname = 5,
  Soa = 6,
  Mb = 7,
  Mg = 8,
  Mr = 9,
  Null = 10, // 过时
  Wks = 11,
  Ptr = 12,
  Hinfo = 13,
  Minfo = 14,
  Mx = 15,
  Txt = 16,
  Rp = 17,
  Afsdb = 18,
  X25 = 19,
  Isdn = 20,
  Rt = 21,
  Nsap = 22,
  NsapPtr = 23,
  Sig = 24,
  Key = 25,
  Px = 26,
  Gpos = 27,
  Aaaa = 28,
  Loc = 29,
  Nxt = 30, // 过时
  Eid = 31,
  Nimloc = 32,
  Srv = 33,
  Atma = 34,
  Naptr = 35,
  Kx = 36,
  Cert = 37,
  A6 = 38, // 实验性
  Dname = 39,
  Sink = 40,
  Opt = 41, // EDNS0 选项
  Apl = 42,
  Ds = 43,
  Sshfp = 44,
  Ipseckey = 45,
  Rrsig = 46,
  Nsec = 47,
  Dnskey = 48,
  Dhcid = 49,
  Nsec3 = 50,
  Nsec3param = 51,
  Tlsa = 52,
  Smimea = 53,
  Unused = 54, // 未使用
  Hip = 55,
  Ninfo = 56,
  Rkey = 57,
  Talink = 58,
  Cds = 59,
  Cdnskey = 60,
  Openpgpkey = 61,
  Csync = 62,
  Zonemd = 63,
  Svcb = 64,
  Https = 65,
  Spf = 99,
  Uinfo = 100,  // 保留
  Uid = 101,    // 保留
  Gid = 102,    // 保留
  Unspec = 103, // 保留
  Nid = 104,
  L32 = 105,
  L64 = 106,
  Lp = 107,
  Eui48 = 108,
  Eui64 = 109,
  Tkey = 249,
  Tsig = 250,
  Ixfr = 251,
  Axfr = 252,
  Mailb = 253, // 过时
  Maila = 254, // 过时
  Any = 255,   // 所有记录
}

impl Display for QType {
  fn fmt(&self, f: &mut Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}
