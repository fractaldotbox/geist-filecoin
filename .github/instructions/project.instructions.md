---
applyTo: '**'
---
This is a turborepo monorepo project with multiple packages. Please follow the instructions below when contributing to this project.

## Preferred Language, Packages, and Frameworks
- Use TypeScript for all new code unless otherwise specified
- Use ky over fetch for HTTP requests at react or node.js
- Use React for frontend development
- Use Node.js for backend development
- Use shadcn/ui for UI components in React
- Use TurboRepo for managing the monorepo
- Use pnpm as the package manager, so all the commands should be run with `pnpm` instead of `npm` or `yarn`
- Use "@types/node": "^22.15.17"
- Use "typescript": "^5.8.3"
- Use Vitest for testing JavaScript/TypeScript packages

## TurboRepo Workflow (IMPORTANT)
- **Always run build/test commands from the root directory** of the monorepo
- **Use filter flags** to target specific packages: `--filter=<package-name>`
- **Correct command patterns**:
  ```bash
  # From root directory:
  pnpm test --filter=@geist-filecoin/encryption
  pnpm build --filter=@geist-filecoin/encryption
  pnpm --filter=<package-name> <script-name>
  ```
- **Never run build/test commands directly in package directories** for CI/build processes
- Use the established `turbo.json` pipeline configuration

## Key Guidelines
- for boolean variables, use naming convention "is[Condition]"
- extract constants into enum whenever possible.
- use react router

## Extra Documentation
- for react components, use shadcn/ui components as much as possible, and follow the documentations on @https://ui.shadcn.com/
