def compute_snvr(signals):
    score = (
        0.20 * signals["novelty"] +
        0.20 * signals["velocity"] +
        0.20 * (1 - signals["saturation"]) +
        0.25 * signals["reliability"] +
        0.15 * signals["strategy_shift"]
    )
    return round(score * 100, 2)