"""Apply Chapter 3 dual slide + textbook references to pool and exam JSON."""

from __future__ import annotations

import json
import re
from pathlib import Path

from slide_ref import enrich_question_sources, load_manifest, load_book_manifest

ROOT = Path(__file__).resolve().parent
POOL = ROOT / "question-pools-by-lecture" / "chapter-3-business-ethics.json"
FINAL24 = ROOT / "final24.json"
FINAL25 = ROOT / "final25.json"

CITE_RE = re.compile(r"\[cite:\s*[^\]]+\]")

CH3_UPDATES: dict[str, dict] = {
    "Q14": {
        "explanation": (
            "Corporate social responsibility means protecting and improving both the welfare "
            "of society and the interests of the organization simultaneously. It does not state "
            "that societal goals are more important, but rather that a manager must strive to "
            "achieve societal as well as organizational goals."
        ),
        "reference": (
            'Textbook Page 52: "According to the concept of corporate social responsibility, '
            'a manager must strive to achieve societal as well as organizational goals." '
            "Slide 9 emphasizes balancing corporate health with stakeholder relations."
        ),
        "sourceRefs": ["ch3:s9", "ch3,p52"],
    },
    "Q16": {
        "explanation": (
            "The textbook explicitly defines corporate social responsibility exactly as the "
            "managerial obligation to take action that protects and improves both the welfare "
            "of society as a whole and the interests of the organization. The slides highlight "
            "that acting ethically toward all stakeholders improves corporate health."
        ),
        "reference": (
            'Textbook Page 52: "corporate social responsibility is the managerial obligation to '
            "take action that protects and improves both the welfare of society as a whole and "
            'the interests of the organization." Slides 7 and 9 reflect this through stakeholder relations.'
        ),
        "sourceRefs": ["ch3:s7,9", "ch3,p52"],
    },
    "Q24": {
        "explanation": (
            "Milton Friedman argues that making managers pursue socially responsible objectives "
            "may be unethical because it forces them to spend money (which rightfully belongs "
            "to the owners/shareholders) on other individuals or general societal causes, "
            "setting up a direct conflict of interest."
        ),
        "reference": (
            'Textbook Page 55: "Friedman also argues that to require business managers to pursue '
            "socially responsible objectives may, in fact, be unethical, because it compels managers "
            'to spend money on some individuals that rightfully belongs to other individuals." '
            'Slide 9 aligns with this by emphasizing the opportunity to make a "fair profit".'
        ),
        "sourceRefs": ["ch3:s9", "ch3,p55"],
    },
    "Q26": {
        "explanation": (
            "According to the textbook's breakdown of stakeholders and corresponding social obligations, "
            "the specific obligation a manager owes to consumers is to provide safe products. "
            "Abiding by laws is owed to government agencies, providing safe working environments "
            "is owed to employees, and repaying debts is owed to lenders."
        ),
        "reference": (
            "Textbook Page 58 (Table 3.2): Stakeholder: Consumers -> Social Obligations Owed: "
            "To provide safe products. Slide 9 echoes this via the Johnson & Johnson Credo."
        ),
        "sourceRefs": ["ch3:s9", "ch3,p58"],
    },
    "Q35": {
        "explanation": (
            "Both the textbook and the lecture slides explicitly define business ethics as the "
            "capacity to reflect on values in the corporate decision-making process, to determine "
            "how these values and decisions affect various stakeholder groups."
        ),
        "reference": (
            'Textbook Page 63: "In business, ethics can be defined as the capacity to reflect on '
            'values in the corporate decision-making process..." Slide 5 provides the exact same definition.'
        ),
        "sourceRefs": ["ch3:s5", "ch3,p63"],
    },
    "Q36": {
        "explanation": (
            "A code of ethics is precisely defined in both the textbook and lecture materials as "
            "a formal statement that acts as a guide for the ethics of how people within a "
            "particular organization should act and make decisions."
        ),
        "reference": (
            'Textbook Page 64: "A code of ethics is a formal statement that acts as a guide for '
            "the ethics of how people within a particular organization should act and make decisions.\" "
            "Slide 11 provides the exact same definition."
        ),
        "sourceRefs": ["ch3:s11", "ch3,p64"],
    },
    "Q37": {
        "explanation": (
            'The Golden Rule is a fundamental ethical standard defined as acting in a way you would '
            "expect others to act toward you. The other options refer to the professional ethic, "
            "the utilitarian principle, the legal test, and Kant's categorical imperative, respectively."
        ),
        "reference": (
            'Textbook Page 66: "1. The golden rule: Act in a way you would expect others to act toward you." '
            "Slide 15 provides the exact same definition."
        ),
        "sourceRefs": ["ch3:s15", "ch3,p66"],
    },
}


def strip_cites(text: str) -> str:
    return CITE_RE.sub("", text).strip()


def apply_to_question(q: dict, manifest: dict, book_manifest: dict) -> bool:
    if q.get("topic") != "Chapter 3: Business Ethics":
        return False
    upd = CH3_UPDATES.get(q["id"])
    if not upd:
        return False
    q["explanation"] = strip_cites(upd["explanation"])
    q["reference"] = strip_cites(upd["reference"])
    q["sourceRefs"] = upd["sourceRefs"]
    enrich_question_sources(q, manifest, book_manifest)
    return True


def main() -> None:
    manifest = load_manifest()
    book_manifest = load_book_manifest()

    pool = json.loads(POOL.read_text(encoding="utf-8"))
    n_pool = 0
    for q in pool["questions"]:
        if apply_to_question(q, manifest, book_manifest):
            n_pool += 1
    POOL.write_text(json.dumps(pool, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    for path in (FINAL24, FINAL25):
        data = json.loads(path.read_text(encoding="utf-8"))
        n = 0
        for q in data:
            if apply_to_question(q, manifest, book_manifest):
                n += 1
        path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        print(f"{path.name}: updated {n} Chapter 3 questions")

    print(f"pool: updated {n_pool} questions")


if __name__ == "__main__":
    main()
