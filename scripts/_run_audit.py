import io, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
sys.path.insert(0, str(__import__("pathlib").Path(__file__).parent.parent / "scripts"))
import audit_allocations as a

issues = a.audit()
by_type = {}
for iss in issues:
    by_type.setdefault(iss["type"], []).append(iss)

print(f"TOTAL: {len(issues)} issues\n")
for t in sorted(by_type):
    grp = by_type[t]
    print(f"=== Check {t} ({len(grp)}) ===")
    for iss in grp:
        qid = iss["id"]
        topics = iss["topics"]
        desc = iss["desc"]
        snippet = repr(iss["text_snippet"][:100])
        matched = iss.get("matched", [])
        print(f"  [{qid}] topics={topics}")
        print(f"    {desc}")
        if matched:
            print(f"    matched: {matched}")
        print(f"    Q: {snippet}")
        print()
