def normalize_snapshot(snapshot):
    return {
        "competitor": snapshot["competitor_name"],
        "headline": snapshot["headline"],
        "pricing": snapshot["pricing"],
        "features": snapshot["features"],
        "tone": snapshot["tone"],
        "cta": snapshot["cta"],
        "target": snapshot["target_audience"],
        "fear": snapshot["fear_addressed"],
        "proof": snapshot["proof_type"]
    }