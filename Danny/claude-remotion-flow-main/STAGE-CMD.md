# Stage Command — claude-remotion-flow (Block C2)

## Primary demo

```bash
npm run dev
```

Boots Remotion Studio at http://localhost:3000. Shows registered compositions including the new `PipelineProofDemo16` and `RetechShowcase45`.

## Backup demos (if Studio is slow to boot)

```bash
npm run audition
```

Auditioner + Loop Cutter at http://localhost:4747 (auditioner root, `/cutter` for the cutter).

```bash
npm run render:stack
```

Renders the example StackExplainer composition out → `out/StackExplainer.mp4`.

## Notes for stage

- `npm run lint` will surface TS6133 unused-decl warnings on `LoomWalkthrough.tsx`, `RetechShowcase45.tsx`, `Root.tsx` — **non-fatal**, don't run lint live. Studio uses esbuild, not tsc, and tolerates these.
- If port 3000 is already in use: `lsof -ti:3000 | xargs kill -9` then retry.
- Live URL of the art kit Danny references: https://algorithmic-art-templates.netlify.app/
