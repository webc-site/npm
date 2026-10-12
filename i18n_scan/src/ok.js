export default async (promise) => {
  try {
    await promise;
    return 1;
  } catch (err) {
    return err;
  }
};
