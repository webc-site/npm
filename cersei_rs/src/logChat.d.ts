export default function (
  base_url: string,
  api_key: string,
  model: string
): (prompt: string, working_dir: string) => Promise<string>;
