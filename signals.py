def compute_novelty(snapshot):
    if "AI-powered" in snapshot["headline"]:
        return 0.6
    return 0.4


def compute_velocity(guard_flags):
    for flag in guard_flags:
        if flag["type"] == "velocity_spike":
            return 0.9
    return 0.3


def compute_saturation(snapshot):
    if "AI-powered" in snapshot["headline"]:
        return 0.8  # common term
    return 0.3


def compute_reliability(guard_flags):
    for flag in guard_flags:
        if flag["type"] == "tone_mismatch":
            return 0.3
    return 0.8


def compute_strategy_shift(snapshot):
    if "enterprise" in snapshot["headline"]:
        return 0.8
    return 0.4


def extract_signals(snapshot, guard_flags):
    return {
        "novelty": compute_novelty(snapshot),
        "velocity": compute_velocity(guard_flags),
        "saturation": compute_saturation(snapshot),
        "reliability": compute_reliability(guard_flags),
        "strategy_shift": compute_strategy_shift(snapshot)
    }