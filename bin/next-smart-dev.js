#!/usr/bin/env node

/* eslint-disable no-console */

import process from 'node:process'

import {
  detectSymlinkedPackages,
  resolveNextBinary,
  runNext,
} from '../lib/utils.js'

function parseList(value) {
  if (!value) {
    return []
  }

  return value
    .split(',')
    .map((token) => token.trim())
    .filter(Boolean)
}

function collectSymlinkTargets() {
  const targets = new Set(parseList(process.env.NEXT_SMART_SYMLINKS ?? process.env.NEXT_SMART_PACKAGE))

  const args = process.argv.slice(2)
  const separatorIndex = args.indexOf('--')
  const limit = separatorIndex === -1 ? args.length : separatorIndex

  for (let index = 0; index < limit; index += 1) {
    const arg = args[index]

    if (arg === '--symlink' || arg === '--symlinks') {
      const value = args[index + 1]
      parseList(value).forEach((pkg) => targets.add(pkg))
      index += 1
      continue
    }

    if (arg.startsWith('--symlink=') || arg.startsWith('--symlinks=')) {
      const [, value] = arg.split('=')
      parseList(value).forEach((pkg) => targets.add(pkg))
    }
  }

  return Array.from(targets)
}

function collectForwardArgs() {
  const args = process.argv.slice(2)
  const separatorIndex = args.indexOf('--')

  if (separatorIndex === -1) {
    return []
  }

  return args.slice(separatorIndex + 1)
}

async function main() {
  const requestedTargets = collectSymlinkTargets()
  const symlinked = await detectSymlinkedPackages(requestedTargets)
  const { command, args: baseArgs } = await resolveNextBinary(process.cwd())
  const args = [...baseArgs, 'dev']
  const forwardArgs = collectForwardArgs()

  const env = {}

  if (symlinked.length > 0) {
    console.log('🔗  Symlinked packages detected:', symlinked.join(', '))
    console.log('➡️   Using Webpack: running `next dev --webpack`')
    args.push('--webpack')
    env.NEXT_DISABLE_TURBOPACK = '1'
  } else {
    console.log('⚡  No symlinked packages detected; using Turbopack via `next dev`')
  }

  runNext(command, [...args, ...forwardArgs], { env })
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

