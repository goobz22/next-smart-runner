#!/usr/bin/env node

/* eslint-disable no-console */

import process from 'node:process'

import {
  detectSymlinkedPackages,
  resolveNextBinary,
  runNext,
} from '../lib/utils.js'

async function main() {
  const symlinked = await detectSymlinkedPackages([process.env.NEXT_SMART_PACKAGE ?? 'goobs-frontend'])
  const { command, args: baseArgs } = await resolveNextBinary(process.cwd())
  const args = [...baseArgs, 'dev']

  const env = {}

  if (symlinked.length > 0) {
    console.log('🔗  Symlinked packages detected:', symlinked.join(', '))
    console.log('➡️   Using Webpack: running `next dev --webpack`')
    args.push('--webpack')
    env.NEXT_DISABLE_TURBOPACK = '1'
  } else {
    console.log('⚡  No symlinked packages detected; using Turbopack via `next dev`')
  }

  runNext(command, args, { env })
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

