def generate_action(snapshot, signals):
    
    if signals["velocity"] > 0.8:
        return "Wait and observe if this spike sustains before reacting."

    if signals["reliability"] < 0.5:
        return "Exploit inconsistency: highlight authentic customer sentiment in your messaging."

    if "AI-powered" in snapshot["headline"]:
        return "Differentiate by focusing on outcome-driven messaging instead of generic AI claims."

    if signals["strategy_shift"] > 0.7:
        return "Test repositioning toward higher-value segment."

    return "Monitor competitor changes."