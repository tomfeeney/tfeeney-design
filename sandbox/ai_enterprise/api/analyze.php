<?php
declare(strict_types=1);
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['error' => 'Method not allowed']);
  exit;
}

$apiKey = getenv('OPENAI_API_KEY');
$model = getenv('OPENAI_MODEL') ?: 'gpt-4.1-mini';
$maxInputChars = 120000;

if (!$apiKey) {
  http_response_code(500);
  echo json_encode(['error' => 'Missing OPENAI_API_KEY environment variable.']);
  exit;
}

$body = json_decode(file_get_contents('php://input') ?: '{}', true);
$signals = trim((string)($body['signals'] ?? ''));

if ($signals === '') {
  http_response_code(400);
  echo json_encode(['error' => 'Missing signals text.']);
  exit;
}

if (strlen($signals) > $maxInputChars) {
  http_response_code(413);
  echo json_encode(['error' => 'Signals text is too large. Limit is '.$maxInputChars.' characters.']);
  exit;
}

$sourcesRaw = is_array($body['sources'] ?? null) ? $body['sources'] : [];
$sources = [];
foreach (array_slice($sourcesRaw, 0, 25) as $source) {
  if (!is_array($source)) continue;
  $sources[] = [
    'type' => (string)($source['type'] ?? 'unknown'),
    'label' => (string)($source['label'] ?? $source['name'] ?? $source['url'] ?? 'source'),
    'url' => isset($source['url']) ? (string)$source['url'] : null,
    'name' => isset($source['name']) ? (string)$source['name'] : null,
    'mimeType' => isset($source['mimeType']) ? (string)$source['mimeType'] : null,
    'size' => (float)($source['size'] ?? 0),
    'extractable' => (bool)($source['extractable'] ?? false)
  ];
}

$schemaJson = <<<'JSON'
{
  "type": "object",
  "additionalProperties": false,
  "properties": {
    "signalCount": {
      "type": "number"
    },
    "overallPriority": {
      "type": "string",
      "enum": [
        "High",
        "Medium",
        "Low"
      ]
    },
    "primaryOwner": {
      "type": "string"
    },
    "primaryImpact": {
      "type": "string"
    },
    "confidence": {
      "type": "number"
    },
    "summary": {
      "type": "string"
    },
    "nextStep": {
      "type": "string"
    },
    "why": {
      "type": "string"
    },
    "stats": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "highCount": {
          "type": "number"
        },
        "mediumCount": {
          "type": "number"
        },
        "designCount": {
          "type": "number"
        },
        "engineeringCount": {
          "type": "number"
        },
        "customerCount": {
          "type": "number"
        },
        "lowConfidenceCount": {
          "type": "number"
        },
        "clusterCount": {
          "type": "number"
        },
        "duplicateGroupCount": {
          "type": "number"
        }
      },
      "required": [
        "highCount",
        "mediumCount",
        "designCount",
        "engineeringCount",
        "customerCount",
        "lowConfidenceCount",
        "clusterCount",
        "duplicateGroupCount"
      ]
    },
    "signals": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "id": {
            "type": "number"
          },
          "text": {
            "type": "string"
          },
          "source": {
            "type": "string"
          },
          "priority": {
            "type": "string",
            "enum": [
              "High",
              "Medium",
              "Low"
            ]
          },
          "priorityScore": {
            "type": "number"
          },
          "priorityReason": {
            "type": "string"
          },
          "owner": {
            "type": "string"
          },
          "ownerReason": {
            "type": "string"
          },
          "impact": {
            "type": "string"
          },
          "impactReason": {
            "type": "string"
          },
          "status": {
            "type": "string"
          },
          "signalConfidence": {
            "type": "number"
          },
          "evidence": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "openQuestions": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "clusterId": {
            "type": "string"
          },
          "clusterTitle": {
            "type": "string"
          },
          "clusterReason": {
            "type": "string"
          },
          "duplicateGroupId": {
            "type": "string"
          }
        },
        "required": [
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
    "clusters": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "id": {
            "type": "string"
          },
          "title": {
            "type": "string"
          },
          "reason": {
            "type": "string"
          },
          "signalIds": {
            "type": "array",
            "items": {
              "type": "number"
            }
          },
          "signalCount": {
            "type": "number"
          },
          "priority": {
            "type": "string",
            "enum": [
              "High",
              "Medium",
              "Low"
            ]
          },
          "averageConfidence": {
            "type": "number"
          },
          "primaryOwner": {
            "type": "string"
          },
          "primaryImpact": {
            "type": "string"
          },
          "duplicateGroupId": {
            "type": "string"
          }
        },
        "required": [
          "id",
          "title",
          "reason",
          "signalIds",
          "signalCount",
          "priority",
          "averageConfidence",
          "primaryOwner",
          "primaryImpact",
          "duplicateGroupId"
        ]
      }
    }
  },
  "required": [
    "signalCount",
    "overallPriority",
    "primaryOwner",
    "primaryImpact",
    "confidence",
    "summary",
    "nextStep",
    "why",
    "stats",
    "signals",
    "clusters"
  ]
}
JSON;

$schema = json_decode($schemaJson, true);
$systemPrompt = <<<'PROMPT'
You are AI NCC-1701-alpha, an enterprise UX intelligence assistant for product, design, engineering, support, QA, research, data, and operations teams.

Analyze messy enterprise signals and return structured triage JSON only. The UI will derive risk scores, recommended workflow states, action plans, and review progress from the structured response.

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
- clusters should summarize the grouped patterns, their average confidence, priority, owners, impacts, and whether they are possible duplicates.
PROMPT;

$sourceContext = count($sources) ? "\n\nSource metadata:\n".json_encode($sources, JSON_PRETTY_PRINT) : '';
$payload = [
  'model' => $model,
  'input' => [
    ['role' => 'system', 'content' => $systemPrompt],
    ['role' => 'user', 'content' => "Analyze these enterprise UX sources and signals:\n\n".$signals.$sourceContext]
  ],
  'text' => [
    'format' => [
      'type' => 'json_schema',
      'name' => 'ai_ncc_1701_triage_v1_8',
      'strict' => true,
      'schema' => $schema
    ]
  ]
];

$ch = curl_init('https://api.openai.com/v1/responses');
curl_setopt_array($ch, [
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_POST => true,
  CURLOPT_TIMEOUT => 60,
  CURLOPT_HTTPHEADER => ['Content-Type: application/json', 'Authorization: Bearer '.$apiKey],
  CURLOPT_POSTFIELDS => json_encode($payload)
]);

$response = curl_exec($ch);
$status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

if ($response === false) {
  http_response_code(500);
  echo json_encode(['error' => 'cURL request failed: '.$error]);
  exit;
}

$data = json_decode($response, true);
if ($status < 200 || $status >= 300) {
  http_response_code($status ?: 500);
  echo json_encode(['error' => $data['error']['message'] ?? 'OpenAI API request failed.', 'details' => $data]);
  exit;
}

$outputText = $data['output_text'] ?? '';
if ($outputText === '' && isset($data['output']) && is_array($data['output'])) {
  $chunks = [];
  foreach ($data['output'] as $item) {
    foreach (($item['content'] ?? []) as $content) {
      if (($content['type'] ?? '') === 'output_text' && isset($content['text'])) $chunks[] = $content['text'];
    }
  }
  $outputText = trim(implode("\n", $chunks));
}

if ($outputText === '') {
  http_response_code(502);
  echo json_encode(['error' => 'OpenAI response did not include output text.', 'details' => $data]);
  exit;
}

$analysis = json_decode($outputText, true);
if (!is_array($analysis)) {
  http_response_code(502);
  echo json_encode(['error' => 'OpenAI response was not valid JSON.', 'raw' => $outputText]);
  exit;
}

$analysis['createdAt'] = gmdate('c');
$analysis['mode'] = 'api';
$analysis['model'] = $model;
$analysis['version'] = 'v1.8';
$analysis['sources'] = $sources;

echo json_encode($analysis);
