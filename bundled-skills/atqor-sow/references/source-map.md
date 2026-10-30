# HRIPL reference evidence and adaptation

Source: `assets/reference.pdf`, **29 pages**, cover “Chatbot POC / HRIPL / 30th January 2026”. The original filename is `SoW_Chatbot_POC_HRIPL_v0.2.pdf`. Retained hash and extracted asset provenance are in `asset-manifest.json`. Page numbers below are physical PDF pages.

| Pages | Content and reusable evidence                                                                                                                                                                                         |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | Cover: blue ribbon, project/client/date, atQor logo and info@atqor.com, Microsoft partner credential strip, ISO and historical award caption.                                                                         |
| 2     | Contents: Document Control, Executive Summary, Proposed Scope, Architecture, Success/Acceptance, Timeline, Consumption, Sign-Off.                                                                                     |
| 3     | Revision table, digital-master/hardcopy-control explanation, document-reference table and proprietary/confidentiality clause.                                                                                         |
| 4     | Microsoft competencies collage and corporate expertise paragraphs.                                                                                                                                                    |
| 5-6   | Why atQor table: Aspect / Strengths / Value to Clients. Ten aspects: Microsoft expertise, track record, capabilities, global delivery, industries, data/AI, integration, customer focus, scalability, certifications. |
| 7-8   | Outcome-first executive summary and nine supported sales/master/planning domains.                                                                                                                                     |
| 9-10  | Domains, Silver-to-Gold transformations, calculations, schema/metadata/vector search, read-only runtime boundary, intent classifier.                                                                                  |
| 11-13 | Functional, metadata, NL-SQL, graph and context agents, each described by Purpose / How It Works; follow-up dialogue example; query monitoring and user interface.                                                    |
| 14-17 | Text/table/graph behavior, assumptions, schema boundary, data mappings/quality, analytics/time/output limitations and exclusions.                                                                                     |
| 18-19 | Exclusions and customer/platform prerequisites, access, quotas, metadata and test queries; deliverables begin.                                                                                                        |
| 19-20 | Teams agent, Gold pipeline/calculations, metadata/vector index, SSO/MFA and short-term context deliverables.                                                                                                          |
| 21    | Architecture artwork: Teams -> Azure environment; App Service/Bot, Fabric, Foundry, Search, Cosmos DB, Key Vault, Log Analytics.                                                                                      |
| 22    | Proposed success targets and completion/UAT criteria.                                                                                                                                                                 |
| 23-24 | Phase/module/description delivery table; stated POC duration 7-8 weeks.                                                                                                                                               |
| 25-28 | Agent token estimates and Azure service configurations; source monthly total INR 39,127.28.                                                                                                                           |
| 29    | Scope/change-request baseline and two-column unsigned supplier/client sign-off.                                                                                                                                       |

## Historical project model

- Six views: material, customer, primary sales, distribution-channel master, annual plan, monthly plan.
- Nine domains: material, customer, channel, sales actuals, GST/HSN/E-way, pricing/discount/MRP, AOP, monthly plan, actual versus plan.
- Material hierarchy names differ by section. Mapping, plant/channel formats and territory alignment require business confirmation. EtprCode has no material hierarchy mapping; stock transfers with null BillTo cannot support customer/GSTIN analysis. Credit/outstanding fields do not supply AR aging.
- Source common plan-matching grain is month/year, plant and channel; one passage adds SaleType. Historical metrics include actual quantity/value, taxes, discounts, price variance and YTD aggregates.
- English text only; native Teams; text, tables, image graphs (line/bar/pie); short context of 3-5 turns; direct SAP APIs, extra data views, prediction, RLS, advanced portals and unstructured inputs excluded.
- Proposed source targets: >=90% correct query translation/results; >=90% responses within 30s with exclusions; >=85% context accuracy; 100% Gold calculation match; >=99% business-hours availability. These require an agreed new measurement plan, not blind adoption.

## Conflicts that must not become a new contract

| Evidence                                                                                   | Issue                                              | New-document treatment                                                                                     |
| ------------------------------------------------------------------------------------------ | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Filename v0.2; p3 Version 0.1 / 30 January 2026                                            | Version mismatch.                                  | Align filename, cover/revision metadata and current history.                                               |
| Cover/closing timeline POC; p7/19 production-ready/production agent                        | Engagement-stage ambiguity.                        | State POC, pilot or production with its actual deployment and handover obligations.                        |
| p13 separate monitoring/audit web interface; p18 excludes audit and performance dashboards | Dashboard promised and excluded.                   | Decide telemetry/logging versus dashboard scope; use one consistent statement.                             |
| p10 no new tables/views except metadata/state; p18-20 Gold tables/views/pipeline creation  | Runtime versus build permissions blurred.          | Runtime agent SELECT-only can coexist with authorized deployment/data engineering writes; name both roles. |
| p19 role-based security via Entra; p17 row-level security excluded                         | Authentication can be mistaken for data filtering. | Distinguish sign-in, application roles and RLS; only promise each agreed layer.                            |
| p7/15 MG1-MG5; p7/9/19 MG14-MG18                                                           | Hierarchy aliases uncertain.                       | Obtain actual schema/mapping; avoid silently equating them.                                                |
| p15 plant/channel/month; p16 adds SaleType and year                                        | Plan grain differs.                                | Define validated matching dimensions, key formats and allowed aggregation.                                 |
| p13-14 SBG, Capital Employed examples; p17 ROI/resource utilization examples               | Examples from a different business context.        | Replace with current supported data; no domain expansion by example.                                       |
| p24 Downloadable Excel; p18 excludes processing Excel                                      | Input/output may be conflated.                     | Decide export separately from uploads; implement only promised export formats.                             |
| p27 Graph input stated 2,744 thousand; remarks calculate 2,750,000                         | Workload mismatch.                                 | Recompute usage and use matching quantities and billable units.                                            |
| p27 Search “2 units, 24 hours”; other monthly services 730 hours                           | Monthly basis incomplete or possibly understated.  | Set actual billable quantity/hours and billing period.                                                     |
| p25-28 line items sum INR 39,127.29 versus displayed 39,127.28                             | Rounding discrepancy.                              | Recalculate using Decimal/current unit rates; disclose rounding.                                           |

Retain the originals unchanged for provenance. Correct contradictions in a new draft; for a review of the original, report them with these page references instead of silently rewriting commercial meaning.
