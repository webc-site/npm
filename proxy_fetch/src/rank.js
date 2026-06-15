import int from "@3-/int";
import nowts from "@3-/nowts";

const BASE_SCORE = 10000n,
  HACKER_NEWS_G = 2.0;

/*
oked: 成功次数
failed: 失败次数
cts: 创建时间戳
返回值: 排序分数
*/
export default (oked, failed, cts) => {
  const ok = int(oked),
    fail = int(failed),
    total = ok + fail;

  if (total === 0) {
    return BASE_SCORE;
  }

  const success_rate = ok / total,
    age_hours = Math.max(0, (nowts() - int(cts)) / 3600),
    hn_score = success_rate / (age_hours + 2) ** HACKER_NEWS_G,
    score = Math.floor(hn_score * 1000000);

  return BigInt(score);
};
