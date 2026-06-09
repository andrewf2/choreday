import Anthropic from "@anthropic-ai/sdk";

// Mirrors the spec's AI response contract.
export type ItemStatus = "done" | "not_done" | "unclear";
export type OverallStatus = "pass" | "needs_work" | "fail";

export interface EvaluationItem {
  standard: string;
  status: ItemStatus;
  feedback: string;
}

export interface EvaluationResult {
  score: number;
  overallStatus: OverallStatus;
  items: EvaluationItem[];
}

export interface ChoreToEvaluate {
  name: string;
  description: string;
  definitionOfDone: string;
  standards: string[];
  childNote?: string | null;
}

export interface PhotoInput {
  data: string; // base64-encoded image bytes
  mediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp";
}

// Sonnet 4.6 is the default: capable at vision + structured output, and cheaper
// than Opus. Override via CHORE_AI_MODEL (e.g. "claude-haiku-4-5" for lowest cost,
// or "claude-opus-4-8" for maximum capability).
const MODEL = process.env.CHORE_AI_MODEL ?? "claude-sonnet-4-6";

const SYSTEM_PROMPT = `You are Chore Checker AI. A parent has defined a chore with a clear "definition of done" and a checklist of standards. A child has completed the chore and uploaded one or more photos as proof.

Your job is to evaluate the photo(s) against EACH standard, independently, based ONLY on visible evidence.

Rules you MUST follow:
- Judge each standard on its own. Do not let one standard's result influence another.
- Use only what is visible in the photo(s). Do not assume or infer beyond the evidence.
- If a standard cannot be verified from the image(s), return "unclear". NEVER assume failure for something you cannot see. "unclear" is not a failure — it means the photo does not show enough to decide.
- Return exactly one item per provided standard, in the same order, preserving the standard's text verbatim.
- Keep feedback short, concrete, and kind — one or two sentences aimed at a child.

Scoring:
- "score" is 0-100, your overall sense of how well the chore was completed based on the standards that could be verified.
- "overallStatus": "pass" if essentially all verifiable standards are done; "needs_work" if some are not done or several are unclear; "fail" if most verifiable standards are not done.

You are a helper, not the final authority — a parent reviews your assessment.`;

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    score: { type: "integer" },
    overallStatus: { type: "string", enum: ["pass", "needs_work", "fail"] },
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          standard: { type: "string" },
          status: { type: "string", enum: ["done", "not_done", "unclear"] },
          feedback: { type: "string" },
        },
        required: ["standard", "status", "feedback"],
        additionalProperties: false,
      },
    },
  },
  required: ["score", "overallStatus", "items"],
  additionalProperties: false,
} as const;

function buildPrompt(chore: ChoreToEvaluate): string {
  const standardsList = chore.standards
    .map((s, i) => `${i + 1}. ${s}`)
    .join("\n");
  const note = chore.childNote?.trim()
    ? `\n\nNote from the child:\n${chore.childNote.trim()}`
    : "";
  return `Chore: ${chore.name}
Description: ${chore.description || "(none)"}
Definition of done: ${chore.definitionOfDone || "(none)"}

Standards to evaluate (return one item per standard, in this order):
${standardsList}${note}

Evaluate the attached photo(s) against each standard now.`;
}

/**
 * Evaluate a chore submission against its standards using Claude vision.
 * Throws on API/parse failure — callers should handle and fall back to manual review.
 */
export async function evaluateSubmission(
  chore: ChoreToEvaluate,
  photos: PhotoInput[],
): Promise<EvaluationResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not set");
  }
  if (photos.length === 0) {
    throw new Error("At least one photo is required for evaluation");
  }

  const client = new Anthropic();

  const content: Anthropic.ContentBlockParam[] = [
    { type: "text", text: buildPrompt(chore) },
    ...photos.map(
      (p): Anthropic.ContentBlockParam => ({
        type: "image",
        source: { type: "base64", media_type: p.mediaType, data: p.data },
      }),
    ),
  ];

  // Adaptive thinking is a 4.6+ feature (Sonnet 4.6 / Opus 4.x); Haiku 4.5 rejects it.
  const supportsAdaptiveThinking = !MODEL.includes("haiku");

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4000,
    ...(supportsAdaptiveThinking
      ? { thinking: { type: "adaptive" as const } }
      : {}),
    system: SYSTEM_PROMPT,
    output_config: { format: { type: "json_schema", schema: RESPONSE_SCHEMA } },
    messages: [{ role: "user", content }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text block in AI response");
  }

  const parsed = JSON.parse(textBlock.text) as EvaluationResult;
  // Defensive clamp/shape — the schema guarantees structure, but keep score sane.
  parsed.score = Math.max(0, Math.min(100, Math.round(parsed.score)));
  return parsed;
}
