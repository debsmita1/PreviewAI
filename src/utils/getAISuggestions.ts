import { request } from "http";
import { gitReviewExamples } from "./gitReviewExamples";
import { CustomPromptType } from "../types";

export async function getAISuggestions(
  diff: string,
  customPrompt?: CustomPromptType
): Promise<string> {
  let reviewExamplesPrompt = "";
  if (
    customPrompt?.dataMineContext?.remoteUrl &&
    customPrompt?.dataMineContext?.githubToken
  ) {
    const reviewExamples = await gitReviewExamples(
      customPrompt.dataMineContext.remoteUrl,
      customPrompt.dataMineContext.githubToken,
      customPrompt.dataMineContext.maxExamples
    );
    reviewExamples.forEach((example) => {
      reviewExamplesPrompt += `Commit message: ${example.comment}\n`;
      reviewExamplesPrompt += `Diff:\n${example.diff}\n`;
      reviewExamplesPrompt += `---\n\n`;
    });
  }
  let prompt = `
You are a **${
    customPrompt?.prompt?.reviewerRole ?? "senior frontend engineer AI reviewer"
  }**.  
For the following code diff, provide **structured, actionable feedback in Markdown format**.
`;

  if (reviewExamplesPrompt) {
    prompt += `Learn from Past Reviews
Below are historical review comments and diffs from this repository.  
They reflect the **tone, priorities, and feedback style** received in reviews.
Follow their phrasing, but ensure your feedback includes actionable Git-style diffs.

${reviewExamplesPrompt} `;
  }

  prompt += `${
    customPrompt?.prompt?.reviewCriteria ??
    `Review for:
1. High priority issues (security, performance, unnecessary re-renders, large data processing in render)
2. Medium priority issues (best practices, maintainability, readability, Missing try/catch around API calls, async/await, reading or writing to localStorage, React anti-patterns, Misuse of useEffect, Identify if the new code changes introduce imports from large or heavy libraries)
3. Low priority issues (Suggest missed best practices)

For each issue, provide:
- Description
- Why it’s important
- Suggestion with Git-style code diff snippets
- Ignore suggestions for code in test files, focus on production code.`
  }
  
  ${
    customPrompt?.prompt?.testCriteria ??
    `Based on the provided **diff only**, propose test cases for uncovered changes specifically.  
- Generate **Jest + React Testing Library test code** for unit cases.  
- Cover **edge cases, error states, and expected happy paths**.  
- Output tests as **ready-to-use code blocks**, not plain text.`
  }
  
  ${
    customPrompt?.prompt?.outputFormat ??
    `Consider the following output format:
Structure content as:
  1. **High Priority Issues**
  2. **Medium Priority Issues**
  3. **Low Priority Issues**
  4. **Generated Test Code**`
  }
  
  Code Diff to Review
\`\`\`diff
${diff}
\`\`\`


Notes for your review: 
${
  customPrompt?.prompt?.otherNotes ??
  `- Keep feedback **constructive, concise, and actionable**.
   - Match the **tone and style** from historical reviews.
   - Respect repo conventions (imports, hooks usage, test expectations). 
   - Example Format (you MUST follow this)
      
    ❌ Bad (just text):
    > "Consider wrapping API call in try/catch."

    ✅ Good (with Git-style diff):
    \`\`\`diff
    - const data = await fetchData();
    + try {
    +   const data = await fetchData();
    + } catch (error) {
    +   console.error("API fetch failed", error);
    + }
    \`\`\`
  `
}
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
