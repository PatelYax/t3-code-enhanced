---
name: atqor-sow
description: Create, edit, review, or scope a Statement of Work (SoW, SOW, scope of work, POC SoW, or project SoW) using Bhavy's atQor HRIPL reference. Apply automatically to business SoW work, preserving company logos, document layout, writing methods, scope boundaries, deliverables, acceptance, estimates, and sign-off. Use the RFP/proposal skill for proposals and procurement RFPs; do not route unrelated sowing or general code tasks here.
---

# atQor Statement of Work

Use this personal global skill for SoW work. The retained 29-page HRIPL PDF is the design and writing reference. Its client, dates, commercial estimates, technologies, limits, signatures, and acceptance targets are historical project facts, not defaults for a new engagement.

## Start with the current brief

1. Read [authoring-guide.md](references/authoring-guide.md) for the scope and writing method and [source-map.md](references/source-map.md) for the reference structure and known conflicts. For layout or file authoring, also read [brand-and-layout.md](references/brand-and-layout.md) and visually inspect the relevant retained page images.
2. Extract the new client's identity, engagement stage, objectives, users, data/platforms, included features, exclusions, responsibilities, deliverables, milestones, acceptance approach, and requested output. Use existing conversation and attachments before asking for missing information. For a partial brief, complete a useful draft and identify only material unresolved decisions; do not invent prices, dates, service commitments, or permissions.
3. Preserve the atQor design unless the user supplies a different brand or template. Follow a supplied current SoW when editing it; do not force wholesale restructuring for a narrow change. When a request includes both a proposal and a SoW, use this skill for the SoW and `atqor-rfp-proposal` for the proposal.

## Preserve the reference's method

- Follow the section progression: cover, contents, document control and company credentials, executive summary, proposed scope, architecture, success and acceptance criteria, timeline, consumption estimates, sign-off. Inside scope, retain explicit assumptions, exclusions, prerequisites, and deliverables. Add commercials or other contractual sections only when the brief needs them.
- Explain features as **capability and business outcome**, then describe responsibilities, inputs, dependencies, and boundaries. For agent modules, preserve the **Purpose / How It Works** writing pattern. Replace examples with the new project's domains and supported data.
- Trace each promised capability into a deliverable, implementation activity, and acceptance check. Keep authentication, app permissions, data-level authorization, conversation history, telemetry, and dashboards distinct.
- Preserve company marks and approved confidentiality/control wording from the assets and source text. Update project metadata consistently and leave signature fields unsigned unless the user supplies execution details for this document.
- Resolve the reference's contradictory statements using the current brief and [source-map.md](references/source-map.md); never reproduce both sides as commitments.

## Create or review the artifact

The originals are PDFs; these are PDF-backed skills, not Word-reference Template Gallery packages. Keep `assets/reference.pdf` unchanged. Reuse `assets/brand/` for actual artwork, not a full-page screenshot or flattened source page as new content.

For PDF creation, use the available PDF skill and optionally [scripts/build_pdf.py](scripts/build_pdf.py), whose input and behavior are documented in [generation.md](references/generation.md). For editable Word output, use the available Documents skill with the same measured design. Use the requested format; otherwise PDF matches the supplied references.

Before delivery, verify scope/exclusions, architecture, data permissions, deliverables, schedule and cost arithmetic, document version/date, page numbers/contents, and signatory parties. Render the final file and inspect every page for missing logos, distorted assets, unreadable tables, clipping, and broken pagination. A review request may need findings only; do not generate or rewrite a whole document unnecessarily.

## Retained evidence

- [Source PDF](assets/reference.pdf) and [cover preview](assets/preview.png).
- [Source text](references/source-text.txt): search by the page markers and relevant clause; do not load the entire file unless needed.
- [Extracted tables](references/source-tables.json): reference values only.
- [Asset provenance](references/asset-manifest.json): source hash, page numbers, asset origin, and crop details.
- `assets/reference-pages/`: selected legible page renders for design review. Render other pages from the complete source when necessary.
