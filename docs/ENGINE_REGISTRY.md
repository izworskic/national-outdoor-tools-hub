# National Tools Engine Registry

The engine registry is a **discovery aid**, not an architectural mandate.

Machine-readable registry: `benchmarks/national-engine-registry.json`

## Core rule

When designing or changing a tool, check whether an existing engine or reusable component already answers a real part of the problem. Then make an independent fit decision.

A tool may:

- reuse an existing shared contract;
- call an existing engine through a stable HTTP/API contract;
- deliberately extract a general component when a real second consumer exists;
- use an existing implementation only as a modeling reference;
- ignore every registered engine and build purpose-specific logic when that produces a better product.

**No engine is mandatory merely because it exists.**

## What the registry is for

The registry should reduce accidental duplication and make proven intelligence easy to discover. It should answer:

1. What intelligence already exists?
2. Which repo owns it?
3. Is it actually designed for reuse, or merely embedded in a working tool?
4. How can another tool safely access it?
5. What assumptions, geographic limits and prohibited claims travel with it?
6. When should a new tool *not* use it?

## What the registry is not for

The registry must not turn National Tools into a rigid framework where every product is assembled from predefined components.

Do not:

- force a user experience to match an existing engine;
- import sibling repo internals directly just to save time;
- transplant domain-specific weights into a different species, destination or phenomenon;
- create a shared abstraction before there is a real second consumer;
- centralize working tool-specific code solely for architectural neatness;
- choose a weaker data source because a registered engine already uses it;
- make reuse a release gate.

## Reuse classes

### Shared contract

Already intended for cross-tool use. Example: `@izworskic/national-outdoor-core` helpers for location, time, freshness and source metadata.

### Proven engine

A working engine with a stable owner and a plausible API/package boundary. It may be consumed when its semantics match the new problem.

### Extractable component

Useful logic exists inside a tool, but it is not yet a cross-repo dependency. Keep it in place until a real second consumer justifies extracting a generalized, tested contract.

### Pattern reference

The architecture is useful, but the formula is specific to the original domain. Reuse the idea, not the weights.

### Tool-specific

Keep local. Registration may still document it so future builders know the capability exists.

## Fit test for a new tool

Before reusing an engine, ask:

- Does it answer a sub-question the user actually needs?
- Are its sources valid for this geography and use case?
- Do its uncertainty and freshness semantics fit?
- Is there a stable contract to consume it?
- Does reuse improve maintainability without reducing quality?
- Would a new implementation be more accurate, simpler or more understandable?

If the answer to the last question is yes, build the new implementation.

## Extraction rule

**Do not extract merely because code looks reusable.**

Extraction should usually happen only after a second real product needs the capability. That gives us an actual consumer against which to design the contract.

Example:

- Yosemite Firefall contains useful solar, clarity and trip-window logic.
- We do **not** move that code today just because it might someday be useful.
- If a future sunset-alignment or scenic-light tool needs the same concept, compare the requirements.
- If the overlap is real, extract the genuinely common part, test both consumers and keep Firefall-specific geometry/weights local.

## Registration workflow

When useful intelligence is discovered or built:

1. Identify the owning repo.
2. Classify it as shared contract, proven engine, extractable component, pattern reference or tool-specific.
3. Document what question it answers.
4. Document access method and stable contracts, if any.
5. Document geographic/source/semantic limits.
6. Document likely consumers and explicit reasons not to use it.
7. Add it to `benchmarks/national-engine-registry.json`.

Registration means **“available to consider,” not “required to use.”**

## Initial registry coverage

The initial registry documents shared infrastructure plus proven or embedded intelligence in Rivers, Aurora, Coastal, Snowpack, Frost, Planting, Garden Water, White Christmas, Cumberland Moonbow, Yosemite Firefall, Monarch Migration and Rocky Mountain Elk Rut.

It should grow gradually as real reusable intelligence is proven across the portfolio.
