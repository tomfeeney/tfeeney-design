<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');

if ($_SERVER['REQUEST_METHOD'] !== 'GET' && $_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}

$file = __DIR__ . '/scores.json';
$maxScores = 10;

function clean_initials($value): string {
    $value = strtoupper((string)$value);
    $value = preg_replace('/[^A-Z0-9]/', '', $value);
    $value = substr($value, 0, 3);
    return $value !== '' ? str_pad($value, 3, '_') : 'AAA';
}

function clean_score($value): int {
    $score = (int)$value;
    if ($score < 0) return 0;
    if ($score > 9999999) return 9999999;
    return $score;
}

function read_scores(string $file, int $maxScores): array {
    if (!file_exists($file)) {
        file_put_contents($file, "[]\n", LOCK_EX);
    }

    $raw = file_get_contents($file);
    $data = json_decode($raw === false ? '[]' : $raw, true);
    if (!is_array($data)) return [];

    $scores = [];
    foreach ($data as $row) {
        if (!is_array($row)) continue;
        $score = clean_score($row['score'] ?? 0);
        if ($score <= 0) continue;
        $scores[] = [
            'initials' => clean_initials($row['initials'] ?? 'AAA'),
            'score' => $score,
            'date' => isset($row['date']) ? (string)$row['date'] : gmdate('c')
        ];
    }

    usort($scores, fn($a, $b) => $b['score'] <=> $a['score']);
    return array_slice($scores, 0, $maxScores);
}

function write_scores(string $file, array $scores, int $maxScores): bool {
    usort($scores, fn($a, $b) => $b['score'] <=> $a['score']);

    $seen = [];
    $deduped = [];
    foreach ($scores as $row) {
        $key = $row['initials'] . ':' . $row['score'];
        if (isset($seen[$key])) continue;
        $seen[$key] = true;
        $deduped[] = $row;
    }

    $scores = array_slice($deduped, 0, $maxScores);
    $json = json_encode($scores, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    return file_put_contents($file, $json . "\n", LOCK_EX) !== false;
}

$scores = read_scores($file, $maxScores);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $payload = json_decode((string)file_get_contents('php://input'), true);
    if (!is_array($payload)) $payload = $_POST;

    $score = clean_score($payload['score'] ?? 0);
    $initials = clean_initials($payload['initials'] ?? 'AAA');

    if ($score > 0) {
        $scores[] = [
            'initials' => $initials,
            'score' => $score,
            'date' => gmdate('c')
        ];

        if (!write_scores($file, $scores, $maxScores)) {
            http_response_code(500);
            echo json_encode(['ok' => false, 'error' => 'Unable to write scores.json']);
            exit;
        }

        $scores = read_scores($file, $maxScores);
    }
}

echo json_encode(['ok' => true, 'scores' => $scores], JSON_UNESCAPED_SLASHES);
