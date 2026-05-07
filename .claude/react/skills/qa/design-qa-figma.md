---
skill_name: design-qa-figma
applies_to_local_project_only: true
auto_trigger_regex: [design qa, design-qa, pixel-perfect, qa report, visual comparison, design verification, figma qa]
tags: [qa, design-qa, figma, pixel-perfect]
related_skills: [figma-to-react-converter, design-qa-html]
description: Design QA skill for verifying React implementations against Figma designs using the Figma REST API with personal access token.
---

# Design QA Guide (Figma)

Verify implemented screens against Figma designs using the **Figma REST API** to ensure pixel-perfect accuracy.

---

## Figma API Setup

### Token Configuration

> **Use the `design@potentialai.com` Figma account** for generating personal access tokens.

Token is stored at: `.claude-project/secrets/figma-token.env`

```bash
# .claude-project/secrets/figma-token.env
FIGMA_TOKEN=figd_xxxxx...
```

To create a new token:
1. Log in to Figma as `design@potentialai.com`
2. Go to Settings → Account → Personal access tokens
3. Create token with `file_content:read` scope
4. Save to `.claude-project/secrets/figma-token.env`

### API Endpoints

| Endpoint | Purpose | Replaces |
|----------|---------|----------|
| `GET /v1/files/:file_key/nodes?ids=:node_id&depth=3` | Design data (styles, layout, colors, typography) | Design context |
| `GET /v1/images/:file_key?ids=:node_id&format=png&scale=2` | Rendered screenshot (returns URL to download) | Visual screenshot |
| `GET /v1/files/:file_key` | File metadata and structure overview | Metadata |

**Base URL**: `https://api.figma.com`
**Auth Header**: `X-Figma-Token: $FIGMA_TOKEN`

### API Call Pattern

```bash
source .claude-project/secrets/figma-token.env

FILE_KEY="<from-figma-url>"
NODE_ID="<colon-format>"  # e.g., 16297:54644

# Screenshot
curl -s -H "X-Figma-Token: $FIGMA_TOKEN" \
  "https://api.figma.com/v1/images/$FILE_KEY?ids=$NODE_ID&format=png&scale=2" \
  -o /tmp/figma_images.json

IMAGE_URL=$(jq -r ".images[\"$NODE_ID\"]" /tmp/figma_images.json)
curl -s "$IMAGE_URL" -o /tmp/figma_screenshot.png

# Design data
curl -s -H "X-Figma-Token: $FIGMA_TOKEN" \
  "https://api.figma.com/v1/files/$FILE_KEY/nodes?ids=$NODE_ID&depth=3" \
  -o /tmp/figma_node.json
```

---

## Fidelity Scoring System

### Category Weights

| Category | Weight | What's Measured |
|----------|--------|-----------------|
| **Layout Structure** | 25% | Component hierarchy, flex/grid patterns, alignment |
| **Spacing** | 20% | Padding, margin, gap values |
| **Typography** | 20% | Font size, weight, color, line-height |
| **Colors** | 15% | Background, text, border colors |
| **Visual Effects** | 10% | Border radius, shadows, opacity, transitions |
| **Components** | 10% | Element presence, icons, interactive states |

### Scoring Formula

```
Category Score = (matching_properties / total_properties_in_category) * 100

Overall Fidelity = sum(category_score * category_weight)
```

### Rating Thresholds

| Score | Rating | Action Required |
|-------|--------|-----------------|
| 95-100% | Pixel Perfect | Ready for release |
| 85-94% | Minor Issues | Fix before release |
| 70-84% | Needs Work | Review required |
| <70% | Major Revision | Significant rework needed |

---

## When to Use This Guide

- Verifying implemented screens match Figma designs
- QA review before release or PR merge
- Identifying visual discrepancies
- Generating QA reports with fidelity scores

---

## Quick QA Workflow

```
1. Discover Projects → ls -d frontend*

2. Ask User to Select Project → "Which project to QA?"

3. Load Status File
   → .claude-project/status/{project}/SCREEN_IMPLEMENTATION_STATUS.md

4. Select Screen(s) → From status file OR Figma URL OR "all" for full project QA
   → For batch mode: load all screens from status file

5. For each screen:
   ┌────────────────────────────────────────────────────┐
   │ FETCH VIA FIGMA API:                               │
   │ • Images API → download screenshot PNG             │
   │ • Nodes API → get design data JSON                 │
   │ • Read implementation file                          │
   └────────────────────────────────────────────────────┘
   Then compare values, calculate fidelity score, and document discrepancies

6. Calculate Project-Wide Fidelity (if multiple screens)

7. Generate Report → Summary with fidelity scores and specific Tailwind fixes

8. Update Status File → Write fidelity scores back per screen
```

---

## Phase 0: Screen Extraction (Batch Mode)

For projects with many screens, extract all screens first before running QA.

### Step 1: Extract Screens

Run the extraction command:
```
/figma-extract-screens <figma-url>
```

This fetches all SECTION/FRAME children from the Figma node and lists them in:
```
.claude-project/status/{project}/SCREEN_IMPLEMENTATION_STATUS.md
```

### Step 2: Review Screen List

The status file contains a table like:

```markdown
| Screen Name | Node ID | Figma Link | Status | Fidelity |
|-------------|---------|------------|--------|----------|
| Dashboard | `16297:54644` | [View](...) | To Map | - |
| Login | `16297:54700` | [View](...) | To Map | - |
| Settings | `16297:54800` | [View](...) | To Map | - |
```

### Step 3: Run QA in Batches

Process screens in batches of 5 to manage API rate limits and context:

```
Batch 1: Screens 1-5  → Fetch API data → Compare → Score → Update status
Batch 2: Screens 6-10 → Fetch API data → Compare → Score → Update status
...
Final: Calculate project-wide fidelity → Generate consolidated report
```

### Step 4: Skip Already-Reviewed Screens

When re-running QA, filter by fidelity score:
- Skip screens with 95%+ fidelity (Pixel Perfect)
- Re-check screens with <95% fidelity or status "To Map"

---

## Phase 1: Project Selection

Scan for frontend projects:

```bash
ls -d frontend* 2>/dev/null
```

Locate status file:
```
.claude-project/status/{project-name}/SCREEN_IMPLEMENTATION_STATUS.md
```

---

## Phase 2: Screen Selection

### Option A: From Status File
Parse and present screens by category from the status file.

### Option B: Direct Figma URL
```
Figma URL: https://www.figma.com/design/{fileKey}/{fileName}?node-id={nodeId}

Extracted:
- File Key: {fileKey}
- Node ID: {nodeId} (convert hyphen to colon for API: 123-456 → 123:456)
```

### Option C: By Route
Match route to Figma design from status file.

---

## Phase 3: Figma Data Retrieval

For each screen, fetch both screenshot and design data via the Figma REST API.

### Step 1: Get Screenshot

```bash
source .claude-project/secrets/figma-token.env

FILE_KEY="<file-key>"
NODE_ID="<node-id-colon-format>"  # e.g., 16297:54644

# Fetch image URL
curl -s -H "X-Figma-Token: $FIGMA_TOKEN" \
  "https://api.figma.com/v1/images/$FILE_KEY?ids=$NODE_ID&format=png&scale=2" \
  -o /tmp/figma_images.json

# Download the screenshot PNG
IMAGE_URL=$(jq -r ".images[\"$NODE_ID\"]" /tmp/figma_images.json)
curl -s "$IMAGE_URL" -o /tmp/figma_screenshot_${NODE_ID//:/_}.png
```

View the screenshot using Read tool on the downloaded PNG.

### Step 2: Get Design Data

```bash
# Fetch node design data (depth=3 for detailed styles)
curl -s -H "X-Figma-Token: $FIGMA_TOKEN" \
  "https://api.figma.com/v1/files/$FILE_KEY/nodes?ids=$NODE_ID&depth=3" \
  -o /tmp/figma_node_${NODE_ID//:/_}.json
```

### Step 3: Extract CSS Values from JSON

Parse the node JSON to extract design values:

```python
import json

with open('/tmp/figma_node_16297_54644.json', 'r') as f:
    data = json.load(f)

node = list(data['nodes'].values())[0]['document']

# Extract layout
layout_mode = node.get('layoutMode', 'NONE')  # HORIZONTAL, VERTICAL
primary_axis = node.get('primaryAxisAlignItems', 'MIN')
counter_axis = node.get('counterAxisAlignItems', 'MIN')
item_spacing = node.get('itemSpacing', 0)

# Extract padding
padding_top = node.get('paddingTop', 0)
padding_right = node.get('paddingRight', 0)
padding_bottom = node.get('paddingBottom', 0)
padding_left = node.get('paddingLeft', 0)

# Extract colors (fills)
fills = node.get('fills', [])
for fill in fills:
    if fill.get('type') == 'SOLID':
        color = fill.get('color', {})
        r = int(color.get('r', 0) * 255)
        g = int(color.get('g', 0) * 255)
        b = int(color.get('b', 0) * 255)
        hex_color = f"#{r:02x}{g:02x}{b:02x}"

# Extract typography (from text children)
def extract_text_styles(node):
    if node.get('type') == 'TEXT':
        style = node.get('style', {})
        return {
            'fontSize': style.get('fontSize'),
            'fontWeight': style.get('fontWeight'),
            'lineHeightPx': style.get('lineHeightPx'),
            'letterSpacing': style.get('letterSpacing'),
        }
    results = []
    for child in node.get('children', []):
        result = extract_text_styles(child)
        if result:
            results.append(result) if isinstance(result, dict) else results.extend(result)
    return results

# Extract border radius
border_radius = node.get('cornerRadius', 0)
```

**Key JSON paths:**
| Figma Property | JSON Path | CSS Equivalent |
|----------------|-----------|----------------|
| Layout direction | `layoutMode` | `flex-direction` |
| Item spacing | `itemSpacing` | `gap` |
| Padding | `paddingTop/Right/Bottom/Left` | `padding` |
| Background | `fills[].color` | `background-color` |
| Border radius | `cornerRadius` | `border-radius` |
| Font size | `children[TEXT].style.fontSize` | `font-size` |
| Font weight | `children[TEXT].style.fontWeight` | `font-weight` |
| Line height | `children[TEXT].style.lineHeightPx` | `line-height` |

### Batch API Calls

When processing multiple screens, batch node IDs in a single API call:

```bash
# Comma-separate multiple node IDs
IDS="16297:54644,16297:54700,16297:54800"

# Single call for all screenshots
curl -s -H "X-Figma-Token: $FIGMA_TOKEN" \
  "https://api.figma.com/v1/images/$FILE_KEY?ids=$IDS&format=png&scale=2" \
  -o /tmp/figma_images_batch.json

# Single call for all node data
curl -s -H "X-Figma-Token: $FIGMA_TOKEN" \
  "https://api.figma.com/v1/files/$FILE_KEY/nodes?ids=$IDS&depth=3" \
  -o /tmp/figma_nodes_batch.json
```

---

## Phase 4: Implementation Review

Read the React component file and extract Tailwind classes to compare:

| Tailwind Class | Extracted Value |
|----------------|-----------------|
| `p-4` | padding: 16px |
| `gap-2` | gap: 8px |
| `text-sm` | font-size: 14px |
| `rounded-lg` | border-radius: 8px |

---

## Phase 5: Visual Comparison & Fidelity Calculation

### Step 1: Compare by Category

For each category, compare Figma values with implementation:

```markdown
## Category Comparison

### Layout (25% weight)
| Property | Figma | Implementation | Match |
|----------|-------|----------------|-------|
| Direction | flex-col | flex-col | YES |
| Alignment | items-center | items-start | NO |
| Justify | justify-between | justify-between | YES |

**Layout Score**: 2/3 = **66.7%**

### Spacing (20% weight)
| Property | Figma | Implementation | Match |
|----------|-------|----------------|-------|
| Padding | 24px (p-6) | p-4 (16px) | NO |
| Gap | 16px (gap-4) | gap-4 | YES |
| Margin | 8px (m-2) | m-2 | YES |

**Spacing Score**: 2/3 = **66.7%**
```

### Step 2: Calculate Overall Fidelity

```markdown
| Category | Score | Weight | Weighted |
|----------|-------|--------|----------|
| Layout | 66.7% | 25% | 16.7% |
| Spacing | 66.7% | 20% | 13.3% |
| Typography | 100% | 20% | 20.0% |
| Colors | 87.5% | 15% | 13.1% |
| Visual Effects | 80% | 10% | 8.0% |
| Components | 100% | 10% | 10.0% |

**Overall Fidelity: 81.1%** (Needs Work)
```

### Visual Comparison Checklist

- [ ] **Layout**: Component hierarchy, flex direction, alignment
- [ ] **Spacing**: Padding, margin, gap (use `[Xpx]` for non-standard)
- [ ] **Typography**: Font size, weight, line-height, color
- [ ] **Colors**: Background, text, border (use `bg-[#hex]`)
- [ ] **Visual Effects**: Border radius, shadows, opacity
- [ ] **Components**: All elements present, icons match

---

## Phase 6: Fix Generation

### Fix Priority Levels

| Priority | Impact | Description |
|----------|--------|-------------|
| **Critical** | >5% | Layout breaks, missing components |
| **High** | 2-5% | Spacing mismatches, color errors |
| **Medium** | 1-2% | Typography differences |
| **Low** | <1% | Minor visual effects |

### Fix Format

```markdown
### Fix #1: Spacing - Container Padding
**Priority**: High | **Impact**: +2.5% fidelity
**Location**: `frontend/app/pages/dashboard.tsx:8`
**Figma**: padding: 24px
**Current**: `className="p-4"` (16px)
**Expected**: `className="p-6"` or `className="p-[24px]"`
```

---

## Phase 7: Report Generation

```markdown
# Design QA Report - Fidelity Scores

**Project**: {project-name}
**Date**: {date}
**Screens Reviewed**: {count}

## Executive Summary

| Screen | Fidelity | Rating | Fixes |
|--------|----------|--------|-------|
| Dashboard | 81.1% | Needs Work | 6 |
| Login | 96.2% | Pixel Perfect | 1 |

---

## Screen: {screen-name}

**Figma Node**: `{nodeId}`
**File**: `{filePath}`
**Overall Fidelity**: 81.1% (Needs Work)

### Category Scores

| Category | Score | Status | Issues |
|----------|-------|--------|--------|
| Layout | 66.7% | FAIL | 1 |
| Spacing | 66.7% | FAIL | 1 |
| Typography | 100% | PASS | 0 |
| Colors | 87.5% | PASS | 1 |
| Visual Effects | 80% | PASS | 1 |
| Components | 100% | PASS | 0 |

### Suggested Fixes (by priority)

| Priority | Fix | Impact | Location |
|----------|-----|--------|----------|
| High | Change p-4 to p-6 | +2.5% | line 8 |
| High | Change items-start to items-center | +2.0% | line 12 |
| Medium | Change text-gray-500 to text-[#6B7280] | +1.0% | line 15 |

### Estimated Post-Fix Fidelity: 94.0%
```

---

## All-Pages Fidelity Calculation

When running QA on multiple or all pages, calculate aggregate fidelity scores.

### Step 1: Collect Individual Screen Scores

After completing QA for each screen, compile results:

```markdown
## Individual Screen Scores

| Screen | Layout | Spacing | Typography | Colors | Effects | Components | Overall |
|--------|--------|---------|------------|--------|---------|------------|---------|
| Dashboard | 80% | 62.5% | 100% | 87.5% | 80% | 83.3% | 81.9% |
| Login | 100% | 95% | 100% | 90% | 100% | 100% | 96.2% |
| Settings | 75% | 80% | 85% | 95% | 90% | 80% | 82.5% |
| Profile | 90% | 85% | 95% | 100% | 85% | 90% | 90.8% |
```

### Step 2: Calculate Project-Wide Fidelity

**Simple Average Method** (equal weight per screen):
```
Project Fidelity = sum(screen_scores) / total_screens

Example: (81.9 + 96.2 + 82.5 + 90.8) / 4 = 87.9%
```

**Weighted Average Method** (weight by complexity/importance):
```markdown
| Screen | Fidelity | Weight | Weighted Score |
|--------|----------|--------|----------------|
| Dashboard | 81.9% | 30% | 24.57% |
| Login | 96.2% | 20% | 19.24% |
| Settings | 82.5% | 25% | 20.63% |
| Profile | 90.8% | 25% | 22.70% |

Project Fidelity: 87.1%
```

### Step 3: Category Breakdown (Project-Wide)

```markdown
## Project-Wide Category Scores

| Category | Average | Lowest Screen | Highest Screen |
|----------|---------|---------------|----------------|
| Layout | 86.3% | Settings (75%) | Login (100%) |
| Spacing | 80.6% | Dashboard (62.5%) | Login (95%) |
| Typography | 95.0% | Settings (85%) | Dashboard (100%) |
| Colors | 93.1% | Dashboard (87.5%) | Profile (100%) |
| Visual Effects | 88.8% | Dashboard (80%) | Login (100%) |
| Components | 88.3% | Settings (80%) | Login (100%) |

**Weakest Category**: Spacing (80.6%) - Priority for fixes
**Strongest Category**: Typography (95.0%)
```

### Step 4: Generate All-Pages Report

```markdown
# Design QA Report - All Pages Summary

**Project**: {project-name}
**Date**: {date}
**Total Screens**: {count}

## Project-Wide Fidelity

| Metric | Score | Rating |
|--------|-------|--------|
| **Overall Fidelity** | 87.9% | Minor Issues |
| Highest Screen | Login (96.2%) | Pixel Perfect |
| Lowest Screen | Dashboard (81.9%) | Needs Work |

## Rating Distribution

| Rating | Count | Percentage |
|--------|-------|------------|
| Pixel Perfect (95-100%) | 1 | 25% |
| Minor Issues (85-94%) | 1 | 25% |
| Needs Work (70-84%) | 2 | 50% |
| Major Revision (<70%) | 0 | 0% |

## Category Health

| Category | Project Avg | Status | Action |
|----------|-------------|--------|--------|
| Layout | 86.3% | PASS | - |
| Spacing | 80.6% | FAIL | Priority fixes needed |
| Typography | 95.0% | PASS | - |
| Colors | 93.1% | PASS | - |
| Visual Effects | 88.8% | PASS | - |
| Components | 88.3% | PASS | - |

## Priority Fix Queue (All Screens)

| Priority | Screen | Fix | Impact |
|----------|--------|-----|--------|
| Critical | Dashboard | Container spacing | +2.5% |
| Critical | Settings | Layout alignment | +2.0% |
| High | Dashboard | Gap values | +1.5% |
| High | Settings | Component padding | +1.2% |

**Estimated Post-Fix Project Fidelity**: 94.5%

## Screen-by-Screen Summary

| Screen | Route | Fidelity | Rating | Fixes Needed |
|--------|-------|----------|--------|--------------|
| Dashboard | /dashboard | 81.9% | Needs Work | 6 |
| Login | /login | 96.2% | Pixel Perfect | 1 |
| Settings | /settings | 82.5% | Needs Work | 5 |
| Profile | /profile | 90.8% | Minor Issues | 3 |
```

### All-Pages QA Command

When user requests "QA all pages" or "full project QA":

1. **Load Status File**:
   Parse all screens from `SCREEN_IMPLEMENTATION_STATUS.md`

2. **Batch Fetch Figma Data**:
   For each batch of screens, call both API endpoints (images + nodes) with comma-separated IDs.

3. **Batch Process**:
   For each Figma/React pair, run full fidelity calculation.

4. **Aggregate Results**:
   Calculate project-wide scores using formulas above.

5. **Generate Consolidated Report**:
   Single report with all screens and project summary.

6. **Update Status File**:
   Write fidelity scores back to each screen's row.

---

## Common Discrepancies

### Spacing Issues

| Issue | Figma | Common Mistake | Fix |
|-------|-------|----------------|-----|
| Non-standard padding | 18px | `p-4` (16px) | `p-[18px]` |
| Non-standard gap | 14px | `gap-3` (12px) | `gap-[14px]` |

### Typography Issues

| Issue | Figma | Common Mistake | Fix |
|-------|-------|----------------|-----|
| Non-standard size | 15px | `text-sm` (14px) | `text-[15px]` |
| Line height | 24px | default | `leading-[24px]` |

### Color Issues

| Issue | Figma | Common Mistake | Fix |
|-------|-------|----------------|-----|
| Custom gray | #6B7280 | `text-gray-500` | `text-[#6B7280]` |
| Custom primary | #FF6B35 | `text-orange-500` | `text-[#FF6B35]` |

---

## Troubleshooting

### Token Expired or Invalid (401/403)
Regenerate at Figma → Settings → Account → Personal access tokens. Save to `.claude-project/secrets/figma-token.env`.

### Node ID Not Found (404)
- Verify node exists in Figma file
- Node ID format: use colon `:` for API calls (not hyphen `-`)
- URL-encode colon as `%3A` if needed in query params (curl handles this automatically)

### Rate Limiting (429)
- Figma API has rate limits per token
- Use batch API calls (comma-separated IDs) instead of individual calls
- Add short delays between batches if hitting limits

### Status File Not Found
Run `/figma-extract-screens <figma-url>` first to generate the status file, or ask user for direct Figma URL.

---

## QA Session Completion Checklist

Before completing any Design QA session, verify:

- [ ] API screenshot fetches equal screen count
- [ ] API node data fetches equal screen count
- [ ] All screenshots visually reviewed
- [ ] All design data JSON parsed for CSS values
- [ ] All discrepancies documented with Figma px values
- [ ] Category scores calculated for each screen
- [ ] Overall fidelity score calculated per screen
- [ ] Project-wide fidelity calculated (if multiple screens)
- [ ] QA report generated with fidelity scores
- [ ] Status file updated with fidelity scores per screen

---

## See Also

- [Figma to React Converter](../converters/figma-to-react-converter.md) - Implementation guide
- [Design QA HTML](./design-qa-html.md) - QA against HTML prototypes
- [Figma Extract Screens](/figma-extract-screens) - Extract screen node IDs from Figma
