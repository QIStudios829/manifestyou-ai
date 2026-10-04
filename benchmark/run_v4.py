"""
ManifestYOU Consistency Benchmark v4 — layered soul documents

Re-runs the v1 consistency protocol (same 50 questions, same Haiku snapshot,
temperature 0.7, 10 runs per question) for two new conditions:

  soul_plain      core + analytical calling           (benchmark/soul_plain.txt)
  soul_attention  core + attention lineage + calling  (benchmark/soul_attention.txt)

The v1 conditions (control, placebo, lean, treatment) are reused from
benchmark/results/answers.csv: same model snapshot and settings, so the arms are
directly comparable.

Usage:
    ANTHROPIC_API_KEY=... python benchmark/run_v4.py

Output:
    benchmark/results_v4/answers_v4.csv
"""

import asyncio
import csv
import hashlib
import json
import pathlib

import anthropic

ROOT = pathlib.Path(__file__).parent
QUESTIONS_FILE = ROOT / "questions.json"
RESULTS_DIR = ROOT / "results_v4"
ANSWERS_CSV = RESULTS_DIR / "answers_v4.csv"

MODEL = "claude-haiku-4-5-20251001"  # same snapshot as v1
TEMPERATURE = 0.7
MAX_TOKENS = 500
RUNS_PER_CONDITION = 10
CONCURRENCY = 10

CONDITIONS = {
    "soul_plain": (ROOT / "soul_plain.txt").read_text(encoding="utf-8").strip(),
    "soul_attention": (ROOT / "soul_attention.txt").read_text(encoding="utf-8").strip(),
}

FIELDS = ["question_id", "question_type", "condition", "run_index", "answer", "embedding_hash"]


def load_done():
    if not ANSWERS_CSV.exists():
        return set()
    with open(ANSWERS_CSV, newline="", encoding="utf-8") as f:
        return {(r["question_id"], r["condition"], int(r["run_index"])) for r in csv.DictReader(f) if r["answer"]}


async def main():
    questions = json.loads(QUESTIONS_FILE.read_text())
    RESULTS_DIR.mkdir(exist_ok=True)
    done = load_done()
    client = anthropic.AsyncAnthropic()
    sem = asyncio.Semaphore(CONCURRENCY)

    jobs = [(q, cond, system, i)
            for q in questions
            for cond, system in CONDITIONS.items()
            for i in range(RUNS_PER_CONDITION)
            if (q["id"], cond, i) not in done]
    print(f"{len(jobs)} calls to make ({len(done)} already done)")

    async def run_one(q, cond, system, i):
        async with sem:
            try:
                msg = await client.messages.create(
                    model=MODEL,
                    max_tokens=MAX_TOKENS,
                    temperature=TEMPERATURE,
                    system=system,
                    messages=[{"role": "user", "content": q["question"]}],
                )
                answer = "".join(b.text for b in msg.content if b.type == "text").strip()
            except anthropic.APIError as e:
                print(f"  ERROR {q['id']} {cond} run{i}: {e}")
                answer = ""
        return {"question_id": q["id"], "question_type": q["type"], "condition": cond,
                "run_index": i, "answer": answer,
                "embedding_hash": hashlib.sha256(answer.encode()).hexdigest()}

    is_new = not ANSWERS_CSV.exists()
    with open(ANSWERS_CSV, "a", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=FIELDS)
        if is_new:
            writer.writeheader()
        n = 0
        for coro in asyncio.as_completed([run_one(*j) for j in jobs]):
            row = await coro
            if row["answer"]:
                writer.writerow(row)
            n += 1
            if n % 100 == 0 or n == len(jobs):
                f.flush()
                print(f"  {n}/{len(jobs)} done")


if __name__ == "__main__":
    asyncio.run(main())
