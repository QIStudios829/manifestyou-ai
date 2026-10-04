"""
Soul hill-climb on the v1 consistency protocol.

Splits the 50 questions into a tuning half and a held-out half (alternating within
each question type), generates answers for soul variants, and scores every arm on
the same questions and the same number of runs with a local embedding model.

Usage:
    python benchmark/hillclimb.py gen   tune|heldout  <variant> [<variant> ...]  [--runs N]
    python benchmark/hillclimb.py score tune|heldout  <arm> [<arm> ...]          [--runs N]

Variants are files in benchmark/variants/<name>.txt. Arms can be variants or the
existing conditions (control, placebo, lean, treatment, soul_plain, soul_attention).
"""

import asyncio
import csv
import hashlib
import json
import pathlib
import re
import statistics
import sys

import numpy as np

ROOT = pathlib.Path(__file__).parent
OUT_CSV = ROOT / "results_v4" / "hill_answers.csv"
EMB_CACHE = ROOT / "results_v4" / "embeddings_local.npy"
MODEL = "claude-haiku-4-5-20251001"
FIELDS = ["question_id", "question_type", "condition", "run_index", "answer", "embedding_hash"]
HEDGES = ["i don't know", "i'm not sure", "i'm not certain", "i don't have", "uncertain",
          "i can't verify", "i cannot verify", "not confident"]


def split(name):
    qs = json.loads((ROOT / "questions.json").read_text())
    out, seen = [], {}
    for q in qs:
        i = seen.get(q["type"], 0)
        seen[q["type"]] = i + 1
        if (i % 2 == 0) == (name == "tune"):
            out.append(q)
    return out


def read(path):
    if not path.exists():
        return []
    with open(path, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


async def gen(questions, variants, runs):
    import anthropic
    done = {(r["question_id"], r["condition"], int(r["run_index"])) for r in read(OUT_CSV)}
    client, sem = anthropic.AsyncAnthropic(), asyncio.Semaphore(10)
    systems = {v: (ROOT / "variants" / f"{v}.txt").read_text().strip() for v in variants}
    jobs = [(q, v, i) for q in questions for v in variants for i in range(runs) if (q["id"], v, i) not in done]
    print(f"{len(jobs)} calls")

    async def one(q, v, i):
        async with sem:
            msg = await client.messages.create(model=MODEL, max_tokens=500, temperature=0.7, system=systems[v],
                                               messages=[{"role": "user", "content": q["question"]}])
        a = "".join(b.text for b in msg.content if b.type == "text").strip()
        return {"question_id": q["id"], "question_type": q["type"], "condition": v, "run_index": i,
                "answer": a, "embedding_hash": hashlib.sha256(a.encode()).hexdigest()}

    new = not OUT_CSV.exists()
    with open(OUT_CSV, "a", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=FIELDS)
        if new:
            w.writeheader()
        for c in asyncio.as_completed([one(*j) for j in jobs]):
            w.writerow(await c)


def score(questions, arms, runs):
    from fastembed import TextEmbedding
    from analyze import intra_group_similarity
    qids = {q["id"] for q in questions}
    rows = [r for p in (ROOT / "results" / "answers.csv", ROOT / "results_v4" / "answers_v4.csv", OUT_CSV)
            for r in read(p) if r["question_id"] in qids and r["condition"] in arms and int(r["run_index"]) < runs]
    emb = np.load(EMB_CACHE, allow_pickle=True).item() if EMB_CACHE.exists() else {}
    todo = {r["embedding_hash"]: r["answer"] for r in rows if r["embedding_hash"] not in emb}
    if todo:
        for h, v in zip(todo, TextEmbedding("BAAI/bge-small-en-v1.5").embed(list(todo.values()), batch_size=64)):
            emb[h] = np.asarray(v, dtype=np.float32)
        np.save(EMB_CACHE, emb)
    print(f"{len(questions)} questions x {runs} runs\n")
    print(f"{'arm':16s} {'consist.':>9s} {'words':>6s} {'capped':>7s} {'hedge:fact':>11s} {'reason':>7s} {'judgm':>6s}")
    for a in arms:
        ar = [r for r in rows if r["condition"] == a]
        by_q = {}
        for r in ar:
            by_q.setdefault(r["question_id"], []).append(emb[r["embedding_hash"]])
        cons = np.mean([intra_group_similarity(v) for v in by_q.values()])
        words = statistics.median(len(r["answer"].split()) for r in ar)
        capped = sum(1 for r in ar if len(r["answer"].split()) > 330) / len(ar) * 100
        hedge = {t: (lambda xs: sum(any(h in x["answer"].lower() for h in HEDGES) for x in xs) / max(len(xs), 1) * 100)(
            [r for r in ar if r["question_type"] == t]) for t in ("factual", "reasoning", "judgment")}
        print(f"{a:16s} {cons:9.5f} {words:6.0f} {capped:6.1f}% {hedge['factual']:10.1f}% {hedge['reasoning']:6.1f}% {hedge['judgment']:5.1f}%")


if __name__ == "__main__":
    cmd, half, *rest = sys.argv[1:]
    runs = 5
    if "--runs" in rest:
        runs = int(rest[rest.index("--runs") + 1]); rest = rest[:rest.index("--runs")]
    qs = split(half)
    if cmd == "gen":
        asyncio.run(gen(qs, rest, runs))
    else:
        score(qs, rest, runs)
