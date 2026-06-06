"use server";

import fs from "node:fs";
import path from "node:path";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getRateWindow, recordRequest } from "@/lib/rateLimit";
import { RATE_LIMIT_TOKEN } from "@/lib/constants";

/**
 * The Architecture Sentinel — vets a drafted code/markdown block against the
 * master `.codexrules` rulebook via Gemini Flash.
 *
 * It is a strict linter: it never rewrites the code or offers conversational
 * advice. It returns terminal-style violation logs citing the exact rule + line,
 * or `[ CODE VETTED : ZERO VIOLATIONS ]` on a pass. Advisory only — the editor
 * can still Save when the Sentinel flags something.
 */

const PASS_TOKEN = "[ CODE VETTED : ZERO VIOLATIONS ]";

function readRules(): string {
  try {
    return fs.readFileSync(path.join(process.cwd(), ".codexrules"), "utf8");
  } catch {
    return "(no .codexrules file found)";
  }
}

export async function vetCode(code: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not set. Add it to app-projects/.env.local and restart the dev server."
    );
  }
  if (!code.trim()) return PASS_TOKEN;

  if (getRateWindow().remaining <= 0) throw new Error(RATE_LIMIT_TOKEN);
  recordRequest();

  const systemInstruction = `You are an unyielding Architecture Sentinel for the Developer Codex.

Compare the provided code/markdown STRICTLY against the rules below. Behave like
a linter, not an assistant:
- Do NOT rewrite or fix the code. Do NOT offer conversational advice or praise.
- For each violation, emit ONE terminal-style log line in the form:
  ERR  <rule-number>  L<line>  <short reason>
  (use the line number within the provided snippet; cite the exact rule).
- If and only if there are zero violations, output exactly: ${PASS_TOKEN}
- Output nothing else.

=== .codexrules ===
${readRules()}`;

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction,
  });

  const result = await model.generateContent(code);
  return result.response.text().trim();
}
