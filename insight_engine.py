def generate_insight(snapshot, signals, score):
    insight = {}

    # WHAT changed
    insight["what_changed"] = f"{snapshot['competitor']} messaging emphasizes '{snapshot['headline']}'"

    # WHY it matters
    if signals["velocity"] > 0.7:
        insight["why_it_matters"] = "Competitor is rapidly pushing this theme — likely testing aggressively."
    elif signals["strategy_shift"] > 0.7:
        insight["why_it_matters"] = "Indicates a strategic repositioning toward a new segment."
    else:
        insight["why_it_matters"] = "Incremental messaging update."

    # RELIABILITY context
    if signals["reliability"] < 0.5:
        insight["risk"] = "Signal may be unreliable due to inconsistency with external sentiment."

    insight["score"] = score

    return insight