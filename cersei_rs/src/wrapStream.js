export default (stream) => {
  stream[Symbol.asyncIterator] = () => ({
    next: async () => {
      const val = await stream.next();
      return val === null || val === undefined
        ? { value: undefined, done: true }
        : { value: val, done: false };
    }
  });
  return stream;
};
