# Figma Plugin SDK — Expert Reference for Amazon Brand Asset Workflows

> **Scope:** A practitioner-level guide to building custom Figma plugins for Amazon brand teams and the syncflow system. Covers the full stack — architecture, Figma API, SP-API image upload, n8n integration, auth, testing, and production publishing. Treat this as the definitive reference for the **Image Upload Bottleneck** module: the surface layer connecting creative teams to the SP-API Feeds API via a Figma plugin.

---

## Table of Contents

1. [Custom Plugin vs. Existing Plugins — When to Build Your Own](#1-custom-plugin-vs-existing-plugins--when-to-build-your-own)
2. [Figma Plugin Architecture: The Two-Thread Model](#2-figma-plugin-architecture-the-two-thread-model)
3. [Project Setup & Configuration](#3-project-setup--configuration)
4. [Core Figma API for Asset Export](#4-core-figma-api-for-asset-export)
5. [The Plugin-to-External-Service Data Pipeline](#5-the-plugin-to-external-service-data-pipeline)
6. [Authentication Patterns](#6-authentication-patterns)
7. [SP-API Image Upload Integration — End to End](#7-sp-api-image-upload-integration--end-to-end)
8. [n8n Webhook Integration](#8-n8n-webhook-integration)
9. [Figma Variables and Design Tokens](#9-figma-variables-and-design-tokens)
10. [Plugin UI Development](#10-plugin-ui-development)
11. [Publishing Workflow for Private Organisation Plugins](#11-publishing-workflow-for-private-organisation-plugins)
12. [Error Handling and User Feedback](#12-error-handling-and-user-feedback)
13. [Common Plugin Limitations and Workarounds](#13-common-plugin-limitations-and-workarounds)
14. [Testing and Debugging](#14-testing-and-debugging)
15. [Complete Example: Minimal Amazon Image Uploader Plugin](#15-complete-example-minimal-amazon-image-uploader-plugin)
16. [Dos & Don'ts](#16-dos--donts)

---

## 1. Custom Plugin vs. Existing Plugins — When to Build Your Own

### The Existing Plugin Landscape

Several off-the-shelf Figma plugins address Amazon and brand asset workflows:

| Plugin | What it Does | Limitations for syncflow |
|---|---|---|
| **Figma to Amazon** | Exports frames to Amazon Seller Central image slots | Manual auth, no SP-API Feeds path, no batch ASIN mapping |
| **Content Reel** | Fills designs with real product copy, images | Pull tool only — does not push to Amazon |
| **Able** | Accessibility checker | Unrelated to upload |
| **Design Lint** | Checks design consistency | No upload capability |
| **Brandfetch** | Pulls logos from web | Inbound only |

### The Case for a Custom Plugin

Build custom when **any** of the following are true:

**1. You need SP-API auth baked in.** The Feeds API requires Login with Amazon (LWA) OAuth, AWS SigV4 request signing, and a registered SP-API application. No generic plugin will carry your SP-API credentials — nor should you want it to. Your LWA refresh token is the master key to your seller account.

**2. You need custom upload logic.** Amazon's image requirements vary by marketplace, image type (MAIN, PT01–PT08, SWATCH), and product category. A custom plugin can validate pixel dimensions, enforce minimum resolution (1000×1000px minimum; 3000×3000px recommended), check format (JPEG/PNG), and reject non-compliant exports *before* they hit the API — saving rejected feed errors.

**3. You need ASIN-to-frame mapping.** A custom plugin can maintain a persistent mapping (stored in `figma.clientStorage`) between Figma frame names and ASINs. Generic plugins have no concept of your catalog.

**4. You need tight workflow integration.** The syncflow module needs to: (a) read the selected frame set, (b) validate compliance, (c) export as high-res PNG bytes, (d) POST to a middleware (Vercel or n8n), (e) receive per-frame upload status, and (f) display confirmation with Amazon image IDs. This is a bespoke state machine that generic plugins cannot provide.

**5. You need organisation-scoped distribution.** Private org plugins are installed via manifest, never appear in the public marketplace, and can be updated silently. This is appropriate for internal tooling where you don't want non-team members discovering or using the plugin.

### Decision Framework

```
Do you need SP-API credentials stored and used in the plugin flow?
  └─ YES → Build custom. Full stop.

Do you need to map Figma frames to specific ASINs programmatically?
  └─ YES → Build custom.

Is your upload logic conditional on product type / image slot?
  └─ YES → Build custom.

Do you need upload status feedback per-frame inside Figma?
  └─ YES → Build custom (or at minimum wrap an existing plugin with your own layer).

If all above are NO → evaluate Content Reel or Figma to Amazon first.
```

---

## 2. Figma Plugin Architecture: The Two-Thread Model

This is the most important architectural concept. Get this wrong and you'll spend hours fighting the sandbox.

### The Two Threads

Figma plugins run in **two isolated execution contexts** that cannot directly share memory:

```
┌─────────────────────────────────────────────────────┐
│                    Figma Desktop App                 │
│                                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │          MAIN THREAD (main.ts)               │   │
│  │  • Sandboxed JavaScript (Figma's engine)     │   │
│  │  • Full access to figma.* API               │   │
│  │  • Can read/write nodes, pages, components  │   │
│  │  • NO fetch(), NO XMLHttpRequest            │   │
│  │  • NO DOM, NO window, NO localStorage       │   │
│  │  • Has figma.clientStorage (persistent KV)  │   │
│  └──────────────────┬───────────────────────────┘   │
│                     │ postMessage / onmessage        │
│  ┌──────────────────┴───────────────────────────┐   │
│  │          UI THREAD (ui.html)                 │   │
│  │  • Standard browser iframe                  │   │
│  │  • Full DOM, React, CSS                     │   │
│  │  • fetch() works ✓                          │   │
│  │  • window.localStorage works ✓              │   │
│  │  • NO access to figma.* API                 │   │
│  │  • Cannot touch the canvas directly         │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### Thread Responsibilities for the Amazon Upload Plugin

| Responsibility | Thread |
|---|---|
| Read selected frames from canvas | main.ts |
| Call `node.exportAsync()` to get image bytes | main.ts |
| Read stored ASIN mappings | main.ts (clientStorage) |
| Send image bytes to UI | main.ts → postMessage → ui.html |
| POST image bytes to Vercel/n8n | ui.html (fetch) |
| Receive upload result from API | ui.html |
| Display progress bar, success/error | ui.html (DOM) |
| Write result back to Figma canvas (e.g. update frame name with ASIN) | ui.html → postMessage → main.ts |

### Message Passing

**main.ts → ui.html:**
```typescript
// In main.ts
figma.ui.postMessage({
  type: 'EXPORT_COMPLETE',
  frames: [
    { id: 'node:123', name: 'Main Image', bytes: new Uint8Array([...]) }
  ]
});
```

**ui.html → main.ts:**
```html
<!-- In ui.html <script> -->
<script>
  window.onmessage = (event) => {
    const msg = event.data.pluginMessage;
    if (msg.type === 'EXPORT_COMPLETE') {
      // Upload the frames
      uploadFrames(msg.frames);
    }
  };

  function sendToPlugin(type, payload) {
    parent.postMessage({ pluginMessage: { type, ...payload } }, '*');
  }
</script>
```

**Receiving in main.ts:**
```typescript
figma.ui.onmessage = (msg) => {
  if (msg.type === 'UPLOAD_SUCCESS') {
    const node = figma.getNodeById(msg.nodeId) as FrameNode;
    node.name = `${node.name} [✓ ${msg.imageId}]`;
  }
  if (msg.type === 'CLOSE') {
    figma.closePlugin();
  }
};
```

### Why Uint8Array Crosses the Bridge

Image bytes (`exportAsync` returns `Uint8Array`) are transferable across the postMessage boundary. However, they are **cloned**, not referenced — so large exports can be expensive. For batch exports of 3000×3000px PNG frames, expect 2–8 MB per frame. Structure your message pipeline to handle this gracefully (see Section 8).

---

## 3. Project Setup & Configuration

### Prerequisites

- **Node.js** ≥ 18 LTS
- **Figma Desktop App** (required for plugin development — browser Figma does not support plugin development mode)
- A Figma account with access to the target file

### Initial Setup

```bash
# Install the Figma plugin type definitions
npm install --save-dev @figma/plugin-typings

# Recommended: use the official Figma plugin template
npx create-figma-plugin --template ui
# or for a bare TypeScript template:
npx create-figma-plugin --template default
```

The `create-figma-plugin` tool (by Yuanqing Luo, widely used in the ecosystem) provides:
- `manifest.json` scaffolding
- TypeScript config with `@figma/plugin-typings` pre-wired
- Watch mode compilation
- `esbuild` bundler (fast, zero-config)

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES6",
    "lib": ["ES6", "DOM"],
    "strict": true,
    "moduleResolution": "node",
    "types": ["@figma/plugin-typings"]
  },
  "include": ["src/**/*.ts"]
}
```

> ⚠️ Do NOT include `DOM` lib in the main thread context if you want TypeScript to catch illegal DOM calls in main.ts. Some developers keep two tsconfigs: one for main.ts (no DOM) and one for ui.ts (with DOM). This is optional but enforces the threading contract at compile time.

### manifest.json — Full Reference

```json
{
  "name": "Amazon Image Uploader",
  "id": "1234567890123456789",
  "api": "1.0.0",
  "main": "dist/main.js",
  "ui": "dist/ui.html",
  "editorType": ["figma"],
  "permissions": ["currentuser", "activeusers"],
  "networkAccess": {
    "allowedDomains": [
      "https://your-vercel-app.vercel.app",
      "https://your-n8n-instance.com"
    ]
  },
  "documentAccess": "dynamic-page"
}
```

**Key manifest fields explained:**

| Field | Value | Notes |
|---|---|---|
| `id` | Unique 19-digit number | Generate once; permanent identifier for this plugin |
| `api` | `"1.0.0"` | API version — always `"1.0.0"` currently |
| `main` | Path to compiled JS | Entry point for main thread |
| `ui` | Path to HTML file | Entry point for UI thread; can be inline or a file |
| `editorType` | `["figma"]` | `"figjam"` for FigJam, `"dev"` for Dev Mode |
| `permissions` | Array of strings | `"currentuser"` for user identity; rarely needed |
| `networkAccess.allowedDomains` | Array of URLs | Required for the UI to make fetch() calls to your services |
| `documentAccess` | `"dynamic-page"` | Allows the plugin to read/write across all pages |

> ⚠️ **`networkAccess` is mandatory.** If you omit it or miss a domain, all `fetch()` calls from ui.html to that domain silently fail with a network error. Add every domain your plugin will call — including staging and production.

### Generating a Plugin ID

Run in Figma Desktop: Plugins → Development → New Plugin → give it a name. Figma generates the ID. Copy it into your manifest. This ID is how Figma tracks your plugin — never change it post-publish.

---

## 4. Core Figma API for Asset Export

### 4.1 Accessing the Document and Selection

```typescript
// Current page
const page = figma.currentPage;

// All nodes on current page (shallow)
const topLevelNodes = page.children;

// User's current selection
const selection = figma.currentPage.selection;

// Wait for the selection — only available after figma.showUI()
figma.on('selectionchange', () => {
  const newSelection = figma.currentPage.selection;
});
```

### 4.2 Traversing the Node Tree

```typescript
// Recursive traversal
function findAllFrames(node: BaseNode): FrameNode[] {
  const frames: FrameNode[] = [];
  
  if (node.type === 'FRAME') {
    frames.push(node as FrameNode);
  }
  
  if ('children' in node) {
    for (const child of node.children) {
      frames.push(...findAllFrames(child));
    }
  }
  
  return frames;
}

// Finding frames by name pattern (e.g., "MAIN_IMAGE_*")
function findFramesByPrefix(prefix: string): FrameNode[] {
  return figma.currentPage.findAll(
    (node) => node.type === 'FRAME' && node.name.startsWith(prefix)
  ) as FrameNode[];
}

// Checking node type safely
function isExportable(node: SceneNode): boolean {
  return node.type === 'FRAME' || 
         node.type === 'COMPONENT' || 
         node.type === 'INSTANCE' ||
         node.type === 'GROUP';
}
```

### 4.3 Exporting Frames as Images

`exportAsync()` is the core method. It runs on the main thread and returns a `Promise<Uint8Array>`.

```typescript
async function exportFrame(node: FrameNode): Promise<Uint8Array> {
  const bytes = await node.exportAsync({
    format: 'PNG',
    constraint: { type: 'SCALE', value: 3 }  // 3× = 3000px if frame is 1000px
  });
  return bytes;
}

// Export options reference
const settings: ExportSettings = {
  format: 'PNG',           // 'PNG' | 'JPG' | 'SVG' | 'PDF'
  constraint: {
    type: 'SCALE',         // 'SCALE' | 'WIDTH' | 'HEIGHT'
    value: 3               // multiplier for SCALE, px for WIDTH/HEIGHT
  },
  // For JPG:
  // contentsOnly: true,   // export only node contents, not background
  // suffix: '_export',    // appended to filename (metadata only)
};
```

**Amazon image requirements and what settings to use:**

| Image Slot | Min Size | Recommended Export Setting |
|---|---|---|
| MAIN (hero) | 1000×1000px | Frame 1000×1000px, SCALE 3× → 3000px |
| PT01–PT08 (lifestyle) | 1000×1000px | Frame 1000×1000px, SCALE 3× |
| SWATCH | 200×200px | Frame 200×200px, SCALE 1× |
| A+ Content | 970×600px | Frame 970×600px, SCALE 2× |

> ⚠️ **JPEG vs PNG for Amazon:** Amazon accepts both. JPEG is required for the MAIN image on many categories (pure white background, no transparency). PNG works for lifestyle images with transparency. Your plugin should detect or enforce format based on image slot type.

### 4.4 Batch Export with Per-Node Error Handling

```typescript
interface ExportResult {
  nodeId: string;
  name: string;
  bytes?: Uint8Array;
  error?: string;
  width: number;
  height: number;
}

async function batchExport(nodes: FrameNode[]): Promise<ExportResult[]> {
  const results: ExportResult[] = [];
  
  for (const node of nodes) {
    try {
      const bytes = await node.exportAsync({
        format: 'PNG',
        constraint: { type: 'SCALE', value: 3 }
      });
      
      results.push({
        nodeId: node.id,
        name: node.name,
        bytes,
        width: node.width * 3,
        height: node.height * 3
      });
    } catch (err) {
      results.push({
        nodeId: node.id,
        name: node.name,
        error: err instanceof Error ? err.message : 'Export failed',
        width: node.width,
        height: node.height
      });
    }
    
    // Yield progress to UI between frames
    figma.ui.postMessage({
      type: 'EXPORT_PROGRESS',
      completed: results.length,
      total: nodes.length
    });
  }
  
  return results;
}
```

> ⚠️ `exportAsync()` is asynchronous and can be slow for large frames (>200ms per frame at 3×). Do NOT export all frames simultaneously with `Promise.all()` — this can overwhelm memory. Export sequentially with a for-loop and post progress updates.

### 4.5 Getting Node Metadata

```typescript
function getNodeMeta(node: FrameNode) {
  return {
    id: node.id,
    name: node.name,
    width: node.width,    // design units (not px at export scale)
    height: node.height,
    type: node.type,
    visible: node.visible,
    locked: node.locked,
    // Figma's CSS transform position
    x: node.x,
    y: node.y,
    // Plugin data (custom key-value, see Section 6)
    asin: node.getPluginData('asin') || '',
    imageSlot: node.getPluginData('imageSlot') || ''
  };
}
```

### 4.6 Storing Metadata on Nodes with Plugin Data

`node.setPluginData()` / `node.getPluginData()` stores arbitrary string data on any node, **scoped to your plugin**. Other plugins cannot read it.

```typescript
// Store ASIN and slot info on the frame itself
function tagFrame(node: FrameNode, asin: string, slot: string): void {
  node.setPluginData('asin', asin);
  node.setPluginData('imageSlot', slot);
  node.setPluginData('lastUploadedAt', new Date().toISOString());
}

// Read it back
function getFrameTag(node: FrameNode) {
  return {
    asin: node.getPluginData('asin'),
    slot: node.getPluginData('imageSlot'),
    lastUploadedAt: node.getPluginData('lastUploadedAt')
  };
}
```

This is the right pattern for the syncflow ASIN mapping system: when a designer opens the plugin to upload, the frame already carries its ASIN mapping from the last time they tagged it. No separate spreadsheet needed.

---

## 5. The Plugin-to-External-Service Data Pipeline

This is the critical architectural pattern. Burn it into memory.

### The Rule: All Network I/O Happens in ui.html

```
main.ts (Figma API)          ui.html (browser iframe)           External Service
      │                              │                                 │
      │ 1. Select frames             │                                 │
      │ 2. exportAsync() → bytes     │                                 │
      │                              │                                 │
      │──── postMessage(bytes) ──────►                                 │
      │                              │ 3. fetch(endpoint, bytes)──────►│
      │                              │                         ◄───────│ 4. Response
      │                              │                                 │
      │◄─── postMessage(result) ─────│                                 │
      │                              │                                 │
      │ 5. Update canvas             │                                 │
```

### Complete Pipeline Implementation

**main.ts — Orchestration layer:**
```typescript
figma.showUI(__html__, { width: 400, height: 500, title: 'Amazon Image Uploader' });

figma.ui.onmessage = async (msg: PluginMessage) => {
  switch (msg.type) {
    case 'START_UPLOAD': {
      const selection = figma.currentPage.selection as FrameNode[];
      
      if (selection.length === 0) {
        figma.ui.postMessage({ type: 'ERROR', message: 'Select at least one frame' });
        return;
      }
      
      // Export all selected frames
      const exportResults = await batchExport(selection);
      
      // Convert Uint8Array → Array for postMessage serialization
      const payload = exportResults.map((r) => ({
        nodeId: r.nodeId,
        name: r.name,
        asin: figma.getNodeById(r.nodeId)?.getPluginData('asin') || msg.defaultAsin,
        imageSlot: figma.getNodeById(r.nodeId)?.getPluginData('imageSlot') || 'MAIN',
        bytesArray: r.bytes ? Array.from(r.bytes) : null,
        error: r.error
      }));
      
      figma.ui.postMessage({ type: 'FRAMES_READY', frames: payload });
      break;
    }
    
    case 'UPDATE_NODE_METADATA': {
      const node = figma.getNodeById(msg.nodeId);
      if (node && 'setPluginData' in node) {
        node.setPluginData('lastUploadStatus', msg.status);
        node.setPluginData('amazonImageId', msg.imageId || '');
      }
      break;
    }
    
    case 'CLOSE':
      figma.closePlugin();
      break;
  }
};
```

**ui.html — Network layer:**
```html
<script>
window.onmessage = async (event) => {
  const msg = event.data.pluginMessage;
  
  if (msg.type === 'FRAMES_READY') {
    for (const frame of msg.frames) {
      if (frame.error || !frame.bytesArray) {
        updateFrameStatus(frame.nodeId, 'error', frame.error);
        continue;
      }
      
      await uploadFrame(frame);
    }
  }
};

async function uploadFrame(frame) {
  updateFrameStatus(frame.nodeId, 'uploading');
  
  try {
    // Reconstruct Uint8Array from plain array
    const bytes = new Uint8Array(frame.bytesArray);
    const blob = new Blob([bytes], { type: 'image/png' });
    
    const formData = new FormData();
    formData.append('image', blob, `${frame.name}.png`);
    formData.append('asin', frame.asin);
    formData.append('imageSlot', frame.imageSlot);
    
    const token = await getStoredToken(); // from localStorage or prompt
    
    const res = await fetch('https://your-api.vercel.app/api/upload-image', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || `HTTP ${res.status}`);
    }
    
    const result = await res.json();
    
    updateFrameStatus(frame.nodeId, 'success', null, result.imageId);
    
    // Tell main thread to tag the node
    parent.postMessage({
      pluginMessage: {
        type: 'UPDATE_NODE_METADATA',
        nodeId: frame.nodeId,
        status: 'uploaded',
        imageId: result.imageId
      }
    }, '*');
    
  } catch (err) {
    updateFrameStatus(frame.nodeId, 'error', err.message);
  }
}
</script>
```

---

## 6. Authentication Patterns

### 6.1 figma.clientStorage — The Plugin Keychain

`figma.clientStorage` is a simple async key-value store that persists between plugin runs, scoped to the plugin ID. It lives in main.ts.

```typescript
// Store a token (from LWA OAuth flow)
await figma.clientStorage.setAsync('lwa_refresh_token', refreshToken);

// Read it back
const token = await figma.clientStorage.getAsync('lwa_refresh_token') as string | undefined;

// Delete it (logout)
await figma.clientStorage.deleteAsync('lwa_refresh_token');

// List all keys
const keys = await figma.clientStorage.keysAsync();
```

> ⚠️ `clientStorage` is stored locally on the user's machine, not in Figma's cloud. It does NOT sync across devices or team members. Each designer's Figma install has its own isolated storage for your plugin. This is appropriate for OAuth tokens — each user authenticates with their own LWA credentials.

### 6.2 OAuth 2.0 Flow from a Figma Plugin

The LWA OAuth flow requires a browser redirect, which a plugin UI iframe cannot fully control. The recommended pattern:

**Step 1: Open the LWA authorization URL in the user's default browser**

```typescript
// In main.ts
figma.openExternal('https://www.amazon.com/ap/oa?' + new URLSearchParams({
  client_id: 'amzn1.application-oa2-client.xxxxxxxxxxxx',
  scope: 'sellingpartnerapi::catalog_items_v0 sellingpartnerapi::feeds',
  response_type: 'code',
  redirect_uri: 'https://your-vercel-app.vercel.app/auth/callback',
  state: sessionId   // random nonce, stored in clientStorage for CSRF check
}));
```

**Step 2: Your Vercel endpoint captures the callback**

```typescript
// /api/auth/callback.ts (Vercel)
export default async function handler(req, res) {
  const { code, state } = req.query;
  
  // Exchange code for tokens
  const tokenRes = await fetch('https://api.amazon.com/auth/o2/token', {
    method: 'POST',
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: process.env.REDIRECT_URI,
      client_id: process.env.LWA_CLIENT_ID,
      client_secret: process.env.LWA_CLIENT_SECRET
    })
  });
  
  const tokens = await tokenRes.json();
  
  // Store tokens server-side keyed by state/sessionId
  // Return a short-lived plugin token that references the server-side tokens
  const pluginToken = await storeTokensAndIssuePluginToken(state, tokens);
  
  // Redirect to a page the designer can copy the token from
  // OR use a custom URL scheme if your org supports it
  res.redirect(`/auth/success?token=${pluginToken}`);
}
```

**Step 3: Polling for the token back in the plugin**

Since the plugin cannot receive the browser callback directly, it polls:

```typescript
// In ui.html
async function pollForToken(sessionId: string, maxAttempts = 60): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(r => setTimeout(r, 2000)); // poll every 2s
    
    const res = await fetch(`https://your-api.vercel.app/api/auth/poll?session=${sessionId}`);
    if (res.ok) {
      const { token } = await res.json();
      if (token) return token;
    }
  }
  throw new Error('Authentication timed out');
}
```

**Alternative for private org plugins:** Issue API keys manually (one per designer) and distribute via a secure internal channel. Simpler than full OAuth for a closed team. Store the API key in `figma.clientStorage`.

### 6.3 Token Refresh Pattern

For long plugin sessions, the LWA access token (1 hour TTL) needs refreshing. Handle this in your Vercel middleware, not in the plugin itself:

```typescript
// Vercel middleware: /api/upload-image.ts
async function getLWAAccessToken(refreshToken: string): Promise<string> {
  // Check cache first
  const cached = tokenCache.get(refreshToken);
  if (cached && Date.now() < cached.expiresAt - 300_000) { // 5-min buffer
    return cached.accessToken;
  }
  
  const res = await fetch('https://api.amazon.com/auth/o2/token', {
    method: 'POST',
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: process.env.LWA_CLIENT_ID!,
      client_secret: process.env.LWA_CLIENT_SECRET!
    })
  });
  
  const { access_token, expires_in } = await res.json();
  tokenCache.set(refreshToken, {
    accessToken: access_token,
    expiresAt: Date.now() + expires_in * 1000
  });
  
  return access_token;
}
```

---

## 7. SP-API Image Upload Integration — End to End

### 7.1 Architecture Overview

```
Figma Plugin (ui.html)
        │
        │ POST multipart/form-data
        │ { image: PNG blob, asin: "B0XXXXX", imageSlot: "MAIN" }
        ▼
Vercel API Route (/api/upload-image)
        │
        ├─ Validate image (size, format, dimensions)
        ├─ Get LWA access token (refresh if needed)
        ├─ Sign request with AWS SigV4
        │
        │ Step 1: Create Feed document
        ▼
SP-API: POST /feeds/2021-06-30/documents
        │ { contentType: "image/jpeg" }
        │ → { feedDocumentId, url (pre-signed S3 URL) }
        │
        │ Step 2: Upload image to S3
        ▼
S3 Pre-signed URL (PUT with image bytes)
        │
        │ Step 3: Submit Feed
        ▼
SP-API: POST /feeds/2021-06-30/feeds
        │ { feedType: "POST_PRODUCT_IMAGE_DATA", feedDocumentId, ... }
        │ → { feedId }
        │
        │ Step 4: Poll feed status (async)
        ▼
SP-API: GET /feeds/2021-06-30/feeds/{feedId}
        │ → { processingStatus: "DONE" | "FATAL" | "IN_PROGRESS" }
        │
        ▼
Return { imageId, status } to Figma plugin
```

### 7.2 Vercel API Route Implementation

```typescript
// /api/upload-image.ts
import { SellingPartnerAPI } from 'amazon-sp-api'; // community SDK
import formidable from 'formidable';
import fs from 'fs';

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  
  // Parse multipart form
  const form = formidable({ maxFileSize: 20 * 1024 * 1024 }); // 20MB max
  const [fields, files] = await form.parse(req);
  
  const asin = fields.asin?.[0];
  const imageSlot = fields.imageSlot?.[0] || 'MAIN';
  const imageFile = files.image?.[0];
  
  if (!asin || !imageFile) {
    return res.status(400).json({ error: 'Missing asin or image' });
  }
  
  // Validate image dimensions
  const imageInfo = await getImageInfo(imageFile.filepath);
  if (imageInfo.width < 1000 || imageInfo.height < 1000) {
    return res.status(422).json({ 
      error: `Image too small: ${imageInfo.width}×${imageInfo.height}px. Minimum 1000×1000px.`
    });
  }
  
  const spClient = new SellingPartnerAPI({
    region: 'na',
    refresh_token: process.env.SP_API_REFRESH_TOKEN!,
    credentials: {
      SELLING_PARTNER_APP_CLIENT_ID: process.env.LWA_CLIENT_ID!,
      SELLING_PARTNER_APP_CLIENT_SECRET: process.env.LWA_CLIENT_SECRET!,
      AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID!,
      AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY!,
      AWS_SELLING_PARTNER_ROLE: process.env.SP_API_ROLE_ARN!
    }
  });
  
  try {
    // Step 1: Create feed document
    const docRes = await spClient.callAPI({
      operation: 'createFeedDocument',
      body: { contentType: 'image/jpeg' }
    });
    
    const { feedDocumentId, url } = docRes;
    
    // Step 2: Upload image bytes to S3 pre-signed URL
    const imageBytes = fs.readFileSync(imageFile.filepath);
    await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'image/jpeg' },
      body: imageBytes
    });
    
    // Step 3: Build the image feed XML
    const feedXml = buildImageFeedXml(asin, imageSlot, feedDocumentId);
    
    // Step 3b: Create feed document for XML metadata
    const xmlDocRes = await spClient.callAPI({
      operation: 'createFeedDocument',
      body: { contentType: 'text/xml; charset=UTF-8' }
    });
    
    await fetch(xmlDocRes.url, {
      method: 'PUT',
      headers: { 'Content-Type': 'text/xml; charset=UTF-8' },
      body: feedXml
    });
    
    // Step 4: Submit the feed
    const feedRes = await spClient.callAPI({
      operation: 'createFeed',
      body: {
        feedType: 'POST_PRODUCT_IMAGE_DATA',
        marketplaceIds: [process.env.MARKETPLACE_ID!],
        inputFeedDocumentId: xmlDocRes.feedDocumentId
      }
    });
    
    return res.json({ 
      feedId: feedRes.feedId,
      feedDocumentId,
      status: 'submitted'
    });
    
  } catch (err) {
    console.error('SP-API upload error:', err);
    return res.status(500).json({ error: err.message });
  }
}

function buildImageFeedXml(asin: string, imageType: string, documentId: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<AmazonEnvelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:noNamespaceSchemaLocation="amzn-envelope.xsd">
  <Header>
    <DocumentVersion>1.01</DocumentVersion>
    <MerchantIdentifier>${process.env.MERCHANT_ID}</MerchantIdentifier>
  </Header>
  <MessageType>ProductImage</MessageType>
  <Message>
    <MessageID>1</MessageID>
    <OperationType>Update</OperationType>
    <ProductImage>
      <SKU>${asin}</SKU>
      <ImageType>${imageType}</ImageType>
      <ImageLocation>${documentId}</ImageLocation>
    </ProductImage>
  </Message>
</AmazonEnvelope>`;
}
```

### 7.3 Polling Feed Status

Amazon processes feeds asynchronously. Poll the feed status endpoint:

```typescript
// /api/check-feed-status.ts
export default async function handler(req, res) {
  const { feedId } = req.query;
  
  const spClient = createSPClient();
  const feed = await spClient.callAPI({
    operation: 'getFeed',
    path: { feedId }
  });
  
  // processingStatus: 'QUEUED' | 'IN_PROGRESS' | 'DONE' | 'FATAL' | 'CANCELLED'
  return res.json({
    status: feed.processingStatus,
    resultFeedDocumentId: feed.resultFeedDocumentId
  });
}
```

For the plugin UI, implement a simple polling loop that checks every 5 seconds and updates the status indicator per frame.

---

## 8. n8n Webhook Integration

### 8.1 Why Route Through n8n

For syncflow, n8n sits between the Figma plugin and SP-API to:
- Handle LWA credential management without hardcoding in Vercel
- Log every upload event to a data table
- Send Slack notifications on success/failure
- Trigger downstream workflows (e.g., update listing status in a database)

### 8.2 Posting Multipart FormData from Plugin UI

```javascript
// In ui.html
async function uploadViaWebhook(frame) {
  const bytes = new Uint8Array(frame.bytesArray);
  const blob = new Blob([bytes], { type: 'image/png' });
  
  const formData = new FormData();
  formData.append('image', blob, `${frame.name}.png`);
  formData.append('asin', frame.asin);
  formData.append('imageSlot', frame.imageSlot);
  formData.append('uploadedBy', frame.uploaderEmail || 'unknown');
  formData.append('timestamp', new Date().toISOString());
  
  const res = await fetch(
    'https://your-n8n.com/webhook/amazon-image-upload',
    {
      method: 'POST',
      // Do NOT set Content-Type manually — let fetch set it with the boundary
      body: formData
    }
  );
  
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`n8n webhook error ${res.status}: ${body}`);
  }
  
  return await res.json();
}
```

> ⚠️ Never manually set `Content-Type: multipart/form-data` when using FormData. The browser must set it automatically so it includes the correct `boundary` parameter. If you set it manually, n8n will receive an unparseable body.

### 8.3 n8n Webhook Workflow Structure

```
Webhook (POST) ────► Extract binary image data
                         │
                         ▼
                     Validate fields (IF node)
                         │
                         ▼
                     HTTP Request → SP-API /feeds/documents (create)
                         │
                         ▼
                     HTTP Request → S3 pre-signed URL (PUT image)
                         │
                         ▼
                     HTTP Request → SP-API /feeds (submit)
                         │
                         ▼
                     Wait node (5s)
                         │
                         ▼
                     HTTP Request → SP-API /feeds/{feedId} (poll)
                         │
                    ┌────┴────┐
                 DONE         IN_PROGRESS/FATAL
                    │                │
                    ▼                ▼
             Respond to          Wait + retry
             Webhook (200)       (max 5 polls)
                    │
                    ▼
             Slack notification + log to Supabase
```

### 8.4 Handling Async Responses in the Plugin

n8n's webhook can respond immediately (before the upload completes) or wait for the full pipeline. For a synchronous response pattern:

```javascript
// ui.html — with timeout handling
async function uploadWithTimeout(frame, timeoutMs = 30000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const res = await fetch(WEBHOOK_URL, {
      method: 'POST',
      body: buildFormData(frame),
      signal: controller.signal
    });
    
    clearTimeout(timeout);
    
    if (res.status === 202) {
      // n8n accepted but processing async — poll for status
      const { jobId } = await res.json();
      return await pollJobStatus(jobId);
    }
    
    return await res.json();
    
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') {
      throw new Error('Upload timed out after 30 seconds');
    }
    throw err;
  }
}
```

### 8.5 Upload Progress Display

Since the plugin cannot get real-time streaming feedback from a single fetch call, simulate progress:

```javascript
function startFakeProgress(nodeId, durationMs = 8000) {
  let progress = 0;
  const interval = setInterval(() => {
    progress = Math.min(progress + Math.random() * 8, 90); // cap at 90% until confirmed
    updateProgressBar(nodeId, progress);
  }, 400);
  
  return {
    complete: (success) => {
      clearInterval(interval);
      updateProgressBar(nodeId, success ? 100 : 0);
    }
  };
}
```

---

## 9. Figma Variables and Design Tokens

### 9.1 Reading Brand Colour Variables

Figma Variables (released 2023) replace the older Styles system for design tokens. Your plugin can read them to validate design compliance.

```typescript
// In main.ts
function getBrandColourVariables() {
  const variables = figma.variables.getLocalVariables('COLOR');
  
  return variables.map(v => ({
    id: v.id,
    name: v.name,         // e.g., "Brand/Primary/Orange"
    collectionId: v.variableCollectionId,
    // Values per mode (e.g., Light/Dark)
    values: Object.entries(v.valuesByMode).reduce((acc, [modeId, value]) => {
      if (typeof value === 'object' && 'r' in value) {
        acc[modeId] = rgbToHex(value as RGB);
      }
      return acc;
    }, {} as Record<string, string>)
  }));
}

function rgbToHex(rgb: RGB): string {
  const r = Math.round(rgb.r * 255).toString(16).padStart(2, '0');
  const g = Math.round(rgb.g * 255).toString(16).padStart(2, '0');
  const b = Math.round(rgb.b * 255).toString(16).padStart(2, '0');
  return `#${r}${g}${b}`.toUpperCase();
}
```

### 9.2 Compliance Validation

For Amazon brand-registered sellers with strict visual guidelines:

```typescript
function validateFrameCompliance(
  frame: FrameNode,
  brandTokens: ReturnType<typeof getBrandColourVariables>
): { valid: boolean; violations: string[] } {
  const violations: string[] = [];
  const brandHexValues = new Set(brandTokens.flatMap(t => Object.values(t.values)));
  
  // Check fills for non-brand colours
  for (const fill of frame.fills as SolidPaint[]) {
    if (fill.type === 'SOLID') {
      const hex = rgbToHex(fill.color);
      if (!brandHexValues.has(hex)) {
        violations.push(`Non-brand colour found: ${hex}`);
      }
    }
  }
  
  // Check minimum size
  if (frame.width < 1000 || frame.height < 1000) {
    violations.push(`Frame too small: ${frame.width}×${frame.height}px`);
  }
  
  return { valid: violations.length === 0, violations };
}
```

### 9.3 Exporting Tokens to JSON (Design Token Format)

```typescript
function exportTokens(): object {
  const collections = figma.variables.getLocalVariableCollections();
  const output: Record<string, any> = {};
  
  for (const collection of collections) {
    const collectionTokens: Record<string, any> = {};
    
    for (const variableId of collection.variableIds) {
      const variable = figma.variables.getVariableById(variableId);
      if (!variable) continue;
      
      // Build nested object from slash-separated name
      const parts = variable.name.split('/');
      let ref = collectionTokens;
      for (let i = 0; i < parts.length - 1; i++) {
        ref[parts[i]] = ref[parts[i]] || {};
        ref = ref[parts[i]];
      }
      
      const lastKey = parts[parts.length - 1];
      const modeId = collection.defaultModeId;
      ref[lastKey] = {
        $value: variable.valuesByMode[modeId],
        $type: variable.resolvedType.toLowerCase()
      };
    }
    
    output[collection.name] = collectionTokens;
  }
  
  return output;
}
```

---

## 10. Plugin UI Development

### 10.1 React in Figma Plugins

React works in the ui.html iframe. The recommended setup uses the **`create-figma-plugin`** template with the `ui` preset:

```bash
npx create-figma-plugin --template ui
```

This scaffolds: React + TypeScript + Preact (smaller bundle) + the official Figma Plugin DS component library.

### 10.2 Figma Plugin DS

The [Figma Plugin DS](https://github.com/thomas-lowry/figma-plugin-ds) (Thomas Lowry) provides native-looking Figma UI components: buttons, inputs, dropdowns, checkboxes, radio buttons, progress bars. It matches the Figma UI aesthetic exactly, which matters for a plugin that feels native.

```bash
npm install figma-plugin-ds
```

```typescript
import 'figma-plugin-ds/dist/figma-plugin-ds.css';
import Button from 'figma-plugin-ds/dist/components/Button';
import Input from 'figma-plugin-ds/dist/components/Input';
import ProgressBar from 'figma-plugin-ds/dist/components/ProgressBar';
```

For a more modern and actively maintained alternative, use the official **[Figma UI Kit React](https://github.com/figma/plugin-samples/tree/master/react)** or the community **`@create-figma-plugin/ui`** package which ships with the `create-figma-plugin` tool.

### 10.3 Plugin Sizing

```typescript
// In main.ts, before showUI or after
figma.ui.resize(400, 600); // width, height in pixels

// Dynamic resize based on content state
figma.ui.onmessage = (msg) => {
  if (msg.type === 'RESIZE') {
    figma.ui.resize(msg.width, msg.height);
  }
};
```

From ui.html, request a resize:
```javascript
parent.postMessage({ pluginMessage: { type: 'RESIZE', width: 400, height: 800 } }, '*');
```

Common sizes:
- Compact tool panel: 300×200
- Standard form: 400×500
- Batch upload dashboard: 500×700

### 10.4 Dark Mode Support

Figma exposes the current theme:

```typescript
// In main.ts
const theme = figma.editorType === 'figma' ? figma.currentTheme : 'light';
figma.ui.postMessage({ type: 'THEME', theme });
```

In ui.html:
```javascript
window.onmessage = (e) => {
  if (e.data.pluginMessage?.type === 'THEME') {
    document.body.setAttribute('data-theme', e.data.pluginMessage.theme);
  }
};
```

CSS:
```css
[data-theme="dark"] {
  --color-bg: #2c2c2c;
  --color-text: #ffffff;
  --color-border: #444444;
}
[data-theme="light"] {
  --color-bg: #ffffff;
  --color-text: #000000;
  --color-border: #e5e5e5;
}
```

### 10.5 Showing the UI vs. Headless Mode

Some plugin operations don't need a UI (e.g., auto-tagging frames by name):

```typescript
// Headless — no UI shown
async function runHeadless() {
  const frames = figma.currentPage.selection as FrameNode[];
  frames.forEach(f => f.setPluginData('autoTagged', 'true'));
  figma.notify('✓ Tagged ' + frames.length + ' frames');
  figma.closePlugin();
}

// Show UI only if needed
if (needsUserInput) {
  figma.showUI(__html__, { width: 400, height: 500 });
} else {
  await runHeadless();
}
```

`figma.notify()` shows a toast notification in the bottom bar — useful for headless confirmations.

---

## 11. Publishing Workflow for Private Organisation Plugins

### 11.1 Private vs. Organisation Plugins

| Type | Who Can Use | How Distributed | In Marketplace |
|---|---|---|---|
| **Development plugin** | Only you (dev mode) | Via manifest JSON file | No |
| **Private plugin** | Anyone with the manifest | Share manifest file | No |
| **Organisation plugin** | Everyone in your Figma org | Install from Admin panel | No (internal only) |
| **Public plugin** | Anyone on Figma | Figma Community | Yes |

For syncflow's Amazon team, **Organisation plugin** is the right choice: it appears in every team member's plugin list automatically, without them needing to install anything manually.

### 11.2 Publishing as an Organisation Plugin

1. In Figma Desktop: Plugins → Development → your plugin → Publish
2. Choose **Organisation** (requires an admin account or org-level permissions)
3. Fill in name, description, cover image (required: 1920×960px)
4. Set visibility to **Organisation only**
5. Click Publish

**After publishing:**
- Figma rolls out to all org members automatically
- Updates are pushed by republishing — designers get them on next Figma open
- No App Store review required for org-private plugins

### 11.3 Distributing via Manifest (Small Teams)

For smaller or non-enterprise teams without a Figma org plan:

```bash
# Share the manifest.json + compiled dist/ with designers
# They install via: Plugins → Development → Import plugin from manifest
```

This is less seamless but works on any Figma plan.

### 11.4 Versioning

Track your plugin version in `manifest.json` (you can add a custom `version` field) and in `figma.clientStorage`:

```typescript
const PLUGIN_VERSION = '1.3.0';

// On plugin open: check for version mismatch
const storedVersion = await figma.clientStorage.getAsync('pluginVersion');
if (storedVersion !== PLUGIN_VERSION) {
  // Show changelog or migration UI
  await figma.clientStorage.setAsync('pluginVersion', PLUGIN_VERSION);
}
```

---

## 12. Error Handling and User Feedback

### 12.1 Progress Tracking for Batch Uploads

```typescript
// State model for UI
interface FrameUploadState {
  nodeId: string;
  name: string;
  asin: string;
  status: 'pending' | 'exporting' | 'uploading' | 'success' | 'error';
  progress: number;  // 0-100
  errorMessage?: string;
  imageId?: string;
}
```

Display a row per frame with a mini progress bar, status icon, and retry button.

### 12.2 SP-API Error Translation

SP-API returns cryptic error codes. Map them to human-readable messages in your Vercel layer before returning to the plugin:

```typescript
const SP_API_ERRORS: Record<string, string> = {
  'INVALID_IMAGE_TYPE': 'Image format not accepted. Use JPEG or PNG.',
  'IMAGE_TOO_SMALL': 'Image must be at least 1000×1000 pixels.',
  'INVALID_ASIN': 'ASIN not found in your catalog. Check the ASIN and try again.',
  'IMAGE_BLURRY': 'Amazon detected image quality issues. Try re-exporting at higher resolution.',
  'BACKGROUND_NOT_WHITE': 'MAIN image must have a pure white background (RGB 255,255,255).',
  'TEXT_ON_IMAGE': 'Promotional text is not allowed on MAIN images.',
  'FEED_PROCESSING_FATAL': 'Amazon rejected the feed. Check the feed result document for details.'
};

function translateSPAPIError(code: string, detail: string): string {
  return SP_API_ERRORS[code] || `Upload failed: ${detail || code}`;
}
```

### 12.3 Retry Logic

```javascript
// ui.html
async function uploadWithRetry(frame, maxRetries = 3) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await uploadFrame(frame);
    } catch (err) {
      lastError = err;
      
      // Don't retry on validation errors (4xx) — only on network/5xx
      if (err.statusCode && err.statusCode < 500) {
        throw err;
      }
      
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // exponential backoff
        updateFrameStatus(frame.nodeId, 'retrying', `Retry ${attempt}/${maxRetries} in ${delay/1000}s`);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }
  
  throw lastError;
}
```

### 12.4 User-Visible Feedback Checklist

Every async operation in the plugin should have:
- **Pre-action state:** "Ready to upload" / selected frame count
- **In-progress:** spinner or progress bar with activity label
- **Success:** green check, summary of what was uploaded
- **Error:** red icon, plain-English message, retry button
- **Completion summary:** "3/4 frames uploaded successfully. 1 failed (see details)"

---

## 13. Common Plugin Limitations and Workarounds

### 13.1 No Direct Filesystem Access

**Limitation:** Neither main.ts nor ui.html can read or write to the local filesystem.

**Workaround:** If you need to import an ASIN list from a CSV, use the HTML `<input type="file">` element in ui.html — the user selects the file through the native file picker, and the FileReader API reads its contents into memory.

```html
<input type="file" id="asinCsv" accept=".csv" />
<script>
  document.getElementById('asinCsv').onchange = (e) => {
    const reader = new FileReader();
    reader.onload = (ev) => parseAsinCsv(ev.target.result);
    reader.readAsText(e.target.files[0]);
  };
</script>
```

### 13.2 CORS Restrictions in ui.html

**Limitation:** `fetch()` in ui.html respects browser CORS rules. If your Vercel endpoint or n8n instance doesn't return `Access-Control-Allow-Origin: *` (or your Figma plugin's origin), requests fail with CORS errors.

**Workaround:** Add CORS headers to every endpoint the plugin calls. In Vercel:

```typescript
// In every API route
res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

if (req.method === 'OPTIONS') {
  return res.status(200).end(); // preflight
}
```

In n8n webhooks: the Respond to Webhook node supports custom headers — add `Access-Control-Allow-Origin: *` there.

### 13.3 Sandbox Restrictions in main.ts

**Limitation:** main.ts runs in a **restricted JavaScript sandbox** — no `fetch`, no `setTimeout`/`setInterval` (in older API versions), no DOM, no `require`, no Node.js built-ins.

**What IS available in main.ts:**
- All `figma.*` APIs
- `figma.clientStorage` (async KV)
- `figma.ui.postMessage()` / `figma.ui.onmessage`
- Basic JS globals: `Promise`, `JSON`, `Math`, `Array`, `Object`
- `console.log()` (shows in Figma's developer console)
- `setTimeout` / `setInterval` (available in API v1+)

**What is NOT available:**
- `fetch`, `XMLHttpRequest`, `WebSocket`
- `window`, `document`, `navigator`
- Node.js modules
- File system APIs

### 13.4 Plugin Execution Timeout

**Limitation:** Figma will terminate a plugin if it runs for too long without user interaction or progress. The exact timeout is not documented but is observed at ~60–90 seconds of unresponsive execution.

**Workaround:** For long operations (batch exporting 20+ frames), post regular progress updates to the UI. Figma treats any postMessage as "alive" activity and resets the idle timer.

### 13.5 Large Image Data Transfer

**Limitation:** Passing large `Uint8Array` values (3–8MB per 3× frame export) through postMessage involves a full memory copy, not a reference transfer.

**Workaround for performance:** Export and upload frames one at a time rather than exporting all frames and then uploading all. This keeps peak memory low:

```typescript
// main.ts — pipeline pattern (export one, signal, export next)
async function streamingExportAndUpload(nodes: FrameNode[]) {
  for (const node of nodes) {
    const bytes = await node.exportAsync({ format: 'PNG', constraint: { type: 'SCALE', value: 3 } });
    
    // Send one at a time and wait for upload confirmation before next export
    figma.ui.postMessage({ 
      type: 'UPLOAD_FRAME', 
      nodeId: node.id,
      name: node.name,
      bytesArray: Array.from(bytes) 
    });
    
    // Wait for upload ACK before proceeding
    await waitForAck(node.id);
  }
}

function waitForAck(nodeId: string): Promise<void> {
  return new Promise((resolve) => {
    const handler = (msg: PluginMessage) => {
      if (msg.type === 'UPLOAD_ACK' && msg.nodeId === nodeId) {
        figma.ui.offMessage(handler); // Not officially supported — use a different pattern
        resolve();
      }
    };
    figma.ui.onmessage = handler; // Note: replaces previous handler
  });
}
```

### 13.6 No Direct Canvas Read from ui.html

**Limitation:** ui.html cannot directly read `figma.currentPage.selection` or any canvas state.

**Workaround:** main.ts must proactively push canvas state to ui.html via postMessage whenever it changes. Use `figma.on('selectionchange', ...)` to push updates.

---

## 14. Testing and Debugging

### 14.1 Development Mode in Figma Desktop

1. Open Figma Desktop
2. Plugins → Development → Import plugin from manifest → select your `manifest.json`
3. Your plugin appears in Plugins → Development → [Plugin Name]
4. Run it directly from the menu — no build step needed if you have watch mode active

### 14.2 Hot Reload with Watch Mode

```bash
# With create-figma-plugin
npm run watch

# With esbuild manually
esbuild src/main.ts --bundle --outfile=dist/main.js --watch

# With webpack
webpack --watch
```

After each code change, close and reopen the plugin in Figma to pick up the new compiled output. Figma does **not** auto-reload — you must close and re-run the plugin.

### 14.3 Console Logging

```typescript
// main.ts — visible in Figma's developer console
console.log('Selection:', figma.currentPage.selection.length, 'nodes');
console.error('Export failed for node:', node.id);

// View in: Plugins → Development → Open Console
```

For ui.html, open the browser developer tools: right-click in the plugin UI panel → Inspect (only available when developer mode is enabled in Figma Desktop preferences).

### 14.4 Inspecting postMessage Traffic

Add a debug logger to both threads:

```typescript
// main.ts
const origOnMessage = figma.ui.onmessage;
figma.ui.onmessage = (msg) => {
  console.log('[main ←ui]', JSON.stringify(msg).slice(0, 200));
  origOnMessage?.(msg);
};

const origPostMessage = figma.ui.postMessage.bind(figma.ui);
figma.ui.postMessage = (msg) => {
  console.log('[main →ui]', JSON.stringify(msg).slice(0, 200));
  origPostMessage(msg);
};
```

### 14.5 Common Debugging Patterns

| Symptom | Likely Cause | Fix |
|---|---|---|
| Plugin opens but immediately closes | Unhandled error in main.ts | Check Figma console for stack trace |
| fetch() silently fails | Domain not in `networkAccess.allowedDomains` | Add domain to manifest.json |
| fetch() CORS error | Missing CORS headers on server | Add `Access-Control-Allow-Origin: *` |
| Uint8Array arrives as `{}` in ui.html | postMessage serializes objects, not typed arrays | Use `Array.from(bytes)` before posting |
| `figma.selection` is always empty | Calling before `figma.showUI()` | Check timing; listen to `selectionchange` |
| clientStorage returns `undefined` | First run or wrong key name | Always handle the undefined case |
| Plugin hangs with no output | exportAsync on a large frame took too long | Add loading state before calling it |

---

## 15. Complete Example: Minimal Amazon Image Uploader Plugin

This is a stripped-down but fully functional plugin demonstrating all concepts.

### manifest.json

```json
{
  "name": "Amazon Image Uploader",
  "id": "1234567890123456789",
  "api": "1.0.0",
  "main": "dist/main.js",
  "ui": "dist/ui.html",
  "editorType": ["figma"],
  "documentAccess": "dynamic-page",
  "networkAccess": {
    "allowedDomains": ["https://your-api.vercel.app"]
  }
}
```

### main.ts

```typescript
// main.ts — Figma API thread
const UPLOAD_ENDPOINT = 'https://your-api.vercel.app/api/upload-image';

figma.showUI(__html__, { width: 440, height: 560, title: 'Amazon Image Uploader' });

// Push current selection to UI on open
pushSelectionToUI();

// Update UI when selection changes
figma.on('selectionchange', pushSelectionToUI);

function pushSelectionToUI() {
  const frames = (figma.currentPage.selection as SceneNode[])
    .filter(n => n.type === 'FRAME') as FrameNode[];

  figma.ui.postMessage({
    type: 'SELECTION_CHANGED',
    frames: frames.map(f => ({
      id: f.id,
      name: f.name,
      width: f.width,
      height: f.height,
      asin: f.getPluginData('asin') || '',
      imageSlot: f.getPluginData('imageSlot') || 'MAIN'
    }))
  });
}

figma.ui.onmessage = async (msg) => {
  switch (msg.type) {

    case 'EXPORT_AND_UPLOAD': {
      const { asinMap } = msg; // { [nodeId]: { asin, imageSlot } }
      const frames = (figma.currentPage.selection as SceneNode[])
        .filter(n => n.type === 'FRAME') as FrameNode[];

      for (const frame of frames) {
        figma.ui.postMessage({ type: 'FRAME_STATUS', nodeId: frame.id, status: 'exporting' });

        try {
          const bytes = await frame.exportAsync({
            format: 'PNG',
            constraint: { type: 'SCALE', value: 3 }
          });

          const meta = asinMap[frame.id] || {};

          figma.ui.postMessage({
            type: 'UPLOAD_FRAME',
            nodeId: frame.id,
            name: frame.name,
            bytesArray: Array.from(bytes),
            asin: meta.asin || frame.getPluginData('asin'),
            imageSlot: meta.imageSlot || frame.getPluginData('imageSlot') || 'MAIN'
          });

        } catch (err) {
          figma.ui.postMessage({
            type: 'FRAME_STATUS',
            nodeId: frame.id,
            status: 'error',
            message: err instanceof Error ? err.message : 'Export failed'
          });
        }
      }
      break;
    }

    case 'SAVE_ASIN_MAPPING': {
      const node = figma.getNodeById(msg.nodeId);
      if (node && 'setPluginData' in node) {
        node.setPluginData('asin', msg.asin);
        node.setPluginData('imageSlot', msg.imageSlot);
      }
      break;
    }

    case 'MARK_UPLOADED': {
      const node = figma.getNodeById(msg.nodeId);
      if (node && 'setPluginData' in node) {
        node.setPluginData('lastUploadedAt', new Date().toISOString());
        node.setPluginData('amazonImageId', msg.imageId || '');
      }
      figma.notify(`✓ ${msg.name} uploaded`, { timeout: 2000 });
      break;
    }

    case 'CLOSE':
      figma.closePlugin();
      break;
  }
};
```

### ui.html

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: Inter, sans-serif; font-size: 12px; }
    body { background: #fff; color: #333; padding: 12px; }
    h2 { font-size: 13px; font-weight: 600; margin-bottom: 12px; }
    .frame-row { display: flex; align-items: center; gap: 8px; padding: 8px; border: 1px solid #e5e5e5; border-radius: 4px; margin-bottom: 6px; }
    .frame-name { flex: 1; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .asin-input { width: 100px; border: 1px solid #ccc; border-radius: 3px; padding: 4px 6px; }
    .slot-select { width: 70px; border: 1px solid #ccc; border-radius: 3px; padding: 4px; }
    .status { font-size: 11px; color: #888; min-width: 60px; text-align: right; }
    .status.success { color: #1a7f3c; }
    .status.error { color: #c0392b; }
    .status.uploading { color: #2563eb; }
    .progress-bar { height: 3px; background: #e5e5e5; border-radius: 2px; margin-top: 3px; }
    .progress-fill { height: 100%; background: #2563eb; border-radius: 2px; transition: width 0.3s; }
    #upload-btn { width: 100%; padding: 8px; background: #ff9900; color: #fff; border: none; border-radius: 4px; font-weight: 600; cursor: pointer; margin-top: 12px; }
    #upload-btn:disabled { background: #ccc; cursor: not-allowed; }
    #empty-state { color: #999; text-align: center; padding: 24px; }
    .token-section { background: #f7f7f7; border-radius: 4px; padding: 10px; margin-bottom: 12px; }
    .token-input { width: 100%; border: 1px solid #ccc; border-radius: 3px; padding: 4px 8px; }
  </style>
</head>
<body>

<div class="token-section">
  <label style="font-weight:500; display:block; margin-bottom:4px;">API Token</label>
  <input type="password" id="api-token" class="token-input" placeholder="Paste your upload token..." />
</div>

<h2 id="frame-count">Select frames to upload</h2>
<div id="frame-list"></div>
<div id="empty-state">No frames selected.<br/>Select one or more Frames in Figma.</div>

<button id="upload-btn" disabled>Upload Selected Frames to Amazon</button>

<script>
  const frameList = document.getElementById('frame-list');
  const emptyState = document.getElementById('empty-state');
  const uploadBtn = document.getElementById('upload-btn');
  const frameCount = document.getElementById('frame-count');

  let frames = [];
  const statusMap = {};

  // Restore token
  const savedToken = localStorage.getItem('amazon_upload_token');
  if (savedToken) document.getElementById('api-token').value = savedToken;
  document.getElementById('api-token').addEventListener('change', (e) => {
    localStorage.setItem('amazon_upload_token', e.target.value);
  });

  // Receive messages from main.ts
  window.onmessage = async (event) => {
    const msg = event.data.pluginMessage;
    if (!msg) return;

    if (msg.type === 'SELECTION_CHANGED') {
      frames = msg.frames;
      renderFrameList();
    }

    if (msg.type === 'UPLOAD_FRAME') {
      await handleUpload(msg);
    }

    if (msg.type === 'FRAME_STATUS') {
      updateStatus(msg.nodeId, msg.status, msg.message);
    }
  };

  function renderFrameList() {
    if (frames.length === 0) {
      frameList.innerHTML = '';
      emptyState.style.display = 'block';
      uploadBtn.disabled = true;
      frameCount.textContent = 'Select frames to upload';
      return;
    }

    emptyState.style.display = 'none';
    uploadBtn.disabled = false;
    frameCount.textContent = `${frames.length} frame${frames.length > 1 ? 's' : ''} selected`;

    frameList.innerHTML = frames.map(f => `
      <div class="frame-row" id="row-${f.id.replace(':', '_')}">
        <div class="frame-name" title="${f.name}">${f.name}</div>
        <input class="asin-input" placeholder="ASIN" value="${f.asin}" 
               data-id="${f.id}" onchange="saveMapping(this)" />
        <select class="slot-select" data-id="${f.id}" onchange="saveMapping(this)">
          ${['MAIN','PT01','PT02','PT03','PT04','PT05','PT06','PT07','PT08','SWATCH'].map(s =>
            `<option ${f.imageSlot === s ? 'selected' : ''}>${s}</option>`
          ).join('')}
        </select>
        <div class="status" id="status-${f.id.replace(':', '_')}">–</div>
      </div>
    `).join('');
  }

  function saveMapping(el) {
    const nodeId = el.dataset.id;
    const row = el.closest('.frame-row');
    const asin = row.querySelector('.asin-input').value;
    const imageSlot = row.querySelector('.slot-select').value;
    parent.postMessage({ pluginMessage: { type: 'SAVE_ASIN_MAPPING', nodeId, asin, imageSlot } }, '*');
  }

  function updateStatus(nodeId, status, message) {
    const key = nodeId.replace(':', '_');
    const el = document.getElementById(`status-${key}`);
    if (!el) return;
    el.textContent = { 
      exporting: '⏳ Exporting…', 
      uploading: '↑ Uploading…', 
      success: '✓ Done',
      error: '✗ Error',
      retrying: '↻ Retrying'
    }[status] || status;
    el.className = `status ${status}`;
    if (message) el.title = message;
  }

  uploadBtn.addEventListener('click', () => {
    const token = document.getElementById('api-token').value;
    if (!token) {
      alert('Please enter your API token first.');
      return;
    }
    
    const asinMap = {};
    document.querySelectorAll('.frame-row').forEach(row => {
      const asinInput = row.querySelector('.asin-input');
      const slotSelect = row.querySelector('.slot-select');
      const id = asinInput.dataset.id;
      asinMap[id] = { asin: asinInput.value, imageSlot: slotSelect.value };
    });
    
    uploadBtn.disabled = true;
    parent.postMessage({ pluginMessage: { type: 'EXPORT_AND_UPLOAD', asinMap } }, '*');
  });

  async function handleUpload(msg) {
    const { nodeId, name, bytesArray, asin, imageSlot } = msg;
    updateStatus(nodeId, 'uploading');

    const token = document.getElementById('api-token').value;
    
    try {
      const bytes = new Uint8Array(bytesArray);
      const blob = new Blob([bytes], { type: 'image/png' });
      const form = new FormData();
      form.append('image', blob, `${name}.png`);
      form.append('asin', asin);
      form.append('imageSlot', imageSlot);

      const res = await fetch('https://your-api.vercel.app/api/upload-image', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: form
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
        throw new Error(err.message || err.error);
      }

      const result = await res.json();
      updateStatus(nodeId, 'success');
      
      parent.postMessage({ 
        pluginMessage: { type: 'MARK_UPLOADED', nodeId, name, imageId: result.imageId } 
      }, '*');

    } catch (err) {
      updateStatus(nodeId, 'error', err.message);
    } finally {
      // Re-enable button if all frames are processed
      const allDone = frames.every(f => {
        const key = f.id.replace(':', '_');
        const el = document.getElementById(`status-${key}`);
        return el && (el.classList.contains('success') || el.classList.contains('error'));
      });
      if (allDone) uploadBtn.disabled = false;
    }
  }
</script>
</body>
</html>
```

---

## 16. Dos & Don'ts

### ✅ Dos

1. **Do keep all network calls in ui.html.** The architecture boundary is non-negotiable. If you try to call fetch from main.ts, you get a silent failure that is very hard to debug. Design for this constraint from the start.

2. **Do convert Uint8Array to Array before postMessage.** Typed arrays serialize fine but arrive as plain objects on some Figma plugin versions. Use `Array.from(bytes)` in main.ts and `new Uint8Array(array)` in ui.html. This costs ~2ms and saves hours of debugging.

3. **Do export frames sequentially, not in parallel.** `Promise.all([...exportAsync()])` across 8 frames at 3× scale will spike memory and may freeze Figma. Sequential export with progress reporting is both safer and more informative for the user.

4. **Do use `node.setPluginData()` to tag frames with ASIN and slot metadata.** Persistence lives on the node — designers don't need to re-enter ASINs every session, and the mapping moves with the file if it's duplicated.

5. **Do list every external domain in `networkAccess.allowedDomains`.** If it's missing, fetch silently fails with no error — the hardest class of bug to diagnose. Include staging, production, and any n8n URLs.

6. **Do handle the `undefined` case from `figma.clientStorage.getAsync()`.** On a fresh install, every key returns undefined. Never assume a stored value exists; always provide a fallback.

7. **Do post progress updates to ui.html during batch exports.** `EXPORT_PROGRESS` messages serve two purposes: they update the UI and they reset Figma's idle-termination timer. Without them, a 20-frame export may be killed mid-way.

8. **Do validate image size before attempting upload.** An SP-API feed error for undersized images takes 10–30 minutes to process before you know it failed. A synchronous size check in the plugin (or Vercel layer) gives immediate feedback.

9. **Do use `figma.notify()` for lightweight confirmations.** The toast at the bottom of the canvas is the right place for short success messages. Reserve the plugin panel for detailed status and error information.

10. **Do add CORS headers to your Vercel and n8n endpoints.** Include a preflight `OPTIONS` handler. Missing CORS headers on the endpoint is the #1 cause of plugin network failures in production.

11. **Do listen to `figma.on('selectionchange', ...)` and keep the UI state in sync.** If the designer changes their selection while the plugin is open, the plugin should reflect it immediately rather than operating on stale data.

12. **Do use `figma.openExternal(url)` for OAuth flows** rather than embedding a full auth flow in the plugin iframe. The browser is more trusted for OAuth and avoids iframe CORS restrictions.

---

### ❌ Don'ts

1. **Don't try to make network requests from main.ts.** There is no workaround. `fetch` is not available. `XMLHttpRequest` is not available. `require('https')` is not available. Design your architecture around this from day one.

2. **Don't store LWA refresh tokens or SP-API credentials in ui.html's localStorage.** Use `figma.clientStorage` (main thread) for sensitive tokens. `localStorage` is accessible to any code running in the iframe and is cleared on browser cache flush.

3. **Don't set `Content-Type: multipart/form-data` manually when posting FormData.** This removes the boundary parameter and breaks multipart parsing on the server. Let the browser set the header automatically.

4. **Don't use `Promise.all()` for large batch exports.** Memory spikes, Figma freezes, and you lose per-item progress reporting. Always loop sequentially.

5. **Don't hardcode your LWA client secret or SP-API credentials in the plugin code.** The plugin bundle is inspectable by anyone who installs it. Credentials belong in your Vercel environment variables, accessed server-side only.

6. **Don't assume `figma.currentPage.selection` is available at plugin start.** If you're reading selection synchronously at the top of main.ts (before `showUI` or `on('selectionchange')`), it may be stale or empty. Read it inside a `selectionchange` handler or after a micro-delay.

7. **Don't change the plugin ID in manifest.json after publish.** The ID is the permanent identity of your plugin. Changing it creates a new plugin and breaks continuity for existing users — including breaking their stored `clientStorage` data under the old ID.

8. **Don't skip the `editorType` field in manifest.json.** Without it, Figma may make your plugin appear in FigJam or Dev Mode contexts where it doesn't work correctly, causing confusing errors.

9. **Don't rely on frame pixel dimensions from `node.width`/`node.height` without accounting for export scale.** A 1000×1000px design-unit frame exported at 3× produces a 3000×3000px image. When validating dimensions server-side, check the actual pixel count of the uploaded file, not the reported frame dimensions from the plugin metadata.

10. **Don't try to receive postMessages from the plugin UI using `window.addEventListener('message', ...)` in main.ts.** In main.ts, the correct API is `figma.ui.onmessage = (msg) => {...}`. The `event.data.pluginMessage` unwrapping only applies to ui.html's `window.onmessage` listener.

11. **Don't skip the feed status polling step.** A `POST /feeds` call returning 200 means Amazon accepted the feed for processing — not that the image was actually uploaded and validated. Always poll `GET /feeds/{feedId}` until `processingStatus` is `DONE` or `FATAL` before reporting success to the user.

12. **Don't publish a plugin to the public Figma Community** if it embeds org-specific logic, ASIN catalogs, or auth endpoints. Use the Organisation plugin distribution path. Public plugins are indexed and accessible to anyone — the wrong choice for internal tooling.

---

> **Last Updated:** May 2026  
> **Relevant to:** syncflow Image Upload Bottleneck module, Figma Plugin SDK v1, SP-API Feeds API 2021-06-30

---

## Useful Links

- [Figma Plugin API Reference](https://www.figma.com/plugin-docs/api/api-reference/) — official, keep this open
- [Figma Plugin Samples (GitHub)](https://github.com/figma/plugin-samples) — canonical examples from Figma
- [create-figma-plugin](https://yuanqing.github.io/create-figma-plugin/) — the best scaffolding tool
- [@figma/plugin-typings (npm)](https://www.npmjs.com/package/@figma/plugin-typings) — TypeScript definitions
- [Figma Plugin DS (UI components)](https://github.com/thomas-lowry/figma-plugin-ds) — native-style components
- [SP-API Feeds API docs](https://developer-docs.amazon.com/sp-api/docs/feeds-api-v2021-06-30-reference) — image upload via Feeds
- [amazon-sp-api (Node SDK)](https://github.com/amzn/selling-partner-api-models) — community SP-API client for Node.js
- [Figma Plugin Testing Guide](https://www.figma.com/plugin-docs/how-plugins-run/) — threading model deep-dive
