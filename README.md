# [SaltyAom's Fastify Starter](https://github.com/saltyaom/fastify-starter)
A ready-to-use starter template for Fastify quick-start.

Featuring:
- SWC
- Jest
- TypeScript
- Eslint
- Module Alias & Absolute Import
- Docker

## Aliased module
@see `scripts/libs.ts` or `jest.config.js`.

## Testing Caveat
Jest can't run ES Module natively, so we need to be build first. Just make sure you build the project first before you test

Simply run:
```bash
pnpm build && pnpm test
```

Since the test script match remap all file from `/src` to `/build`, means you can't use relative import to import a file.

Simply use absolute import instead:
```typescript
// Remap to build/modules
import { myModule } from '@modules'

// Remap to build/any/dir
import module from '~/any/dir'
```
