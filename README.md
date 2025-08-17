# PreviewAI 🔍🤖

*A lightweight AI-powered code review assistant for your PRs*

PreviewAI runs on your **staged changes** or **last commit** and generates **actionable AI suggestions** before you open a Pull Request. With PreviewAI, you can tailor reviews to your specific tech stack, enforce team conventions, and even run everything locally using your local LLM. Think of it as an **AI-powered pre-PR code reviewer** that helps you catch potential improvements earlier, making the PR review process faster.

Note: It’s not meant to replace your existing AI coding assistants; instead, it works as a complementary tool for teams who want deeper control, and customizability in their review process.

---

## ✨ Features

- 🔎 Analyzes **staged changes**, **last commit**, or a specific **git revision/range**.
- 🤖 Generates **AI-powered review suggestions** using your custom prompts.
- 🛠 Tailors reviews for specific tech stacks.
- 🧠 Fetches review comments from the origin repo’s PRs and uses them as few-shot examples for In-Context Learning, enabling PreviewAI to adapt naturally to your team’s review style.
- 📄 Saves results into `.code-review/code-review.md` inside your repo.
- 🔒 Privacy-preserving, makes use of your local LLM.

---

## 📦 Usage

PreviewAI is executed through a shell script (run-review.sh) that wraps around a TypeScript runner.

### Modes

- staged → Review only staged changes (default, but falls back to last commit if `staged` changes are not found).

- commit → Review last commit.

- `<rev>` → Review specific revision/range (e.g. HEAD~1..HEAD).

```bash
git clone https://github.com/debsmita1/PreviewAI.git
cd PreviewAI
npm run review -- --repo </path/to/target-repo-in-your-local> --mode [mode]
```

#### Examples

```
# Review only staged changes (falls back to last commit, if no staged changes are found)
npm run review -- --repo ~/Documents/community-plugins --mode staged

# Review last commit
npm run review -- --repo ~/Documents/community-plugins --mode commit

# Review a specific range
npm run review -- --repo ~/Documents/community-plugins --mode HEAD~3..HEAD

```

### Custom prompts

You can configure PreviewAI’s reviewer behavior using a `custom-prompt.json` file.

#### Field Explanations

| Parent              | Field          | Required / Optional                 | Description                                                | Example / Default                                                                                          |
| ------------------- | -------------- | ----------------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| **prompt**          | reviewerRole   | Optional                            | Defines the persona of the AI reviewer.                    | Example: "Senior Frontend Engineer" <br> Default: "senior frontend engineer AI reviewer"                   |
|                     | reviewCriteria | Optional                            | Defines what aspects of code the AI should focus on.       | Example: "Code quality, performance, security, and maintainability"                                        |
|                     | testCriteria   | Optional                            | Defines how the AI should generate tests.                  | Example: "Generate Jest + React Testing Library tests for edge cases"                                      |
|                     | outputFormat   | Optional                            | Controls the structure of the review output.               | Example: "1. High Priority Issues 2. Medium Priority Issues 3. Low Priority Issues 4. Suggested Test Code" |
|                     | otherNotes     | Optional                            | Any additional notes for the AI to keep in mind.           | Example: "Focus on performance optimizations and security best practices"                                  |
| **dataMineContext** | remoteUrl      | Required (if using dataMineContext) | GitHub repository URL to fetch historical review comments. | Example: "[https://github.com/your-org/your-repo](https://github.com/your-org/your-repo)"                  |
|                     | githubToken    | Required (if using dataMineContext) | Your GitHub personal access token with repo read access.   | —                                                                                                          |
|                     | maxExamples    | Optional                            | How many historical review comments to fetch.              | Default: 100                                                                                               |


Example custom-prompt.json

```custom-prompt.json
{
  "prompt: {
    "reviewerRole": "Senior Frontend Engineer",
    "reviewCriteria": "Focus on code quality, performance, security, and maintainability. Flag common pitfalls such as missing null checks, unhandled promises, or unnecessary re-renders in React.",
    "testCriteria": "Generate Jest + React Testing Library tests for new features and edge cases.",
    "outputFormat": "Structure review output as: 1. High Priority Issues 2. Medium Priority Issues 3. Low Priority Issues 4. Suggested Test Code",
    "otherNotes": "Pay special attention to performance optimizations and security best practices.",
  },
  "dataMineContext": {
    "remoteUrl": "https://github.com/your-org/your-repo",
    "githubToken": "ghp_your_github_token",
    "maxExamples": 200
  }
}

```

#### Examples

```
# Review with a custom prompt
npm run review -- --repo ~/Documents/community-plugins --prompt <path-to>/custom-prompt.json
```

If `dataMineContext` is set, PreviewAI will fetch and cache` your team’s past review comments from GitHub and use them as few-shot examples, making the AI naturally align with the review style.

## 📂 Output

All reviews are stored in:

```
<your-repo>/.code-review/code-review.md
```

You can open it in VS Code with preview mode:

```
Cmd+Shift+V (Mac) / Ctrl+Shift+V (Windows/Linux)
```
