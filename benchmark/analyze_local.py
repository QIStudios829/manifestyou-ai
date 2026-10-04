"""
ManifestYOU Consistency Benchmark v4 — local embedding check

Same metric as v1/v4 (mean pairwise cosine similarity across 10 runs per question,
bootstrap 95% CI), but every arm — the v1 answers and the v4 soul answers — is
re-embedded with one free local model (BAAI/bge-small-en-v1.5 via fastembed), so
all arms are on the same scale. Absolute numbers differ from the published
OpenAI-embedding results; the comparisons between arms are what matter.

Usage:
    pip install fastembed numpy
    python benchmark/analyze_local.py
"""

import csv
import json
import pathlib

import numpy as np
from fastembed import TextEmbedding

from analyze import intra_group_similarity, bootstrap_ci_pair

ROOT = pathlib.Path(__file__).parent
OUT = ROOT / "results_v4" / "results_local.json"
CACHE = ROOT / "results_v4" / "embeddings_local.npy"
MODEL = "BAAI/bge-small-en-v1.5"
ARMS = ["control", "placebo", "lean", "treatment", "soul_plain", "soul_attention"]
COMPARISONS = [
    ("soul_plain", "control"), ("soul_plain", "placebo"), ("soul_plain", "lean"), ("soul_plain", "treatment"),
    ("soul_attention", "control"), ("soul_attention", "placebo"), ("soul_attention", "lean"),
    ("soul_attention", "treatment"), ("soul_attention", "soul_plain"),
    ("lean", "control"), ("treatment", "control"),
]


def rows(path):
    with open(path, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def main():
    all_rows = rows(ROOT / "results" / "answers.csv") + rows(ROOT / "results_v4" / "answers_v4.csv")
    emb = np.load(CACHE, allow_pickle=True).item() if CACHE.exists() else {}
    todo = {r["embedding_hash"]: r["answer"] for r in all_rows if r["embedding_hash"] not in emb}
    if todo:
        print(f"Embedding {len(todo)} answers with {MODEL}...")
        model = TextEmbedding(MODEL)
        for h, v in zip(todo.keys(), model.embed(list(todo.values()), batch_size=64)):
            emb[h] = np.asarray(v, dtype=np.float32)
        np.save(CACHE, emb)

    by_q = {}
    for r in all_rows:
        q = by_q.setdefault(r["question_id"], {"type": r["question_type"]})
        q.setdefault(r["condition"], []).append(emb[r["embedding_hash"]])
    scores = {qid: {"type": d["type"], **{a: intra_group_similarity(d[a]) for a in ARMS}} for qid, d in by_q.items()}

    means = {a: round(float(np.mean([s[a] for s in scores.values()])), 5) for a in ARMS}
    print("\nMean consistency across 10 runs (higher = more consistent):")
    for a in ARMS:
        print(f"  {a:15s} {means[a]:.5f}")

    out = {"embed_model": MODEL, "means": means, "comparisons": {}}
    print("\nComparisons:")
    for a, b in COMPARISONS:
        ma = np.mean([s[a] for s in scores.values()]); mb = np.mean([s[b] for s in scores.values()])
        pct = (ma - mb) / mb * 100
        lo, hi = bootstrap_ci_pair(list(scores), scores, a, b)
        by_type = {t: round(float((np.mean([s[a] for s in scores.values() if s["type"] == t]) -
                                   np.mean([s[b] for s in scores.values() if s["type"] == t])) /
                                  np.mean([s[b] for s in scores.values() if s["type"] == t]) * 100), 2)
                   for t in ("factual", "reasoning", "judgment")}
        out["comparisons"][f"{a}_vs_{b}"] = {"pct": round(float(pct), 2), "ci_95": [round(lo, 2), round(hi, 2)], "by_type": by_type}
        print(f"  {a:15s} vs {b:10s} {pct:+6.2f}%  CI {lo:+.2f}% to {hi:+.2f}%  {by_type}")
    OUT.write_text(json.dumps(out, indent=2))
    print(f"\nWrote {OUT}")


if __name__ == "__main__":
    main()
