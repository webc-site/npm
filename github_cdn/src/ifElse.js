/*
捕获执行异常并转入错误回调
run: 正常执行的异步/同步函数
onErr: 异常处理回调 (err, ...args) => ...
*/
export default (run, onErr) =>
  async (...args) => {
    try {
      return await run(...args);
    } catch (err) {
      return await onErr(err, ...args);
    }
  };
