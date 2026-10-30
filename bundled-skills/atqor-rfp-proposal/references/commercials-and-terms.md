# Commercial and contract writing method

## Cost structure

Use the source table method, with current scope and rates:

- Cloud line items: **Service / Region / SKU and configuration / Usage assumptions / Role of service / Estimated monthly cost**. Long assumptions may use an adjacent detail table to preserve readability.
- Service summary: **Description / Total Value in currency**, separating one-time delivery fees from recurring consumption, licensing and optional support.
- Resources: **Resource Type / Count or allocation**, period and effort basis. Fractional counts are allocation/FTE equivalents, not fractional people; identify rates or source pricing when a rate-based calculation is used.
- Payments: **Milestone / Acceptance or billing event / Amount or percentage**. Distinguish calendar-month billing from deliverable-triggered payment.

Never silently reuse historical rates, model versions, regions, budgets, resource counts or payment terms. If the user supplies rates, retain their date/currency/basis; if current pricing is requested, verify current authoritative rates. If no rate can be verified, label the provisional estimate and its basis instead of presenting it as a quote.

## Workload and arithmetic

Define queries/day as **per user** or **all users**. For per-user usage:

`monthly queries = users x queries per user per day x working days`

`agent calls = monthly queries x calls per query for that agent`

`input/output tokens = agent calls x average input/output tokens per call`

`token cost = input tokens / billing unit x input rate + output tokens / billing unit x output rate`

Embeddings, cached inputs, multiple agents, retries and optional modalities need their own documented basis if relevant. Do not multiply users twice, assume every agent is called for every question without explaining it, or conflate model calls and end-user queries.

For compute, database and search use actual unit counts/hours/capacity/storage/region and billing period. For speech use hours and rate; source 2 hours/day x 22 days = 44 hours illustrates the method. Include all scoped services, pipeline/platform capacity, secrets/monitoring/network/storage where billable, without inventing a required stack. Use Decimal calculations, round consistently and disclose whether tax is included.

Verify all line items and subtotals; payment percentages must sum to 100% or explain the unpaid balance. Source four payments of INR 487,500 correctly sum to INR 1,950,000. Source cloud line items sum to INR 52,269.43. Neither amount is a default.

State quote date, currency, monthly versus one-time basis, usage variability, excluded taxes/license/travel charges, and validity only when supplied or explicitly proposed.

## Timelines and hypercare

Use phase/module/description/duration and make units explicit. The historical phase numbers sum to 97 including 30 calendar days of hypercare; the proposal also says four months and Monday-Friday working days. Resolve scheduling units and parallel work in a new estimate. Resource allocation, delivery period and milestone amounts should agree with the proposed plan.

Support language should name the go-live/start trigger, coverage duration/unit, permitted defect fixes, response coverage, customer duties, exclusions and optional transition to AMS/AMC. Do not add an SLA, unlimited enhancements or penalty commitment because an example mentions support.

## Contract clauses to preserve when applicable

Source pp25-27 identify **atQor Technologies Private Limited** as legal PO/contract supplier. For atQor-authored proposals use the actual legal parties supplied for the new engagement. Preserve applicable source clause families and economic intent:

- Mutual handling of material scope/requirement/complexity changes and their schedule/cost impacts.
- Additional taxes; customer-owned licensing/subscriptions and agreed infrastructure/expenses.
- Customer dependencies and delays beyond supplier control.
- Remote delivery, travel billed on actual where required, and Monday-Friday/public-holiday assumptions when adopted.
- Signed/approved change orders for out-of-scope work, with agreed time-and-material or other pricing.
- Optional ongoing consulting/support under a separate arrangement.
- Customer project owner/decision authority, required information/work environment and decision turnaround when agreed.
- Invoice/payment basis and due period; source seven-day deadlines are historical terms, not defaults.
- Scope/commercial baseline and unsigned two-party sign-off.

The source repeats remote-delivery clauses; consolidate only without changing meaning. Its “instance” expense wording is unclear; use agreed expense categories rather than guessing. Do not invent liability caps, indemnities, IP transfer, warranty, regulatory guarantees or binding procurement terms. A requested review/change can flag material legal/economic effects in the accompanying explanation without unsolicited approval loops.
