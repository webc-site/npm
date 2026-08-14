export default (funcA, funcB) =>
  async (...args) => {
    try {
      return await funcA(...args);
    } catch (err) {
      return await funcB(err, ...args);
    }
  };
