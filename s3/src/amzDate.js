export default () => {
  const d = new Date(),
    pad = (n) => String(n).padStart(2, "0"),
    date_only = [d.getUTCFullYear(), pad(d.getUTCMonth() + 1), pad(d.getUTCDate())].join(""),
    time_only = [pad(d.getUTCHours()), pad(d.getUTCMinutes()), pad(d.getUTCSeconds())].join("");

  return [date_only, date_only + "T" + time_only + "Z"];
};
