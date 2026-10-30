# atQor visual system

The retained PDF and rendered pages are the visual authority. Text extraction cannot describe graphics, overlap, spacing or table geometry. The user specifically requested logo and layout preservation.

## Measured source design

- A4 portrait, source MediaBox **595.32 x 841.92 pt**. Body left about **50.8 pt**, right about **35-45 pt** depending on tables; normal usable width around **504 pt**. Main content begins about **98-115 pt** on ordinary pages, below the logo; table/content height ends before the footer around **782 pt**.
- Recurring atQor logo near **x50.8, top35.4 pt**, displayed about **99 x 31 pt**. The active original is retained as `assets/brand/atqor-logo.png` (175 x 55 px). Use its actual aspect ratio and original colors. The cover uses a matching JPEG displayed about **134 x 42 pt**, centered at top445 pt. The PDF also embeds an inactive 347 x 109 Bitscape logo; never use that legacy object as the atQor logo.
- Cover ribbon starts around **x17.55, top20.4 pt**, with original geometry **602.63 x 101.7 pt** clipped at the right page edge. The visible blue artwork combines an underlying gray raster with PDF vector graphics. `cover-ribbon.png` is a lossless crop of the visible blue result at 300 dpi, with visible width **577.77 pt**. Reproduce this placement and aspect ratio; do not use the gray embedded raster alone.
- Cover title/client are centered around top260-300 pt, Calibri bold about **16 pt**, black. Date is centered around top320-330 pt, about **12 pt**. Match the source's generous whitespace. Long new titles may wrap without moving into logos.
- Centered logo and `E: info@atqor.com` contact follow; preserve the contact for atQor unless updated by the user. Source partner credential artwork lies around top550-680 pt; keep its own aspect ratio. The two templates have different badge strips; each skill retains its own.
- Source caption under credentials is small gray italic text, about **10 pt**, reporting ISO 9001/27001 and 2017/2015/2014/2013 awards. Do not infer newer credentials from these historical claims.
- Body text: mostly **Calibri 12 pt**, black, paragraph spacing and nested bullet hierarchy. Bold labels introduce capabilities and technical components. Some dense proposal tables use smaller body type; avoid unreadable shrinking.
- Major headings: mostly **Segoe UI Bold 16 pt**, blue **#2F5496** (PDF RGB approximately 0.184/0.329/0.588). Source blue separators extend across the content width under major headings. Preserve them because the explicit supplied template overrides generic no-rule styling.
- Subheadings: Segoe UI or Calibri around **12-15 pt**, blue; technical labels often bold black. Proposal uses numbered headings; SoW uses mostly unnumbered main headings. Keep a coherent hierarchy and unique numbering.
- Control tables: dark blue headers **#305496**, white labels, dark borders, white values. Why atQor tables: three columns, white headers/body, black borders. Timeline and service-estimate headers: pale blue around **#D9E2F3** or pale blue-green; content white, black grid. Proposal fee/resources/payment tables additionally use cyan outlines with gray headers. Prefer these table styles by purpose instead of making all tables identical.
- Footer: thin dark rule near **top788 pt**, **“Confidential to atQor”** on the left and **“Page X of Y”** on the right, mostly **Trebuchet MS 10 pt**. Cover has no ordinary footer. Footer and page counts must reflect the new document.
- Contents title is centered blue, followed by heading labels, dotted leaders and actual page numbers. Regenerate it after pagination; never copy original numbers.
- Sign-off uses two columns with ample vertical space and aligned signature/name/title/date fields. Keep sufficient writing space; never copy source signatures as artwork.

## Brand assets

`assets/brand/` holds exact decoded active logos/credential/competency artwork, a rendered visible-blue ribbon crop, and the historical architecture image. See `asset-manifest.json` for formats, hashes and origins. The proposal cover partner strip is a lossless crop of a 150-dpi Poppler render because it is not one standalone embedded image. Inspect rendered appearance when selecting PDF image objects; inactive legacy graphics are not the visual authority. Do not redraw logos with text, image generation or approximate vector shapes. Do not recolor, distort, crop away parts of a logo, add invented customer logos or change marks into a different company's credentials.

Architecture diagrams are project-specific. Keep the retained diagram for understanding; generate a current diagram when systems, responsibilities or security boundaries differ. For the same engagement, preserve it only if the new scope remains compatible. Reuse genuine supplied service icons where available.

## Reflow and quality

Preserve design and structure, not the historical page count or large accidental gaps. Allow new content to flow naturally. Repeat table headers across page breaks; avoid splitting a row when it will fit intact. Do not create giant rows with many paragraphs; split configuration from workload details when required for readability. Keep headings with their first paragraph, and tables/diagrams inside margins. Preserve a readable body size rather than compressing a long brief into old pagination.

New output should contain real selectable text and native tables, with brand images for genuine artwork only. For Word use actual page/section settings, styles, header/footer fields and native tables. For PDF embed fonts and use measured page/layout settings. Render the final artifact and inspect every page, including cover/control/contents, all split tables, diagrams and sign-off. Fix missing marks, distorted badges, font substitutions, glyph issues, clipping, overlaps and stale pagination before delivery.
