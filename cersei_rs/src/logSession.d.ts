export default function (
  base_url: string,
  api_key: string,
  model: string,
  working_dir: string,
  history?: { role: string; content: string }[] | null
): (prompt: string) => Promise<string>;
