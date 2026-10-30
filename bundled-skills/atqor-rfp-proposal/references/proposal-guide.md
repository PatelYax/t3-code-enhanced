# Supplier proposal method

## Source-derived outline

Use this sequence for a new proposal unless the current RFP or client format overrides it. Fix the source's duplicate section number rather than repeating it.

1. Cover with project/client/issue date and brand.
2. Contents based on actual final pagination.
3. Document Control: revision history, hardcopy/master control, confidentiality, project/client/account-manager/date/author/version matrix, prepared-by/approved-by roles. Do not copy old approvals or signatures.
4. Executive Summary: atQor Introduction, relevant strengths and Why atQor table, then a client-specific summary of the actual proposed outcome. The source misplaced an HR screening claim in an MIS proposal; replace it.
5. Project Objective: business problem, users, decisions supported, expected outcome and solution boundary.
6. Proposed Scope: functional scope, technical scope, solution design, assumptions, prerequisites, service components, deliverables and exclusions.
7. Hypercare Support, if included: start event, duration unit, bug/severity boundaries, response coverage and transition to optional ongoing support.
8. Timelines: Phase / Feature or Module / Description / Duration. State duration unit, dependencies, overlapping work, UAT responsibility, rollout and handover.
9. Commercials: cloud estimate detail; fee summary; resource mix; engagement duration; milestone payments; invoice/payment terms. Separate recurring and one-time amounts.
10. Terms and Conditions: contractual parties, tax/expenses/license responsibilities, delivery location, schedule assumptions, decision turnaround, change control and additional support.
11. Sign-Off: accepted scope and commercials/change-request baseline; two-column signature/name/title/date fields for current supplier and client.

## Functional and technical writing

Collect current client identity, objective/use cases, source systems, data volumes/schema, business domains/rules, users/concurrency, interface, input/output modalities/languages, access/security, refresh expectations, retention, platform/license ownership, availability/performance needs, delivery deadline, test/acceptance ownership, support, resource/cost basis and commercial parties. Reuse existing inputs before asking. An incomplete brief can become a clearly provisional draft; unknown amounts and commitments must remain unconfirmed.

The reference presents accessible business capabilities first and implementation detail second:

- **Functional:** who uses the capability, what business question/action it supports, and how the outcome appears. Group access, data organization, assistance, interaction and sessions only when applicable.
- **Technical:** identity/access layer, data model and ingestion ownership, orchestration/agents and business formulas, runtime query access, response formation, application integration, conversation/session storage, and operational components.
- **Assumptions:** available/clean data, finalized domains, customer-created views, required access, infrastructure, user attributes, SME/test input, license ownership and scope boundaries. Explain the consequence if a material assumption fails.
- **Prerequisites:** actionable access/provisioning/data dictionary/walkthrough/sample-answer inputs with owners.
- **Deliverables:** deployable artifacts and client handover, with limits and test evidence; avoid a deliverable list too short to cover promised scope.
- **Exclusions:** decide adjacent features in the current brief. The historical exclusions are not a universal default.

Use the actual platform stack. Semantic Kernel, Synapse, Cosmos DB, Azure Speech and GPT-4o are historical choices, not required for every new proposal. A source architecture diagram is an example of data flow, not proof the new implementation has the same components.

## Company voice and credentials

Use formal business prose, bold topic labels, compact action bullets and clear ownership. The Why atQor table has **Aspect / atQor's Strengths / Value to Clients** and ten source aspects. Choose relevant entries without making up a stronger capability, award or certification. Original wording is in page-indexed `source-text.txt`; proprietary corporate statements may be reused for atQor with grammar corrections that do not change their meaning.

Link the proposed solution to the client's actual problem before generic company marketing. Retain the source's company art and legal identity for atQor-authored collateral. No client logo appears in the original.

## RFP response overlay

Read the current RFP completely, including attachments/amendments. Preserve its reference IDs, mandatory forms, order, word/page limits, pricing schedules and submission rules. Build a working compliance matrix:

| RFP ID | Requirement | Mandatory/optional | Response and evidence | Included/option/deviation | Dependency | Proposal section |
| ------ | ----------- | ------------------ | --------------------- | ------------------------- | ---------- | ---------------- |

Do not assert compliance without solution or evidence. State partial coverage and commercial options explicitly. Preserve mandatory commitments the user adopts; surface contradictions or unsupported requirements rather than burying them in exclusions. Use current credentials and experience supplied by the user, not invented references. Submission contacts/deadlines are source facts, not permission to submit or contact anyone.

## Completion checks

One feature cannot be both included and excluded. Identity login is not proof of RLS. Chat/session history is distinct from audit events. Customer-created SAP views, ingestion into a warehouse and runtime SELECT access are separate work/permission boundaries. Implementation fees must match resource/milestone basis, and support must appear consistently in scope, schedule and price. Signatures and approval dates stay unexecuted for a new proposal unless supplied for it.
