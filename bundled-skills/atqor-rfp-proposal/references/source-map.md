# Arvind proposal evidence

Source: `assets/reference.pdf`, **27 pages**, cover “AI Based MIS Insights / Arvind Limited / 12th June 2025”. Original filename: `Proposal_AI Based MIS Insights_v3.0.pdf`. Asset/hash evidence is in `asset-manifest.json`. All page numbers below are physical PDF pages.

| Pages | Contents and reusable methods                                                                                                                                                           |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | Blue cover ribbon, title/client/date, atQor logo/contact, Microsoft Preferred/Solutions Partner/Azure Expert MSP strip, historical ISO/award caption.                                   |
| 2     | Contents; supplier proposal progression with repeated section number 4.                                                                                                                 |
| 3     | Revision/control/confidentiality tables and clauses.                                                                                                                                    |
| 4     | Project/client/account manager/date/author/version matrix; prepared-by/approved-by roles and source signatures.                                                                         |
| 5-6   | Executive Summary, atQor introduction/achievements, Microsoft competencies collage and expertise; stray HR-screening claim.                                                             |
| 7-8   | Ten-row Why atQor table linking aspect, strength and client value.                                                                                                                      |
| 9     | Operational/profitability business objective and functional access/data/AI/chat/voice scope.                                                                                            |
| 10    | Session persistence; technical authentication, data model, Semantic Kernel orchestration, domain/SQL/response agents, 30 views/40 arithmetic logic items, web/voice and Cosmos history. |
| 11    | Solution diagram; customer data/SQL-view assumptions and 50-row UI/CSV export boundary.                                                                                                 |
| 12-13 | Access/data quality/platform/identity/runtime read-only conditions, sample query/SME input, English input/voice, response RBAC exclusion, change control and hypercare.                 |
| 13-14 | Customer access/provisioning/view/schema/walkthrough/test prerequisites; Azure service component descriptions.                                                                          |
| 15-16 | Deliverables and extensive exclusions; includes contradictions concerning voice, charts and access.                                                                                     |
| 17    | Thirty-calendar-day hypercare support and optional AMS.                                                                                                                                 |
| 18-19 | Phase/module/description/duration schedule, including UI/API/AI/schema/orchestration/memory/test/UAT/deploy/hypercare; stated 97 days.                                                  |
| 20-23 | Azure estimates: service, region, configuration, workload/remarks, service role, monthly price; total INR 52,269.43.                                                                    |
| 24    | Service/cloud fee summary, resource mix, four-month plan, four milestone payments, invoice terms.                                                                                       |
| 25-26 | Contract assumptions, legal supplier identity, tax/license/travel/responsibilities/change control, remote delivery and decision turnaround.                                             |
| 27    | Scope/commercial baseline, change requests, current supplier/client sign-off fields with historical source name/title/date.                                                             |

## Historical facts, not new-project defaults

The reference proposes English management queries over HRMS, Production, Spinning, Stoppages and Profitability data. It describes customer-created SAP views -> physical Synapse tables -> generated read-only SQL, Semantic Kernel orchestration, Entra sign-in, an Azure-hosted desktop web app, text/tables/charts and persistent Cosmos DB sessions. It counts 30 views, around 20 columns/view, 40 arithmetic logic items, 50 displayed rows and CSV export beyond that.

Source commercials: implementation INR 1,950,000; monthly cloud estimate INR 52,269.43 (summary rounds to 52,269); 2 AI developers plus 0.5 architect, 0.5 data engineer and 0.5 project manager = 3.5 resource equivalents; four months; four INR 487,500 payments. Source cloud model uses 5 users, several agent/token assumptions and 22 days. These values are evidence for a calculation method, not a current quote or universal limit.

## Contradictions and ambiguities

| Pages/evidence                                                                                | Issue                                                                                | Treatment in a new document                                                                            |
| --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| Filename v3.0; p3-4 Version 2.0; cover 12 June versus submitted/signature 11 June 2025        | Metadata can be inconsistent, though issue/submission dates can legitimately differ. | Define dates by role and keep the intended version coherent.                                           |
| p2/9 Proposed Scope = 4; p17 Hypercare = 4                                                    | Duplicate numbering.                                                                 | Use unique numbering and regenerate the contents.                                                      |
| p5 HR Bot for first-level candidate screening; p9 MIS/profitability objective                 | Stray reuse from another proposal.                                                   | Write the current client's actual outcome.                                                             |
| p9-10, 13-15, 18-19 and 23 include voice/Speech; p16 text-only/no voice                       | Voice both promised and excluded, including cost.                                    | Decide voice scope once; align UI, services, schedule, deliverables, exclusions and costs.             |
| p9-10 access roles/RBAC; p13/16 response RBAC excluded                                        | Authentication/app authorization versus data-level filtering unclear.                | Specify each security layer; no assumption that Entra sign-in enforces data restrictions.              |
| p10 on-premises warehouse; p10-14 Synapse                                                     | Target data platform unclear.                                                        | Confirm actual endpoints/storage; make diagram, scope and prerequisites agree.                         |
| p11 structured/clean data; p18 cleaning/schema profiling                                      | “No transformation” does not match cleaning activities.                              | Separate ingestion/mapping/profiling from agreed cleansing/ETL with owners and limits.                 |
| p11 customer-created views; p19 SQL view creation by delivery team                            | Creation responsibility differs.                                                     | Specify customer source-view responsibility and supplier target/derived-view work separately.          |
| p12 runtime read-only, but stored-procedure creation needs writes                             | Build privileges and runtime access mixed.                                           | Separate authorized deployment DDL from runtime SELECT-only querying; no data writeback.               |
| p10/12 session logs/personalization; p16 activity/audit trails excluded                       | History may be mistaken for audit logging.                                           | Distinguish conversation store, operational telemetry and detailed audit features/retention.           |
| p9-10 chart output; p15 excludes rich visualizations/report dashboards                        | Response charts versus advanced BI unclear.                                          | Define allowed chart types and interactivity; separate response charts from dashboards.                |
| p18-19 durations 10+5+20+15+7+5+5+30 = 97; p24 four months; working-day rule p25              | Mixed duration units and support calendar days.                                      | State units/overlap; do not equate 97 working days plus calendar support to four months automatically. |
| p20 Cosmos region label Central India, configuration East US; 800 RU/s versus remarks 1200 RU | Region/capacity basis mismatch.                                                      | Use one billable SKU/region/throughput basis and recalculate.                                          |
| p11 UI max 50 rows; p22 response-token estimate assumes 100 rows                              | Display and model-processing counts differ.                                          | Confirm returned-versus-displayed rows and token basis.                                                |
| p17 only production/data bugs; missed UAT issues through change management                    | Defect coverage could be ambiguous.                                                  | Define defect versus enhancement, severity/coverage and warranty/hypercare boundary explicitly.        |

Preserve the historical PDF unmodified. For a review, cite these physical pages and explain the consequence. For a new proposal, use the new brief to resolve the issue before representing it as an agreed commitment.
