# Autonomous Exploration Mode - Implementation Guide

Complete implementation templates for building an autonomous exploration agent that navigates your application, interacts with features, and documents bugs.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Core Components](#core-components)
- [Bug Detection](#bug-detection)
- [Navigation Strategy](#navigation-strategy)
- [Form Handling](#form-handling)
- [Implementation Templates](#implementation-templates)
- [Bug Report Template](#bug-report-template)
- [Dynamic Status File Output](#dynamic-status-file-output)
- [NPM Scripts](#npm-scripts)

---

## Architecture Overview

```
e2e/autonomous/
├── exploration-agent.ts      # Main agent class
├── config.ts                 # Configuration types
├── navigation/
│   ├── link-extractor.ts     # Extract clickable elements
│   └── navigation-graph.ts   # Track visited pages
├── detection/
│   ├── bug-detector.ts       # Detection orchestrator
│   ├── console-monitor.ts    # JS error capture
│   └── network-monitor.ts    # API failure detection
├── interaction/
│   ├── element-interactor.ts # Click, fill actions
│   └── form-handler.ts       # Smart form filling
└── reporting/
    └── bug-reporter.ts       # Generate reports
```

---

## Core Components

### Types & Interfaces

```typescript
// config.ts
export interface ExplorationConfig {
  maxDuration: number;           // Max exploration time in ms
  maxActions: number;            // Max interactions before stopping
  avoidDestructive: boolean;     // Skip delete/logout actions
  screenshotOnBug: boolean;      // Capture screenshot when bug found
  outputDir: string;             // Directory for reports
  focusAreas?: string[];         // URL prefixes to prioritize
  excludeAreas?: string[];       // URL prefixes to skip
}

export interface ExplorationResult {
  bugs: BugReport[];
  criticalBugs: BugReport[];
  pagesVisited: string[];
  actionsPerformed: number;
  duration: number;
  writeReport(): Promise<void>;
}

export interface BugReport {
  id: string;
  type: BugType;
  severity: 'critical' | 'major' | 'minor' | 'info';
  url: string;
  timestamp: number;
  description: string;
  screenshot?: string;
  consoleLogs?: string[];
  networkLogs?: NetworkLog[];
  reproductionSteps?: ActionRecord[];
}

export type BugType =
  | 'console_error'
  | 'network_failure'
  | 'timeout'
  | 'loading_stuck'
  | 'empty_content'
  | 'navigation_failure';

export interface ElementInfo {
  type: 'link' | 'button' | 'input' | 'select' | 'checkbox';
  selector: string;
  text: string;
  href?: string;
  inputType?: string;
  name?: string;
}

export interface ActionRecord {
  timestamp: number;
  type: 'navigate' | 'click' | 'fill' | 'scroll';
  target: string;
  value?: string;
  url: string;
}

export interface NetworkLog {
  url: string;
  method: string;
  status: number;
  timestamp: number;
}
```

---

## Bug Detection

### Console Monitor

Captures JavaScript errors from the browser console.

```typescript
// detection/console-monitor.ts
import { Page } from '@playwright/test';

interface ConsoleError {
  text: string;
  timestamp: number;
  location?: string;
  stack?: string;
}

export class ConsoleMonitor {
  private errors: ConsoleError[] = [];
  private warnings: ConsoleError[] = [];

  start(page: Page): void {
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        this.errors.push({
          text: msg.text(),
          timestamp: Date.now(),
          location: msg.location()?.url,
        });
      } else if (msg.type() === 'warning') {
        this.warnings.push({
          text: msg.text(),
          timestamp: Date.now(),
        });
      }
    });

    page.on('pageerror', (error) => {
      this.errors.push({
        text: error.message,
        stack: error.stack,
        timestamp: Date.now(),
      });
    });
  }

  getErrors(): ConsoleError[] {
    // Filter out known non-issues
    return this.errors.filter(
      (e) =>
        !e.text.includes('React DevTools') &&
        !e.text.includes('Download the React') &&
        !e.text.includes('favicon.ico')
    );
  }

  getWarnings(): ConsoleError[] {
    return this.warnings;
  }

  clear(): void {
    this.errors = [];
    this.warnings = [];
  }
}
```

### Network Monitor

Captures failed API requests and network errors.

```typescript
// detection/network-monitor.ts
import { Page, Request, Response } from '@playwright/test';

interface NetworkFailure {
  url: string;
  method: string;
  status?: number;
  error?: string;
  timestamp: number;
}

export class NetworkMonitor {
  private failures: NetworkFailure[] = [];
  private requests: Map<string, Request> = new Map();

  start(page: Page): void {
    page.on('request', (request) => {
      this.requests.set(request.url(), request);
    });

    page.on('response', (response) => {
      if (response.status() >= 400) {
        this.failures.push({
          url: response.url(),
          status: response.status(),
          method: response.request().method(),
          timestamp: Date.now(),
        });
      }
    });

    page.on('requestfailed', (request) => {
      this.failures.push({
        url: request.url(),
        method: request.method(),
        error: request.failure()?.errorText,
        timestamp: Date.now(),
      });
    });
  }

  getFailures(): NetworkFailure[] {
    // Filter out expected failures (like favicon)
    return this.failures.filter(
      (f) =>
        !f.url.includes('favicon') &&
        !f.url.includes('hot-update') &&
        !f.url.includes('sockjs')
    );
  }

  getServerErrors(): NetworkFailure[] {
    return this.failures.filter((f) => f.status && f.status >= 500);
  }

  getClientErrors(): NetworkFailure[] {
    return this.failures.filter(
      (f) => f.status && f.status >= 400 && f.status < 500
    );
  }

  clear(): void {
    this.failures = [];
  }
}
```

### Visual Checker

Detects UI anomalies like stuck loading states.

```typescript
// detection/visual-checker.ts
import { Page, expect } from '@playwright/test';

export class VisualChecker {
  constructor(private page: Page) {}

  async checkLoadingComplete(timeout = 10000): Promise<boolean> {
    const loadingSelectors = [
      '.animate-spin',
      '[data-loading="true"]',
      '.skeleton',
      '[aria-busy="true"]',
    ];

    const loading = this.page.locator(loadingSelectors.join(', '));

    try {
      await expect(loading).toBeHidden({ timeout });
      return true;
    } catch {
      return false;
    }
  }

  async checkContentOrEmpty(
    contentSelector: string,
    emptySelector: string,
    timeout = 10000
  ): Promise<'content' | 'empty' | 'neither'> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const [hasContent, hasEmpty] = await Promise.all([
        this.page.locator(contentSelector).isVisible().catch(() => false),
        this.page.locator(emptySelector).isVisible().catch(() => false),
      ]);

      if (hasContent && !hasEmpty) return 'content';
      if (hasEmpty && !hasContent) return 'empty';

      await this.page.waitForTimeout(100);
    }

    return 'neither';
  }

  async checkBrokenImages(): Promise<string[]> {
    return this.page.evaluate(() => {
      const images = Array.from(document.querySelectorAll('img'));
      return images
        .filter((img) => !img.complete || img.naturalWidth === 0)
        .map((img) => img.src);
    });
  }
}
```

---

## Navigation Strategy

### Link Extractor

Extracts all interactive elements from the current page.

```typescript
// navigation/link-extractor.ts
import { Page } from '@playwright/test';
import { ElementInfo } from '../config';

export async function extractInteractiveElements(
  page: Page
): Promise<ElementInfo[]> {
  return page.evaluate(() => {
    const elements: ElementInfo[] = [];

    // Helper to generate a reliable selector
    function generateSelector(el: Element): string {
      if (el.id) return `#${el.id}`;
      if (el.getAttribute('data-testid')) {
        return `[data-testid="${el.getAttribute('data-testid')}"]`;
      }
      if (el.getAttribute('name')) {
        return `[name="${el.getAttribute('name')}"]`;
      }

      // Fall back to text content for buttons/links
      const text = el.textContent?.trim();
      if (text && text.length < 50) {
        const tag = el.tagName.toLowerCase();
        return `${tag}:has-text("${text.substring(0, 30)}")`;
      }

      // Last resort: nth-child selector
      const parent = el.parentElement;
      if (parent) {
        const siblings = Array.from(parent.children);
        const index = siblings.indexOf(el);
        return `${el.tagName.toLowerCase()}:nth-child(${index + 1})`;
      }

      return el.tagName.toLowerCase();
    }

    // Extract links
    document.querySelectorAll('a[href]').forEach((el) => {
      const href = el.getAttribute('href');
      if (href && !href.startsWith('javascript:') && !href.startsWith('#')) {
        elements.push({
          type: 'link',
          selector: generateSelector(el),
          text: el.textContent?.trim() || '',
          href: href,
        });
      }
    });

    // Extract buttons
    document.querySelectorAll('button:not([disabled])').forEach((el) => {
      elements.push({
        type: 'button',
        selector: generateSelector(el),
        text: el.textContent?.trim() || '',
      });
    });

    // Extract clickable elements with role="button"
    document.querySelectorAll('[role="button"]:not([disabled])').forEach((el) => {
      elements.push({
        type: 'button',
        selector: generateSelector(el),
        text: el.textContent?.trim() || '',
      });
    });

    // Extract form inputs
    document.querySelectorAll('input:not([type="hidden"]), select, textarea').forEach((el) => {
      const input = el as HTMLInputElement;
      elements.push({
        type: input.tagName === 'SELECT' ? 'select' :
              input.type === 'checkbox' ? 'checkbox' : 'input',
        selector: generateSelector(el),
        text: '',
        inputType: input.type || 'text',
        name: input.name,
      });
    });

    return elements;
  });
}
```

### Navigation Graph

Tracks visited pages and interacted elements.

```typescript
// navigation/navigation-graph.ts
export interface PageNode {
  url: string;
  normalizedUrl: string;
  visitCount: number;
  lastVisited: number;
  elements: Map<string, number>; // selector -> interaction count
}

export class NavigationGraph {
  private pages: Map<string, PageNode> = new Map();
  private knownRoutes: string[] = [];

  constructor(knownRoutes: string[] = []) {
    this.knownRoutes = knownRoutes;
  }

  private normalizeUrl(url: string): string {
    // Remove dynamic IDs from URLs for pattern matching
    return url
      .replace(/\/[0-9a-f-]{36}/g, '/:id')  // UUIDs
      .replace(/\/\d+/g, '/:id')             // Numeric IDs
      .replace(/\?.*$/, '');                 // Query params
  }

  recordVisit(url: string): void {
    const normalized = this.normalizeUrl(url);
    const existing = this.pages.get(normalized);

    if (existing) {
      existing.visitCount++;
      existing.lastVisited = Date.now();
    } else {
      this.pages.set(normalized, {
        url,
        normalizedUrl: normalized,
        visitCount: 1,
        lastVisited: Date.now(),
        elements: new Map(),
      });
    }
  }

  recordInteraction(url: string, selector: string): void {
    const normalized = this.normalizeUrl(url);
    const page = this.pages.get(normalized);

    if (page) {
      const count = page.elements.get(selector) || 0;
      page.elements.set(selector, count + 1);
    }
  }

  hasVisited(url: string): boolean {
    const normalized = this.normalizeUrl(url);
    return this.pages.has(normalized);
  }

  hasInteracted(url: string, selector: string): boolean {
    const normalized = this.normalizeUrl(url);
    const page = this.pages.get(normalized);
    return page ? (page.elements.get(selector) || 0) > 0 : false;
  }

  getUnvisitedRoutes(): string[] {
    return this.knownRoutes.filter((route) => !this.hasVisited(route));
  }

  getVisitedUrls(): string[] {
    return Array.from(this.pages.values()).map((p) => p.url);
  }
}
```

### Decision Engine

Chooses the next action based on exploration state.

```typescript
// navigation/decision-engine.ts
import { ElementInfo, ExplorationConfig } from '../config';
import { NavigationGraph } from './navigation-graph';

interface Action {
  type: 'navigate' | 'click' | 'fill-form' | 'scroll' | 'done';
  target?: ElementInfo | string;
}

const DESTRUCTIVE_PATTERNS = {
  text: [/delete/i, /remove/i, /logout/i, /sign out/i, /cancel account/i, /deactivate/i],
  selectors: ['[data-destructive]', '.btn-danger', 'button.bg-red', '.text-red-600 button'],
};

function isDestructive(element: ElementInfo): boolean {
  for (const pattern of DESTRUCTIVE_PATTERNS.text) {
    if (pattern.test(element.text)) return true;
  }
  return false;
}

function shouldExclude(url: string, excludeAreas: string[]): boolean {
  return excludeAreas.some((area) => url.includes(area));
}

function shouldFocus(url: string, focusAreas: string[]): boolean {
  if (focusAreas.length === 0) return true;
  return focusAreas.some((area) => url.includes(area));
}

export function chooseNextAction(
  graph: NavigationGraph,
  currentUrl: string,
  elements: ElementInfo[],
  config: ExplorationConfig
): Action {
  // Filter elements based on config
  let candidates = elements;

  if (config.avoidDestructive) {
    candidates = candidates.filter((e) => !isDestructive(e));
  }

  // Priority 1: Unvisited internal links
  const unvisitedLinks = candidates.filter(
    (e) =>
      e.type === 'link' &&
      e.href &&
      !e.href.startsWith('http') &&
      !graph.hasVisited(e.href) &&
      !shouldExclude(e.href, config.excludeAreas || []) &&
      shouldFocus(e.href, config.focusAreas || [])
  );

  if (unvisitedLinks.length > 0) {
    // Prefer links that match focus areas
    const focusedLinks = unvisitedLinks.filter((l) =>
      shouldFocus(l.href!, config.focusAreas || [])
    );
    const target = focusedLinks.length > 0 ? focusedLinks[0] : unvisitedLinks[0];
    return { type: 'click', target };
  }

  // Priority 2: Unclicked buttons on current page
  const unclickedButtons = candidates.filter(
    (e) =>
      e.type === 'button' &&
      !graph.hasInteracted(currentUrl, e.selector)
  );

  if (unclickedButtons.length > 0) {
    return { type: 'click', target: unclickedButtons[0] };
  }

  // Priority 3: Unfilled forms
  const formInputs = candidates.filter((e) => e.type === 'input');
  if (formInputs.length > 0) {
    return { type: 'fill-form' };
  }

  // Priority 4: Navigate to known unvisited route
  const unvisitedRoutes = graph.getUnvisitedRoutes();
  if (unvisitedRoutes.length > 0) {
    return { type: 'navigate', target: unvisitedRoutes[0] };
  }

  // Priority 5: Scroll to discover more content
  return { type: 'scroll' };
}
```

---

## Form Handling

### Smart Form Filling

Generates appropriate test data based on field type.

```typescript
// interaction/form-handler.ts
import { Page, Locator } from '@playwright/test';
import { ElementInfo } from '../config';

export function generateFieldValue(field: ElementInfo): string {
  const name = (field.name || field.selector).toLowerCase();
  const type = field.inputType || 'text';

  // Email fields
  if (type === 'email' || /email/i.test(name)) {
    return `test-${Date.now()}@example.com`;
  }

  // Password fields
  if (type === 'password' || /password/i.test(name)) {
    return 'Password123!';
  }

  // Name fields
  if (/name/i.test(name) && !/user/i.test(name)) {
    return 'Test User';
  }

  // Username fields
  if (/user/i.test(name)) {
    return `testuser_${Date.now()}`;
  }

  // Phone fields
  if (type === 'tel' || /phone|mobile|tel/i.test(name)) {
    return '010-1234-5678';
  }

  // Number fields
  if (type === 'number' || /amount|price|quantity|age/i.test(name)) {
    return '42';
  }

  // Date fields
  if (type === 'date') {
    return new Date().toISOString().split('T')[0];
  }

  // URL fields
  if (type === 'url' || /url|website|link/i.test(name)) {
    return 'https://example.com';
  }

  // Textarea / description fields
  if (/description|content|message|comment|bio/i.test(name)) {
    return 'This is a test description generated during autonomous exploration.';
  }

  // Title fields
  if (/title|subject|headline/i.test(name)) {
    return `Test Title ${Date.now()}`;
  }

  // Default text
  return `Test value ${Date.now()}`;
}

export async function fillForm(
  page: Page,
  inputs: ElementInfo[]
): Promise<void> {
  for (const input of inputs) {
    try {
      const locator = page.locator(input.selector);
      const isVisible = await locator.isVisible().catch(() => false);

      if (!isVisible) continue;

      if (input.type === 'checkbox') {
        const isChecked = await locator.isChecked().catch(() => false);
        if (!isChecked) {
          await locator.check();
        }
      } else if (input.type === 'select') {
        const options = await locator.locator('option').allTextContents();
        if (options.length > 1) {
          await locator.selectOption({ index: 1 });
        }
      } else {
        const value = generateFieldValue(input);
        await locator.fill(value);
      }
    } catch {
      // Skip fields that can't be interacted with
      continue;
    }
  }
}
```

---

## Implementation Templates

### Complete ExplorationAgent

```typescript
// autonomous/exploration-agent.ts
import { Page, expect } from '@playwright/test';
import {
  ExplorationConfig,
  ExplorationResult,
  BugReport,
  ActionRecord,
} from './config';
import { ConsoleMonitor } from './detection/console-monitor';
import { NetworkMonitor } from './detection/network-monitor';
import { VisualChecker } from './detection/visual-checker';
import { extractInteractiveElements } from './navigation/link-extractor';
import { NavigationGraph } from './navigation/navigation-graph';
import { chooseNextAction } from './navigation/decision-engine';
import { fillForm } from './interaction/form-handler';
import * as fs from 'fs/promises';
import * as path from 'path';

export class ExplorationAgent {
  private page: Page;
  private config: ExplorationConfig;
  private bugs: BugReport[] = [];
  private actions: ActionRecord[] = [];
  private graph: NavigationGraph;
  private consoleMonitor: ConsoleMonitor;
  private networkMonitor: NetworkMonitor;
  private visualChecker: VisualChecker;
  private startTime = 0;
  private bugIdCounter = 0;

  constructor(page: Page, config: Partial<ExplorationConfig> = {}) {
    this.page = page;
    this.config = {
      maxDuration: 300000,
      maxActions: 100,
      avoidDestructive: true,
      screenshotOnBug: true,
      outputDir: './exploration-reports',
      ...config,
    };

    this.graph = new NavigationGraph();
    this.consoleMonitor = new ConsoleMonitor();
    this.networkMonitor = new NetworkMonitor();
    this.visualChecker = new VisualChecker(page);
  }

  async explore(): Promise<ExplorationResult> {
    this.startTime = Date.now();

    // Start monitoring
    this.consoleMonitor.start(this.page);
    this.networkMonitor.start(this.page);

    // Main exploration loop
    while (this.shouldContinue()) {
      try {
        // Record current page
        const currentUrl = this.page.url();
        this.graph.recordVisit(currentUrl);

        // Wait for page to stabilize
        await this.page.waitForLoadState('networkidle').catch(() => {});

        // Check for bugs
        await this.checkForBugs();

        // Extract interactive elements
        const elements = await extractInteractiveElements(this.page);

        // Decide next action
        const action = chooseNextAction(
          this.graph,
          currentUrl,
          elements,
          this.config
        );

        if (action.type === 'done') {
          break;
        }

        // Execute action
        await this.executeAction(action, currentUrl);

      } catch (error) {
        await this.recordBug({
          type: 'navigation_failure',
          severity: 'major',
          description: `Exploration error: ${(error as Error).message}`,
          url: this.page.url(),
        });
      }
    }

    return {
      bugs: this.bugs,
      criticalBugs: this.bugs.filter((b) => b.severity === 'critical'),
      pagesVisited: this.graph.getVisitedUrls(),
      actionsPerformed: this.actions.length,
      duration: Date.now() - this.startTime,
      writeReport: () => this.writeReport(),
    };
  }

  private shouldContinue(): boolean {
    const elapsed = Date.now() - this.startTime;
    return (
      elapsed < this.config.maxDuration &&
      this.actions.length < this.config.maxActions
    );
  }

  private async checkForBugs(): Promise<void> {
    // Check console errors
    for (const error of this.consoleMonitor.getErrors()) {
      await this.recordBug({
        type: 'console_error',
        severity: error.text.includes('TypeError') ||
                  error.text.includes('ReferenceError') ||
                  error.text.includes('Uncaught')
          ? 'critical'
          : 'major',
        description: error.text,
        url: this.page.url(),
      });
    }
    this.consoleMonitor.clear();

    // Check network failures
    for (const failure of this.networkMonitor.getFailures()) {
      await this.recordBug({
        type: 'network_failure',
        severity: failure.status && failure.status >= 500 ? 'critical' : 'major',
        description: failure.status
          ? `${failure.method} ${failure.url} returned ${failure.status}`
          : `${failure.method} ${failure.url} failed: ${failure.error}`,
        url: this.page.url(),
      });
    }
    this.networkMonitor.clear();

    // Check loading state
    const loaded = await this.visualChecker.checkLoadingComplete();
    if (!loaded) {
      await this.recordBug({
        type: 'loading_stuck',
        severity: 'major',
        description: 'Page loading spinner did not disappear within timeout',
        url: this.page.url(),
      });
    }
  }

  private async executeAction(
    action: { type: string; target?: any },
    currentUrl: string
  ): Promise<void> {
    const record: ActionRecord = {
      timestamp: Date.now(),
      type: action.type as ActionRecord['type'],
      target: typeof action.target === 'string' ? action.target : action.target?.selector || '',
      url: currentUrl,
    };

    try {
      switch (action.type) {
        case 'click':
          const element = action.target;
          const locator = this.page.locator(element.selector);
          await expect(locator).toBeVisible({ timeout: 5000 });
          await locator.click();
          this.graph.recordInteraction(currentUrl, element.selector);
          break;

        case 'navigate':
          await this.page.goto(action.target as string);
          break;

        case 'fill-form':
          const inputs = await extractInteractiveElements(this.page);
          const formInputs = inputs.filter((e) => e.type === 'input');
          await fillForm(this.page, formInputs);
          break;

        case 'scroll':
          await this.page.evaluate(() => {
            window.scrollBy(0, window.innerHeight);
          });
          break;
      }

      this.actions.push(record);

      // Wait for any navigation or network activity to settle
      await this.page.waitForTimeout(500);

    } catch (error) {
      record.value = `Error: ${(error as Error).message}`;
      this.actions.push(record);
    }
  }

  private async recordBug(bug: Partial<BugReport>): Promise<void> {
    this.bugIdCounter++;
    const fullBug: BugReport = {
      id: `bug-${String(this.bugIdCounter).padStart(3, '0')}`,
      timestamp: Date.now(),
      type: 'console_error',
      severity: 'major',
      url: this.page.url(),
      description: '',
      reproductionSteps: [...this.actions],
      ...bug,
    };

    if (this.config.screenshotOnBug) {
      try {
        const screenshotDir = path.join(this.config.outputDir, 'screenshots');
        await fs.mkdir(screenshotDir, { recursive: true });
        const screenshotPath = path.join(screenshotDir, `${fullBug.id}.png`);
        await this.page.screenshot({ path: screenshotPath });
        fullBug.screenshot = `./screenshots/${fullBug.id}.png`;
      } catch {
        // Screenshot failed, continue without it
      }
    }

    this.bugs.push(fullBug);
  }

  private async writeReport(): Promise<void> {
    await fs.mkdir(this.config.outputDir, { recursive: true });

    const duration = Date.now() - this.startTime;
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);

    const report = `# Autonomous Exploration Bug Report

**Session ID**: ${Date.now()}
**Date**: ${new Date().toISOString().split('T')[0]}
**Duration**: ${minutes}m ${seconds}s
**Pages Visited**: ${this.graph.getVisitedUrls().length}
**Actions Performed**: ${this.actions.length}
**Bugs Found**: ${this.bugs.length}

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | ${this.bugs.filter((b) => b.severity === 'critical').length} |
| Major | ${this.bugs.filter((b) => b.severity === 'major').length} |
| Minor | ${this.bugs.filter((b) => b.severity === 'minor').length} |
| Info | ${this.bugs.filter((b) => b.severity === 'info').length} |

---

## Bugs

${this.bugs.map((bug) => `
### ${bug.id}: ${bug.type}

**Severity**: ${bug.severity}
**URL**: ${bug.url}
**Time**: ${new Date(bug.timestamp).toISOString()}

#### Description
${bug.description}

${bug.screenshot ? `#### Screenshot\n![${bug.id}](${bug.screenshot})` : ''}

#### Reproduction Steps
${bug.reproductionSteps?.map((step, i) => `${i + 1}. ${step.type} on \`${step.target}\` at ${step.url}`).join('\n') || 'N/A'}

---
`).join('\n')}

## Pages Visited

${this.graph.getVisitedUrls().map((url) => `- ${url}`).join('\n')}

## All Actions

${this.actions.map((a, i) => `${i + 1}. [${new Date(a.timestamp).toISOString()}] ${a.type}: ${a.target}`).join('\n')}
`;

    await fs.writeFile(
      path.join(this.config.outputDir, 'exploration-report.md'),
      report
    );

    // Also save as JSON for programmatic access
    await fs.writeFile(
      path.join(this.config.outputDir, 'exploration-report.json'),
      JSON.stringify(
        {
          bugs: this.bugs,
          pagesVisited: this.graph.getVisitedUrls(),
          actions: this.actions,
          duration,
        },
        null,
        2
      )
    );
  }
}
```

### Test File Template

```typescript
// e2e/autonomous/exploration.spec.ts
import { test, expect } from '../fixtures/auth.fixture';
import { ExplorationAgent } from './exploration-agent';

test.describe('Autonomous Exploration', () => {
  // Increase timeout for exploration tests
  test.setTimeout(10 * 60 * 1000); // 10 minutes

  test('explore authenticated user flows', async ({ loggedInPage }) => {
    const agent = new ExplorationAgent(loggedInPage, {
      maxDuration: 5 * 60 * 1000,  // 5 minutes
      maxActions: 100,
      avoidDestructive: true,
      screenshotOnBug: true,
      outputDir: './exploration-reports/authenticated',
      focusAreas: ['/dashboard'],
      excludeAreas: ['/logout', '/delete'],
    });

    const result = await agent.explore();
    await result.writeReport();

    console.log(`Exploration complete:`);
    console.log(`  - Pages visited: ${result.pagesVisited.length}`);
    console.log(`  - Actions performed: ${result.actionsPerformed}`);
    console.log(`  - Bugs found: ${result.bugs.length}`);
    console.log(`  - Critical bugs: ${result.criticalBugs.length}`);

    // Fail test if critical bugs found
    expect(result.criticalBugs).toHaveLength(0);
  });

  test('explore public pages', async ({ loggedOutPage }) => {
    const agent = new ExplorationAgent(loggedOutPage, {
      maxDuration: 3 * 60 * 1000,  // 3 minutes
      maxActions: 50,
      avoidDestructive: true,
      screenshotOnBug: true,
      outputDir: './exploration-reports/public',
      excludeAreas: ['/dashboard', '/settings'],
    });

    const result = await agent.explore();
    await result.writeReport();

    console.log(`Public exploration complete:`);
    console.log(`  - Pages visited: ${result.pagesVisited.length}`);
    console.log(`  - Bugs found: ${result.bugs.length}`);

    expect(result.criticalBugs).toHaveLength(0);
  });

  test('focused exploration - settings area', async ({ loggedInPage }) => {
    // Navigate to settings first
    await loggedInPage.goto('/dashboard/settings');

    const agent = new ExplorationAgent(loggedInPage, {
      maxDuration: 2 * 60 * 1000,
      maxActions: 30,
      avoidDestructive: true,
      screenshotOnBug: true,
      outputDir: './exploration-reports/settings',
      focusAreas: ['/settings', '/profile'],
    });

    const result = await agent.explore();
    await result.writeReport();

    expect(result.criticalBugs).toHaveLength(0);
  });
});
```

---

## Bug Report Template

The report is automatically generated in markdown format:

```markdown
# Autonomous Exploration Bug Report

**Session ID**: 1705312345678
**Date**: 2024-01-15
**Duration**: 4m 32s
**Pages Visited**: 12
**Actions Performed**: 47
**Bugs Found**: 3

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 1 |
| Major | 2 |
| Minor | 0 |
| Info | 0 |

---

## Bugs

### bug-001: console_error

**Severity**: critical
**URL**: /dashboard/settings
**Time**: 2024-01-15T10:32:45.123Z

#### Description
TypeError: Cannot read property 'name' of undefined

#### Screenshot
![bug-001](./screenshots/bug-001.png)

#### Reproduction Steps
1. navigate on `/login` at /
2. fill-form on `` at /login
3. click on `button:has-text("Sign In")` at /login
4. click on `a[href="/dashboard/settings"]` at /dashboard

---

### bug-002: network_failure

**Severity**: major
**URL**: /dashboard/items
**Time**: 2024-01-15T10:33:12.456Z

#### Description
GET /api/items returned 500

#### Screenshot
![bug-002](./screenshots/bug-002.png)

---

## Pages Visited

- /
- /login
- /dashboard
- /dashboard/settings
- /dashboard/items
- /dashboard/items/new

## All Actions

1. [2024-01-15T10:30:00.000Z] navigate: /login
2. [2024-01-15T10:30:05.000Z] fill-form:
3. [2024-01-15T10:30:10.000Z] click: button:has-text("Sign In")
...
```

---

## Dynamic Status File Output

The exploration agent **dynamically updates** a status file after each test run at:

```
.claude-project/status/frontend/E2E_QA_STATUS.md
```

### Status File Content

The status file is automatically regenerated with:

- **Last Run Timestamp**: Date and time of exploration
- **Overall Status**: PASS ✅, WARNING ⚠️, or CRITICAL 🚨
- **Metrics**: Duration, pages tested, actions performed, bugs found
- **Bug Summary**: Counts by severity (Critical, Major, Minor)
- **Pages Covered**: List of URLs visited during exploration
- **Bug Details**: Full description of each bug found

### Example Status File

```markdown
# E2E QA Status - Frontend

> Last updated: 2026-01-20 12:06:14

## Overall Status: :x: CRITICAL

| Metric | Value |
|--------|-------|
| Last Run | 2026-01-20 12:06:14 |
| Duration | 5m 6s |
| Pages Tested | 6 |
| Actions Performed | 68 |
| Bugs Found | 20 |

## Bug Summary

| Severity | Count | Status |
|----------|-------|--------|
| Critical | 12 | 🚨 Action Required |
| Major | 8 | ⚠️ Review Needed |
| Minor | 0 | ✅ None |

## Pages Covered

- [x] `/dashboard`
- [x] `/dashboard/items`
- [x] `/dashboard/reports`
- [x] `/dashboard/analytics`
- [x] `/dashboard/settings`

## Bugs Found

### 1. 🚨 [CRITICAL] console_error

- **URL**: `/dashboard/settings`
- **Description**: ReferenceError: Smartphone is not defined
- **Time**: 2026-01-20T12:05:21.373Z

### 2. 🚨 [CRITICAL] network_failure

- **URL**: `/dashboard/settings`
- **Description**: GET /api/auth/check-login returned 500
- **Time**: 2026-01-20T12:04:45.208Z
```

### Implementation

The `writeStatusFile()` method in `exploration-agent.ts` handles this:

```typescript
private async writeStatusFile(duration: number): Promise<void> {
  const statusDir = path.resolve(__dirname, '../../../.claude-project/status/frontend');
  await fs.mkdir(statusDir, { recursive: true });

  // Generate status based on bug severity
  let status = ':white_check_mark: PASS';
  if (this.bugs.some(b => b.severity === 'critical')) {
    status = ':x: CRITICAL';
  } else if (this.bugs.some(b => b.severity === 'major')) {
    status = ':warning: WARNING';
  }

  // Write markdown status report
  await fs.writeFile(
    path.join(statusDir, 'E2E_QA_STATUS.md'),
    statusReport
  );
}
```

### Status File Locations

| Project | Status File Path |
|---------|------------------|
| Frontend (User App) | `.claude-project/status/frontend/E2E_QA_STATUS.md` |
| Admin Dashboard | `.claude-project/status/dashboard/E2E_QA_STATUS.md` |

### Continuous Integration

The status file can be used in CI pipelines to:

1. **Gate deployments** based on critical bug count
2. **Generate Slack notifications** with test results
3. **Track quality trends** over time
4. **Integrate with project management** tools

---

## NPM Scripts

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "e2e:explore": "playwright test e2e/autonomous/ --project=chromium",
    "e2e:explore:auth": "playwright test e2e/autonomous/ --grep='authenticated'",
    "e2e:explore:public": "playwright test e2e/autonomous/ --grep='public'",
    "e2e:explore:quick": "EXPLORE_DURATION=60000 EXPLORE_ACTIONS=20 playwright test e2e/autonomous/",
    "e2e:explore:deep": "EXPLORE_DURATION=600000 EXPLORE_ACTIONS=500 playwright test e2e/autonomous/"
  }
}
```

### Environment Variables

You can configure exploration via environment variables:

```bash
# Quick exploration (1 minute, 20 actions)
EXPLORE_DURATION=60000 EXPLORE_ACTIONS=20 npm run e2e:explore

# Deep exploration (10 minutes, 500 actions)
EXPLORE_DURATION=600000 EXPLORE_ACTIONS=500 npm run e2e:explore

# Focus on specific area
EXPLORE_FOCUS="/dashboard/items" npm run e2e:explore
```

Update your agent to read these:

```typescript
const config = {
  maxDuration: parseInt(process.env.EXPLORE_DURATION || '300000'),
  maxActions: parseInt(process.env.EXPLORE_ACTIONS || '100'),
  focusAreas: process.env.EXPLORE_FOCUS ? [process.env.EXPLORE_FOCUS] : [],
};
```

---

## Playwright Config Addition

Add a dedicated project for exploration tests:

```typescript
// playwright.config.ts
export default defineConfig({
  // ... existing config

  projects: [
    // ... existing projects

    {
      name: 'exploration',
      testDir: './e2e/autonomous',
      timeout: 15 * 60 * 1000,  // 15 minute timeout
      use: {
        ...devices['Desktop Chrome'],
        video: 'on',           // Always record exploration
        trace: 'on',           // Always capture trace for debugging
      },
    },
  ],
});
```
