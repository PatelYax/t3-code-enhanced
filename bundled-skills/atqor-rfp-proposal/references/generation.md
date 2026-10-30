# PDF generation helper

`scripts/build_pdf.py` creates selectable text, native tables, genuine brand images, a generated contents page, PDF bookmarks, and correctly counted page footers. It provides the common visual scaffold; it does not invent the scope, calculate a quote, or resolve the current project's business decisions. Read the authoring and source-conflict guides before building.

Use the Python/runtime and packages returned by `load_workspace_dependencies`. Required packages are `reportlab` and its normal imaging dependencies. On Windows the helper embeds the installed Calibri, Segoe UI Bold and Trebuchet MS fonts from `C:/Windows/Fonts`. If fonts are unavailable, it prints substitutions that must be reviewed; supply `--font-dir` with actual font files or use another verified authoring path. Do not install dependencies into a managed runtime.

Create a task-local UTF-8 JSON spec under the task's working directory and call:

```text
<bundled-python> <skill-path>/scripts/build_pdf.py --spec <work-path>/document.json --output <deliverables-path>/Project_SoW.pdf
```

For a proposal choose the proposal skill's helper so it uses that skill's credential strip. Each helper resolves assets relative to its own skill folder; no Downloads or original-machine path is required after installation. It refuses an existing output path; choose a new draft name when iterating and retain the original artifact.

## Specification

Top-level fields:

- Required: `title`, `client`, `date_display`, `sections`. Supply current project values; the helper deliberately has no historical client/date defaults.
- Optional: `issuer` (default `atQor`), `contact`, `confidentiality` (default `Confidential to <issuer>`), `toc` (default true), `logo_path`, `include_credentials`, `credentials_path`, `credentials_caption`.
- A different issuer requires its own `logo_path`. Set `include_credentials: false` for buyer-issued RFPs or non-atQor collateral unless those supplied credentials actually belong to the issuer. Do not transfer partner claims.
- Image paths can be absolute or relative to the spec's directory. Keep current client assets in the task workspace; do not write them into the retained skill.
- `sections`: objects with `heading`, `blocks`, optional `page_break_before` (default true after the first), optional `toc` (default true). Use coherent explicit heading numbers for proposals; the helper never creates duplicate numbering. Set page breaks according to the current content, not old page counts.

Supported blocks:

```json
{
  "title": "Project title from the current brief",
  "client": "Current client",
  "date_display": "Current issue date",
  "sections": [
    {
      "heading": "Executive Summary",
      "blocks": [
        { "type": "paragraph", "text": "Current business outcome and delivery boundary." },
        { "type": "h2", "text": "Capabilities" },
        { "type": "bullets", "items": ["One included capability and its outcome."] },
        {
          "type": "table",
          "headers": ["Deliverable", "Acceptance"],
          "rows": [["Current artifact", "Agreed measurable check"]],
          "widths": [1, 2],
          "style": "pale"
        }
      ]
    }
  ]
}
```

Additional blocks: `image` with `path`, optional `width_pt` and `max_height_pt`; `signatures` with two current `parties` (or default issuer/client), leaving all fields blank; `page_break`. Never add bilateral signature commitments to a buyer RFP automatically. Bullet `level` adjusts indentation; use 0 for primary and 1 for sub-bullets. Paragraph/bullet `html: true` permits deliberate ReportLab inline markup such as `<b>Purpose:</b>`; plain text is escaped by default.

Table widths are positive relative weights. `style: control` gives dark blue/white headers; `plain` gives white headers; `pale` gives pale blue headers. Headers repeat when a table splits across pages. Use smaller focused tables and separate workload details from configurations if a row would exceed a page. The helper is a baseline; adapt task-local authoring for source-specific cyan/gray commercial tables or a more complex layout.

## Review gate

Run the available PDF skill's required artifact-start marker before authoring, where that environment requires it. After building, reopen the file, check content and counts, render using bundled Poppler and inspect **every** page. Confirm the correct template's badge strip, undistorted logos, current parties/metadata, readable tables, page totals and actual contents numbers. Also complete the skill's substantive scope/commercial consistency checks. Generated content remains selectable; screenshots of source pages are not a substitute for a newly authored document.
