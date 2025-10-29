/* eslint-disable no-console */

import { lstat, stat } from 'fs/promises'
import { spawn } from 'child_process'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import process from 'node:process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const packageRoot = resolve(__dirname, '..')

async function isSymlink(path) {
  try {
    const stats = await lstat(path)
    return stats.isSymbolicLink()
  } catch {
    return false
  }
}

export async function detectSymlinkedPackages(candidates = ['goobs-frontend']) {
  const results = await Promise.all(
    candidates.map(async (pkg) => {
      const symlinkPath = resolve(process.cwd(), 'node_modules', pkg)
      return (await isSymlink(symlinkPath)) ? pkg : null
    }),
  )

  return results.filter(Boolean)
}

export async function resolveNextBinary(projectRoot = process.cwd()) {
  const scriptCandidates = [
    ['node_modules', 'next', 'dist', 'bin', 'next'],
    ['node_modules', 'next', 'dist', 'bin', 'next.js'],
  ]

  for (const parts of scriptCandidates) {
    const candidate = resolve(projectRoot, ...parts)
    try {
      await stat(candidate)
      return { command: process.execPath, args: [candidate] }
    } catch {
      // continue to next candidate
    }
  }

  const shim = resolve(
    projectRoot,
    'node_modules',
    '.bin',
    process.platform === 'win32' ? 'next.cmd' : 'next',
  )

  try {
    await stat(shim)
    if (process.platform === 'win32') {
      return { command: 'cmd.exe', args: ['/c', shim] }
    }

    return { command: shim, args: [] }
  } catch {
    throw new Error('Unable to locate the Next.js CLI. Make sure dependencies are installed.')
  }
}

export function runNext(command, baseArgs, options = {}) {
  const child = spawn(command, baseArgs, {
    stdio: 'inherit',
    cwd: options.cwd ?? process.cwd(),
    env: {
      ...process.env,
      ...options.env,
    },
  })

  child.on('exit', (code) => {
    process.exit(code ?? 0)
  })

  child.on('error', (error) => {
    console.error('Failed to start Next.js:', error)
    process.exit(1)
  })
}

export function resolveProjectRoot(cwd = process.cwd()) {
  return cwd
}

export const packageVersion = async () => {
  const pkg = await import(resolve(packageRoot, 'package.json'), {
    assert: { type: 'json' },
  })
  return pkg.default.version
}

