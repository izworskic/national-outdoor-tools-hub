# Agent boundary

This repository owns National Outdoor Tools **network orchestration**, not individual decision engines.

It may change:
- the National Tools landing page and intent hubs,
- cross-tool navigation/discovery,
- national network governance contracts and candidate prioritization,
- production validation across canonical public routes.

It must not copy implementation from sibling tool repositories. Shared location/freshness helpers belong in `izworskic/national-outdoor-core`. Tool-specific behavior belongs in the owning tool repo. Cross-tool behavior must use explicit versioned package or HTTP contracts.

Preserve existing public canonical URLs unless a migration issue explicitly authorizes a URL change.
