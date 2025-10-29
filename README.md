# next-smart-runner

Helpers that automatically pick the right Next.js bundler (Turbopack or Webpack) for `next dev` and `next build` when you rely on linked or symlinked local packages.

## Why?

Next.js 16 uses Turbopack by default, but Turbopack still struggles with linked packages created via `bun link`, `npm link`, or monorepo workspaces. Those symlinks often cause `Module not found: Can't resolve` errors during development and production builds.

`next-smart-runner` inspects your project's `node_modules` for symlinked packages and automatically falls back to Webpack when needed. When everything lives inside `node_modules` without symlinks, it keeps the default Turbopack experience.

## Installation

```bash
npm install --save-dev next-smart-runner
# or
pnpm add -D next-smart-runner
# or
bun add -d next-smart-runner
```

## Usage

Update your `package.json` scripts to call the smart runners instead of `next` directly:

```json
{
  "scripts": {
    "dev": "next-smart-dev",
    "build": "next-smart-build",
    "start": "next start"
  }
}
```

- If any symlinked packages are detected we run `next dev --webpack` or `next build --webpack`.
- Otherwise we call the standard `next dev` / `next build`, letting Turbopack handle the workload.

### Configuring symlink detection

- By default the runner scans `node_modules` and switches to Webpack if any symlinked packages are found.
- Restrict the check to specific packages by passing a comma-separated list via the `NEXT_SMART_SYMLINKS` environment variable or the `--symlink(s)` flag:

```bash
NEXT_SMART_SYMLINKS="shared-ui,ui-kit" next-smart-dev
# or
next-smart-dev --symlinks shared-ui,ui-kit
```

### Windows support

The runners resolve the underlying `next` executable and call it via `node` or `cmd.exe` (on Windows), so they work the same across platforms.

### CLI flags

Any extra arguments after `--` are forwarded to Next.js as usual:

```bash
next-smart-dev --symlink shared-ui -- --port 4000
```

## Why not just tweak `next.config`?

Turbopack deliberately guards against importing files outside of the detected project root, which is why linked dependencies often explode with `Module not found` errors. The core team recommends pointing `experimental.turbo.root` / `turbopack.root` at a higher directory [[#77562](https://github.com/vercel/next.js/issues/77562)], or falling back to `experimental.outputFileTracingRoot` when using `link:` dependencies [[#64472](https://github.com/vercel/next.js/issues/64472)]. Those workarounds only apply when your linked package sits neatly beside the app—and they still fail in many monorepo setups. `next-smart-runner` gives you an immediate escape hatch: it keeps Turbopack when everything resolves, but falls back to Webpack automatically whenever symlinked modules would break the build.

## FAQ

**Does this replace my Next.js configuration?**

No. It only wraps the CLI commands. You can still use `next.config.*` as usual.

**Can I use this in monorepos?**

Yes. The scripts inspect the current working directory, so as long as you run them from the Next.js app root they work fine.

**What about production builds on CI?**

You can keep Turbopack in CI by calling the stock `next build` command instead of `next-smart-build`. The helpers only switch bundlers when a symlink is detected during the run.

## License

MIT © Matthew Goluba

