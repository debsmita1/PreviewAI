import { execSync } from "node:child_process";
import { request } from "node:http";

export async function ensureOllamaRunning(model: string = "llama3:latest") {
  // Check if Ollama is installed
  try {
    execSync("ollama --version", { stdio: "ignore" });
  } catch {
    console.error(`
❌ Ollama is not installed.

The review assistant requires Ollama to run locally.
Install it from: https://ollama.com/download

Once installed, run:
    ollama serve
`);
    process.exit(1);
  }

  // Check if Ollama is running
  const isRunning = await new Promise<boolean>((resolve) => {
    const req = request(
      { method: "GET", host: "localhost", port: 11434, timeout: 1000 },
      () => resolve(true)
    );
    req.on("error", () => resolve(false));
    req.on("timeout", () => {
      req.destroy();
      resolve(false);
    });
    req.end();
  });

  if (!isRunning) {
    console.error(`
⚠️  Ollama is installed but not running.

Please start it by running:
    ollama serve

Then re-run this script.
`);
    process.exit(1);
  }

  // Check if the specified model is loaded/available
  const modelAvailable = await new Promise<boolean>((resolve) => {
    const req = request(
      {
        method: "GET",
        host: "localhost",
        port: 11434,
        path: "/api/tags",
        timeout: 2000,
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const tags = JSON.parse(data);
            const found = tags.models?.some((m: any) => m.name === model);
            resolve(!!found);
          } catch {
            resolve(false);
          }
        });
      }
    );
    req.on("error", () => resolve(false));
    req.on("timeout", () => {
      req.destroy();
      resolve(false);
    });
    req.end();
  });
  if (!modelAvailable) {
    console.error(`
⚠️  Ollama is running, but the model "${model}" is not loaded.

To load it, run:
    ollama pull ${model}

and then start Ollama again with:
    ollama serve

Then re-run this script.
`);
    process.exit(1);
  }
}
