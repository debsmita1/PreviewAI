import { request } from "http";

export async function getAISuggestions(
  diff: string,
): Promise<string> {
  const prompt = `
You are a senior frontend engineer AI reviewer. For the following code diff, provide:
Review for:
1. High priority issues (security, performance, unnecessary re-renders, large data processing in render)
2. Medium priority issues (best practices, maintainability, readability, Missing try/catch around API calls, async/await, reading or writing to localStorage, React anti-patterns, Misuse of useEffect, Identify if the new code changes introduce imports from large or heavy libraries)
3. Low priority issues (Suggest missed best practices)

For each issue, provide:
- Description
- Why it’s important
- Suggestion with code snippets when possible

Then suggest tests for uncovered changes specifically.

Here is the code diff:
${diff}
`;

  const data = JSON.stringify({
    model: "llama3",
    prompt: prompt,
    stream: false,
  });

  const options = {
    hostname: "localhost",
    port: 11434,
    path: "/api/generate",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(data),
    },
  };

  return new Promise<string>((resolve, reject) => {
    const req = request(options, (res) => {
      let chunks: Buffer[] = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        const result = Buffer.concat(chunks).toString();
        try {
          const parsed = JSON.parse(result);
          resolve(parsed.response || "No response from Ollama.");
        } catch (e) {
          resolve("Error parsing Ollama response: " + result);
        }
      });
    });

    req.on("error", (err) => {
      resolve("Error calling Ollama: " + err.message);
    });

    req.write(data);
    req.end();
  });
}
