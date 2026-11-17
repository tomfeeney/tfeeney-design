const TRIAGE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    signalCount: { type: "number" },
    overallPriority: { type: "string", enum: ["High", "Medium", "Low"] },
    primaryOwner: { type: "string" },
    primaryImpact: { type: "string" },
    confidence: { type: "number" },
    summary: { type: "string" },
    nextStep: { type: "string" },
    why: { type: "string" },
    stats: {
      type: "object",
      additionalProperties: false,
      properties: {
        highCount: { type: "number" },
        mediumCount: { type: "number" },
        designCount: { type: "number" },
        engineeringCount: { type: "number" },
        customerCount: { type: "number" },
        lowConfidenceCount: { type: "number" },
        clusterCount: { type: "number" },
        duplicateGroupCount: { type: "number" }
      },
      required: ["highCount", "mediumCount", "designCount", "engineeringCount", "customerCount", "lowConfidenceCount", "clusterCount", "duplicateGroupCount"]
    },
    signals: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          id: { type: "number" },
          text: { type: "string" },
          source: { type: "string" },
          priority: { type: "string", enum: ["High", "Medium", "Low"] },
          priorityScore: { type: "number" },
          priorityReason: { type: "string" },
          owner: { type: "string" },
          ownerReason: { type: "string" },
          impact: { type: "string" },
          impactReason: { type: "string" },
          status: { type: "string" },
          signalConfidence: { type: "number" },
          evidence: { type: "array", items: { type: "string" } },
          openQuestions: { type: "array", items: { type: "string" } },
          clusterId: { type: "string" },
          clusterTitle: { type: "string" },
          clusterReason: { type: "string" },
          duplicateGroupId: { type: "string" }
        },
        required: [
          "id",
          "text",
          "source",
          "priority",
          "priorityScore",
          "priorityReason",
          "owner",
          "ownerReason",
          "impact",
          "impactReason",
          "status",
          "signalConfidence",
          "evidence",
          "openQuestions",
          "clusterId",
          "clusterTitle",
          "clusterReason",
          "duplicateGroupId"
        ]
      }
    },
    clusters: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          reason: { type: "string" },
          signalIds: { type: "array", items: { type: "number" } },
          signalCount: { type: "number" },
          priority: { type: "string", enum: ["High", "Medium", "Low"] },
          averageConfidence: { type: "number" },
          primaryOwner: { type: "string" },
          primaryImpact: { type: "string" },
          duplicateGroupId: { type: "string" }
        },
        required: ["id", "title", "reason", "signalIds", "signalCount", "priority", "averageConfidence", "primaryOwner", "primaryImpact", "duplicateGroupId"]
      }
    }
  },
  required: ["signalCount", "overallPriority", "primaryOwner", "primaryImpact", "confidence", "summary", "nextStep", "why", "stats", "signals", "clusters"]
};

const SYSTEM_PROMPT = `You are AI NCC-1701-alpha, an enterprise UX intelligence assistant for product, design, engineering, support, QA, research, data, and operations teams.

Analyze messy enterprise signals and return structured triage JSON only.

Rules:
- Preserve each original signal text in concise form. Do not invent facts outside the provided source material.
- Use the source field to identify where the signal came from when visible: Pasted Notes, Source URL, Uploaded File, or a specific source label.
- Assign priority using High, Medium, or Low.
- priorityScore must be 3 for High, 2 for Medium, and 1 for Low.
- Owner should usually be one of: Product, Design, Engineering, Support, QA, Operations, Security, Data Platform, Research.
- Impact should be concise: Revenue, Customer Experience, Operations, Safety / Risk, Engineering Quality, Data Quality, Accessibility, Compliance, or Workflow Efficiency.
- Status should be one of: Escalate, Needs Review, UX Review, Validate, Triage, Monitor, Backlog.
- signalConfidence is a number from 1 to 99 for that row.
- Group related or duplicate signals into clusters. Use stable clusterId strings and clear clusterTitle values.
- duplicateGroupId should be an empty string for singletons and a shared id for likely duplicate/multi-signal clusters.
- evidence should contain short evidence bullets from the source material.
- openQuestions should list what a human should verify before assignment.
- Be decisive but not alarmist.
- Explain reasoning briefly.
- Make the summary executive-ready.
- Make the nextStep concrete and action-oriented.
- Overall confidence is a number from 1 to 99.
- clusters should summarize the grouped patterns, their average confidence, priority, owners, impacts, and whether they are possible duplicates. The UI will derive risk scores, recommended workflow states, action plans, and review progress from the structured response.`;

const MAX_INPUT_CHARS = 120000;

function extractOutputText(data) {
  if (typeof data.output_text === "string") return data.output_text;
  const chunks = [];
  for (const item of data.output || []) {
    for (const content of item.content || []) {
      if (content.type === "output_text" && typeof content.text === "string") chunks.push(content.text);
    }
  }
  return chunks.join("\n").trim();
}

function normalizeSources(sources) {
  if (!Array.isArray(sources)) return [];
  return sources.slice(0, 25).map((source) => ({
    type: String(source.type || "unknown"),
    label: String(source.label || source.name || source.url || "source"),
    url: source.url ? String(source.url) : null,
    name: source.name ? String(source.name) : null,
    mimeType: source.mimeType ? String(source.mimeType) : null,
    size: Number(source.size || 0),
    extractable: Boolean(source.extractable)
  }));
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";

  if (!apiKey) return res.status(500).json({ error: "Missing OPENAI_API_KEY environment variable." });

  const signals = typeof req.body?.signals === "string" ? req.body.signals.trim() : "";
  if (!signals) return res.status(400).json({ error: "Missing signals text." });
  if (signals.length > MAX_INPUT_CHARS) return res.status(413).json({ error: `Signals text is too large. Limit is ${MAX_INPUT_CHARS} characters.` });

  const sources = normalizeSources(req.body?.sources);
  const sourceContext = sources.length ? `\n\nSource metadata:\n${JSON.stringify(sources, null, 2)}` : "";

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        input: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Analyze these enterprise UX sources and signals:\n\n${signals}${sourceContext}` }
        ],
        text: { format: { type: "json_schema", name: "ai_ncc_1701_triage_v1_8", strict: true, schema: TRIAGE_SCHEMA } }
      })
    });

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data.error?.message || "OpenAI API request failed.", details: data });

    const outputText = extractOutputText(data);
    if (!outputText) return res.status(502).json({ error: "OpenAI response did not include output text.", details: data });

    const analysis = JSON.parse(outputText);
    return res.status(200).json({ ...analysis, createdAt: new Date().toISOString(), mode: "api", model, version: "v1.8", sources });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Unexpected server error." });
  }
}
