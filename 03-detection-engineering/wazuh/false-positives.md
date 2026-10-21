# False Positives and Tuning

## Purpose

Track alerts that fired for benign reasons and the tuning decisions made in response. This is evidence of detection quality, not a list of failures.

## Log

| Date | Rule ID | Alert | Benign cause | Action | Result |
|---|---|---|---|---|---|
| TBD | TBD | TBD | TBD | TBD | TBD |

## Triage questions

1. Did the rule fire on the intended behavior, or on an unrelated event?
2. Was the alert caused by lab administration, scanning, backups, or monitoring?
3. Is the rule too broad, or is the environment noisy?
4. Should the fix be a suppression, a threshold, a field condition, or a new rule?
5. Does the change preserve detection of the original attack?

## Tuning policy

- Prefer narrowing the rule over disabling it.
- Suppress by source, user, or known benign process, not by turning off the rule group.
- Record the reason and an expiry date for every suppression.
- Retest the original attack stage after each change.
- Update the coverage matrix if a detection is lost.

## Metrics

| Metric | Value |
|---|---|
| Alerts reviewed | TBD |
| True positives | TBD |
| False positives | TBD |
| Benign / informational | TBD |
| Rules tuned | TBD |
| Detections lost after tuning | TBD |
