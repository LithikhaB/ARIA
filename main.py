from pipeline import run_pipeline
import json

def main():
    snapshot = {
        "competitor_name": "Acme Corp",
        "headline": "The first AI-powered enterprise platform",
        "pricing": "$99",
        "features": ["AI", "Cloud"],
        "tone": "Urgent",
        "cta": "Buy Now",
        "target_audience": "Enterprise",
        "fear_addressed": "Missing out",
        "proof_type": "Case Study"
    }

    guard_flags = [
        {"type": "velocity_spike"},
        {"type": "tone_mismatch"}
    ]

    result = run_pipeline(snapshot, guard_flags)

    print("Pipeline Output:")
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()
