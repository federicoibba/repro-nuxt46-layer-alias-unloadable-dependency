# Nuxt 4.6 — layer-relative `@/` alias fails in dev dependency optimization

## Summary

On Nuxt **4.6**, `nuxt dev` aborts dependency optimization when a layer
installed under `node_modules` has `app/` source that imports a sibling via the
layer-relative alias `@/` (or `~/`). The alias is resolved against the
**consumer app's** `srcDir` instead of the **layer's own** `srcDir`:

```
ERROR  [unhandledRejection] Error during dependency optimization:

Build failed with 1 error:

[UNLOADABLE_DEPENDENCY] Could not load app/utils/greeting
   ╭─[ node_modules/my-layer/app/composables/useGreeting.ts ]
   │ import { makeGreeting } from '@/utils/greeting'
   │                              No such file or directory (os error 2)
```

`@/utils/greeting` should resolve to
`node_modules/my-layer/app/utils/greeting.ts` (the layer's own srcDir), but the
dev optimizer looks for it under the consumer app's `app/` dir, where it does
not exist.

## Matrix (confirmed)

| Nuxt   | `nuxt dev`                              | `nuxt build` |
| ------ | --------------------------------------- | ------------ |
| 4.6.4  | ❌ `UNLOADABLE_DEPENDENCY`               | ✅ passes    |
| 4.5.2  | ✅ passes                                | ✅ passes    |

The regression is **dev-only**: the Nuxt 4.6 dev dependency optimizer eagerly
scans installed-layer `app/**` files (`installedScanEntries` in
`@nuxt/vite-builder`) and resolves their imports from the consumer root, without
each layer's alias context. `nuxt build` does not run this scan and is
unaffected.

## Root cause

`@nuxt/vite-builder` 4.6's `OptimizeDepsPlugin` adds every file inside an
installed layer's `app/` dir (`node_modules/<layer>/app/**`) as a dependency
scan entry. During that scan the per-layer alias (`@`/`~` → that layer's
`app/`) is not applied, so `@/…` falls back to the consumer app's `app/`. A
single unresolvable specifier aborts the whole optimization.

Related: nuxt/nuxt#36208, nuxt/nuxt#36473.
Fix in flight (open, unmerged, 5.x-labelled): nuxt/nuxt#36777.

## Structure

- `packages/my-layer/` — a minimal Nuxt layer, installed via a packed tarball
  (`file:…/my-layer-1.0.0.tgz`) so it lives in `node_modules/my-layer` as a real
  directory, exactly like a published layer. Its
  `app/composables/useGreeting.ts` imports `@/utils/greeting`.
- `app/app.vue` — consumer app that renders the layer's auto-imported
  `<LayerGreeting>` component.

## Reproduce

```bash
npm install
npm run dev     # ❌ fails: UNLOADABLE_DEPENDENCY: Could not load app/utils/greeting
npm run build   # ✅ succeeds (dev-only bug)
```

## Confirm the regression against 4.5.2

```bash
npm install nuxt@4.5.2
npm run dev     # ✅ succeeds
npm install nuxt@4.6.4
npm run dev     # ❌ fails again
```

## Notes on minimization

The trigger needs only: (1) a layer installed as a real directory in
`node_modules` (a `file:` *directory* dependency is symlinked and its realpath
falls outside `node_modules`, so use a packed tarball), and (2) an `app/`
file in that layer importing a sibling via `@/`. No Pinia, no CJS dependency,
and no barrel/`index.ts` target are required.
