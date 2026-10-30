# SoW authoring method

## Intake and decision record

From the current brief collect: project/client/legal parties; POC, pilot, or production stage; business problem and expected outcome; users/concurrency; functional domains; source systems and dataset boundaries; target interface; input languages/modalities; output formats; platform and infrastructure ownership; deployment environments; authentication and data authorization; session and audit requirements; delivery dates and dependencies; acceptance owner and measurement; support; commercial basis; author/version/date; signatory roles; requested format.

Do not require a questionnaire when the brief already contains these facts. Record material unknowns in the working draft or accompanying note. Obtain decisions before representing unresolved items as agreed contractual commitments. A POC must specify its demonstrable outcome and handover boundary; production readiness is a separate scope decision.

## Section design

1. **Cover:** project title, client name, current issue date; atQor cover brand and supplied partner credentials. The reference has no client logo. Never create one from text.
2. **Contents:** derive headings and page numbers from the final artifact, not the original 29 pages.
3. **Document Control:** revision/date/change/author table; document reference and controlled-copy status; confidentiality. For edits, retain the existing revision history and add the new entry. Do not copy old personal approvals.
4. **Credentials and Why atQor:** use supplied company profile and competencies; the positioning table maps a concrete strength to client value. Retain historical award/certification claims as supplied, without implying renewed status or a new award. The collateral contains older Gold Partner language alongside Solutions Partner branding; clarify only if the new brief needs updated credentials.
5. **Executive Summary:** engagement outcome, data/platform boundary, delivery channel, and business capabilities. Example pattern: “This engagement will deliver [solution] for [users] to [business task] using [approved data]. The solution will support [capabilities] within [scope boundary].” Use the current scope to fill the pattern.
6. **Proposed Scope:** business domains, data/pipeline work, schema and metadata, access limits, component responsibilities, UI/outputs, context/session handling, monitoring. Explain what the supplier builds and what the customer must provide.
7. **Assumptions:** facts the plan depends upon. Each material assumption should identify the impact if false and how it will be confirmed.
8. **Out of Scope:** adjacent features excluded from this engagement, especially writes, integrations, modalities/languages, extra data sources, advanced analytics, additional interfaces, data authorization, retention, or support. These are categories to decide, not automatic exclusions.
9. **Prerequisites:** provisioned systems, specific access roles, application registrations, quotas, data dictionaries, business formulas, mapping walkthroughs, sample queries and reference answers. Separate build/deployment access from runtime access.
10. **Deliverables:** named artifact/capability, boundary, handover format, customer/supplier owner, and acceptance link. Include deployment/configuration and documentation only when in scope.
11. **Architecture:** current user channel -> authentication -> application/orchestration -> knowledge/schema retrieval -> data query -> results; show pipeline, secrets, session store, monitoring, and trust boundaries only where applicable. Do not carry Azure/Fabric icons into a changed stack automatically.
12. **Success and Acceptance Criteria:** measurable criteria, agreed test set, denominator, exclusions, owner, measurement window, severity exit rules, and sign-off. Proposed targets are labelled proposed until agreed. Distinguish SQL execution success from correct answers.
13. **Timeline:** Phase / Feature or Module / Description, adding duration/owner/dependency where needed. Include requirements, design, data work, implementation, test/UAT, fixes, deployment, and handover if relevant. State working weeks/days versus calendar days and parallel activity; do not assume the historical 7-8 weeks.
14. **Consumption estimates:** service/category/region/SKU/configuration/workload/monthly cost/remarks; date and currency; subtotal; exclusions such as platform capacity or taxes; one-time versus recurring basis. Quote current verified rates or disclose supplied provisional rates.
15. **Sign-Off:** scope baseline and change-request mechanism, plus supplier/customer signature/name/title/date fields. Do not reproduce executed signatures or assume source staff sign the new project.

## Technical writing pattern

For each module use a short **Purpose** paragraph followed by **How It Works** actions. Include input, operation, output, dependency, and boundary rather than a generic claim of accuracy. The reference decomposes intent classification, functional logic, metadata resolution, SQL generation/execution/answering, graph selection, and context/follow-up handling. Reuse that decomposition only where it fits the new system.

For data insights, document each metric's formula, units, grain, join keys, filters, period, null handling, zero-denominator handling, and business owner. The source's Achievement % = Actual / Plan x 100 and Variance = Actual - Plan illustrate the method; they do not guarantee every new dataset supports a plan comparison.

Business limitations should be explicit: unmatched dimensions, unavailable fields, retention length, refresh latency, maximum table size, and output restrictions. Do not infer missing joins or promise unsupported analytical explanations.

## Consistency and calculation review

Maintain a compact working map: capability -> data -> implementation -> deliverable -> acceptance -> estimate. Scan for a feature being both included and excluded. Ensure runtime read-only access does not prohibit separately scoped pipeline deployment. Ensure identity sign-in does not imply row-level security.

For cloud costs define whether queries/day means per user or all users. Monthly queries = users x queries/user/day x working days, or total queries/day x working days; apply only one interpretation. Multiply by agent calls/query, tokens/call, and unit rate as applicable. Keep input/output/cached/embedding usage distinct. Add all billable infrastructure, quote validity/date, and state consumption variability. The reference table has a INR 0.01 total discrepancy; recalculate rather than copying it.

Keep source-specific limits (six views, nine domains, 3-5 turns, English text, Teams, no row-level security, regional/model choices, quotas, target percentages) out of unrelated new SoWs unless the current brief explicitly adopts them.
