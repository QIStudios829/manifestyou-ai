"""
ManifestYOU Consistency Benchmark v4 — Analysis

Embeds the v4 answers with the v1 embedding model (text-embedding-3-small), then
scores every arm with the v1 metric: mean pairwise cosine similarity across the
10 runs of each question, compared per question with a bootstrap 95% CI.

Reads:
    benchmark/results/answers.csv, benchmark/results/embeddings.npy   (v1 arms)
    benchmark/results_v4/answers_v4.csv                               (v4 arms)
Writes:
    benchmark/results_v4/embeddings_v4.npy
    benchmark/results_v4/results_v4.json

The OpenAI key is read from OPENAI_API_KEY or the file ~/.openai_key.

Usage:
    python benchmark/analyze_v4.py
"""

import csv
import json
import os
import pathlib
import sys
import time
import urllib.request

import numpy as np

from analyze import intra_group_similarity, bootstrap_ci_pair

ROOT = pathlib.Path(__file__).parent
V1_CSV = ROOT / "results" / "answers.csv"
V1_EMB = ROOT / "results" / "embeddings.npy"
V4_DIR = ROOT / "results_v4"
V4_CSV = V4_DIR / "answers_v4.csv"
V4_EMB = V4_DIR / "embeddings_v4.npy"
V4_JSON = V4_DIR / "results_v4.json"

EMBED_MODEL = "text-embedding-3-small"
ARMS = ["control", "placebo", "lean", "treatment", "soul_plain", "soul_attention"]
COMPARISONS = [
    ("soul_plain", "control"), ("soul_plain", "placebo"), ("soul_plain", "lean"), ("soul_plain", "treatment"),
    ("soul_attention", "control"), ("soul_attention", "placebo"), ("soul_attention", "lean"),
    ("soul_attention", "treatment"), ("soul_attention", "soul_plain"),
]


def openai_key():
    key = os.environ.get("OPENAI_API_KEY", "").strip()
    path = pathlib.Path.home() / ".openai_key"
    if not key and path.exists():
        key = path.read_text().strip()
    if not key:
        sys.exit("No OpenAI key: set OPENAI_API_KEY or save it to ~/.openai_key")
    return key


def embed(texts, key):
    req = urllib.request.Request(
        "https://api.openai.com/v1/embeddings",
        data=json.dumps({"model": EMBED_MODEL, "input": texts}).encode(),
        headers={"Authorization": f"Bearer {key}", "content-type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        data = json.loads(resp.read())
    return [np.array(d["embedding"], dtype=np.float32) for d in sorted(data["data"], key=lambda d: d["index"])]


def load_rows(path):
    with open(path, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def main():
    rows = load_rows(V1_CSV) + load_rows(V4_CSV)
    embeddings = np.load(V1_EMB, allow_pickle=True).item()
    if V4_EMB.exists():
        embeddings.update(np.load(V4_EMB, allow_pickle=True).item())

    missing = list({r["embedding_hash"]: r["answer"] for r in rows if r["embedding_hash"] not in embeddings}.items())
    if missing:
        key = openai_key()
        print(f"Embedding {len(missing)} answers with {EMBED_MODEL}...")
        v4_vectors = np.load(V4_EMB, allow_pickle=True).item() if V4_EMB.exists() else {}
        for i in range(0, len(missing), 100):
            chunk = missing[i:i + 100]
            for (h, _), vec in zip(chunk, embed([a for _, a in chunk], key)):
                embeddings[h] = vec
                v4_vectors[h] = vec
            np.save(V4_EMB, v4_vectors)
            time.sleep(0.3)

    by_q = {}
    for r in rows:
        q = by_q.setdefault(r["question_id"], {"type": r["question_type"]})
        q.setdefault(r["condition"], []).append(embeddings[r["embedding_hash"]])
    scores = {qid: {"type": d["type"], **{a: intra_group_similarity(d[a]) if len(d.get(a, [])) >= 2 else None
                                          for a in ARMS}}
              for qid, d in by_q.items()}

    means = {a: round(float(np.mean([s[a] for s in scores.values() if s[a] is not None])), 6) for a in ARMS}
    print("\nMean consistency (pairwise cosine similarity across 10 runs):")
    for a in ARMS:
        print(f"  {a:15s} {means[a]:.4f}")

    out = {"model": "claude-haiku-4-5-20251001", "embed_model": EMBED_MODEL, "temperature": 0.7,
           "runs_per_condition": 10, "means": means, "comparisons": {}}
    print("\nComparisons (positive = more consistent):")
    for a, b in COMPARISONS:
        valid = {q: s for q, s in scores.items() if s[a] is not None and s[b] is not None}
        ma = np.mean([s[a] for s in valid.values()])
        mb = np.mean([s[b] for s in valid.values()])
        pct = (ma - mb) / mb * 100
        lo, hi = bootstrap_ci_pair(list(valid), valid, a, b)
        by_type = {}
        for t in ("factual", "reasoning", "judgment"):
            tv = [s for s in valid.values() if s["type"] == t]
            ta, tb = np.mean([s[a] for s in tv]), np.mean([s[b] for s in tv])
            by_type[t] = round(float((ta - tb) / tb * 100), 2)
        out["comparisons"][f"{a}_vs_{b}"] = {"pct": round(float(pct), 2), "ci_95": [round(lo, 2), round(hi, 2)],
                                             "by_type": by_type}
        print(f"  {a:15s} vs {b:10s} {pct:+6.2f}%  95% CI {lo:+.2f}% to {hi:+.2f}%   {by_type}")

    V4_JSON.write_text(json.dumps(out, indent=2))
    print(f"\nWrote {V4_JSON}")


if __name__ == "__main__":
    main()
