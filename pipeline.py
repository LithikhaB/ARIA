from normalize import normalize_snapshot
from signals import extract_signals
from svnr import compute_snvr
from insight_engine import generate_insight
from action_engine import generate_action


def run_pipeline(snapshot, guard_flags):

    # 1. normalize
    norm = normalize_snapshot(snapshot)

    # 2. signals
    signals = extract_signals(norm, guard_flags)

    # 3. score
    score = compute_snvr(signals)

    # 4. insight
    insight = generate_insight(norm, signals, score)

    # 5. action
    action = generate_action(norm, signals)

    return {
        "competitor": norm["competitor"],
        "insight": insight,
        "recommended_action": action,
        "score": score,
        "priority": "HIGH" if score > 70 else "MEDIUM"
    }