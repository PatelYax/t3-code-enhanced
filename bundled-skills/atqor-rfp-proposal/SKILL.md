---
name: atqor-rfp-proposal
description: Create, edit, review, or respond to a business proposal, project proposal, technical/commercial proposal, RFP, Request for Proposal, or RFP response using Bhavy's atQor Arvind MIS reference. Apply automatically to this document work, preserving company logos, design, business-to-technical writing, delivery methods, commercials, terms, and sign-off. Distinguish buyer-issued RFPs from supplier proposals. Use atqor-sow for Statements of Work; exclude academic, personal, and unrelated proposals.
---

# atQor RFP and Proposal

Use this personal global skill for business RFP and proposal work. The retained 27-page Arvind file is a **supplier proposal**, not an issued procurement RFP. Preserve its design and proposal method; adapt the document type without presenting supplier commitments as buyer instructions.

## Choose the document type

- **Supplier proposal:** explain the business need, proposed solution, scope, delivery, responsibilities, estimates, commercials, terms, and acceptance/sign-off using [proposal-guide.md](references/proposal-guide.md).
- **RFP response:** follow the actual RFP's mandatory order and submission rules, map requirements to evidence and proposed delivery, and disclose gaps, dependencies, deviations, and options. The RFP's format overrides the historical proposal outline.
- **Buyer-issued RFP:** use [rfp-guide.md](references/rfp-guide.md). Its procurement sections are an adaptation; they are not extracted from the supplier reference. Identify the issuer and use its actual brand and confidentiality label. Do not imply atQor has been selected or insert an executed supplier contract.
- **Statement of Work:** use `atqor-sow`. If the request includes both documents, apply each skill to its own artifact.

Infer the mode from the brief and existing attachments. Ask only if the buyer/supplier role cannot be inferred and materially changes the document. Use prior inputs before requesting client/project facts, requirements, priorities, platform/data boundaries, delivery constraints, cost basis, or signatory information.

## Preserve the reusable method

Read [source-map.md](references/source-map.md) for section evidence and contradictions. For visual authoring, read [brand-and-layout.md](references/brand-and-layout.md) and inspect relevant retained page renders. For pricing or timelines, read [commercials-and-terms.md](references/commercials-and-terms.md).

- Match the reference's formal, direct business writing: business need and outcome, functional capabilities, technical implementation, assumptions, prerequisites, deliverables, exclusions, support, phased delivery, commercials, terms, and sign-off.
- Keep atQor logos, page geometry, cover artwork, recurring header/footer, and table treatment for atQor-authored proposals unless the user overrides branding. Use assets unchanged; do not redraw logos or invent customer marks.
- Retain the **Aspect / atQor's Strengths / Value to Clients** company-positioning method. Use supplied corporate claims as reference claims; do not invent newer certifications or transfer atQor credentials to another company.
- Replace historical names, staff, dates, amounts, model versions, domain limits, view counts, duration, and signatures with current inputs. Never inherit the old HR-screening sentence or contradictory scope exclusions.
- Separate implementation fees, cloud consumption, taxes, licenses, expenses, support, and optional enhancements. Calculate totals from the new basis. A missing budget is not authorization to reuse the historical quote.
- Explain authorization at the correct layer, data ingestion ownership, session retention, logging, and interface behavior consistently across all sections and diagrams.

## Generate and verify

These references are PDFs, so this is a PDF-backed skill rather than a Word-reference Template Gallery package. Keep `assets/reference.pdf` intact. Build new editable text, tables, and current architecture; do not copy full page screenshots as new content.

For PDFs, use the available PDF skill and optionally [scripts/build_pdf.py](scripts/build_pdf.py), described in [generation.md](references/generation.md). For Word output, use the available Documents skill with the same visual system. Follow the requested format; PDF otherwise matches the references.

Before delivery, check RFP compliance when applicable; then scope against exclusions, promises against delivery/resources, service estimates against workload, payment arithmetic, timeline units, terms, buyer/supplier identity, unsigned signature fields, version/date, contents, and page numbering. Render and inspect every final page for fidelity and readability. For a review, provide the requested findings without unnecessary document generation.

## Source resources

- [Complete source PDF](assets/reference.pdf), [cover preview](assets/preview.png), and `assets/reference-pages/`.
- [Page-indexed source text](references/source-text.txt) and [extracted tables](references/source-tables.json); use only needed sections.
- [Asset provenance](references/asset-manifest.json) records hashes, source pages, and extraction methods.
