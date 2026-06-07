"""Normalize question stems and group cross-exam repeats (underscores, light fuzzy)."""

from __future__ import annotations

import re
from difflib import SequenceMatcher

FUZZY_STEM_RATIO = 0.97


def norm_stem(text: str) -> str:
    """Lowercase stem; blanks/underscores and punctuation do not differentiate."""
    if not text:
        return ""
    t = text.lower().strip()
    t = re.sub(r"_+", " ", t)
    t = re.sub(r"\s+", " ", t).strip()
    t = re.sub(r"[^\w\s]", "", t)
    return re.sub(r"\s+", " ", t).strip()


def norm_correct_answer(question: dict) -> str:
    """Normalize keyed answer by option content (handles 1–5 vs a–e ids)."""
    correct_id = str(question.get("correctAnswerId") or "").strip().lower()
    for option in question.get("options") or []:
        if str(option.get("id") or "").strip().lower() == correct_id:
            return norm_stem(str(option.get("content") or ""))
    return correct_id


def repetition_key(question: dict) -> str:
    stem = norm_stem(str(question.get("questionText") or ""))
    if not stem:
        return ""
    return f"{stem}|{norm_correct_answer(question)}"


def _split_key(key: str) -> tuple[str, str]:
    stem, answer = key.rsplit("|", 1)
    return stem, answer


def group_repetitive_instances(questions: list[dict]) -> list[list[dict]]:
    """
    Group 2+ exam instances that share the same answer and equivalent stems.
    Exact normalized match first; optional light fuzzy merge when answers match.
    """
    buckets: dict[str, list[dict]] = {}
    for q in questions:
        key = repetition_key(q)
        if not key:
            continue
        buckets.setdefault(key, []).append(q)

    keys = list(buckets.keys())
    used: set[str] = set()
    groups: list[list[dict]] = []

    for i, key_i in enumerate(keys):
        if key_i in used:
            continue
        stem_i, answer_i = _split_key(key_i)
        group = list(buckets[key_i])
        used.add(key_i)

        for key_j in keys[i + 1 :]:
            if key_j in used:
                continue
            stem_j, answer_j = _split_key(key_j)
            if answer_i != answer_j:
                continue
            if stem_i == stem_j or SequenceMatcher(None, stem_i, stem_j).ratio() >= FUZZY_STEM_RATIO:
                group.extend(buckets[key_j])
                used.add(key_j)

        if len(group) >= 2:
            groups.append(group)

    return groups


# Back-compat alias used by build_question_pools.py analysis tables.
def norm_text(text: str) -> str:
    return norm_stem(text)
