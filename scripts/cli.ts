#!/usr/bin/env ts-node
/**
 * WhatsApp Bot CLI Command Center
 * Run: npx ts-node scripts/cli.ts <command>
 */

import fs from 'fs'
import path from 'path'

const ROOT_DIR = path.join(__dirname, '..')
const AUTH_DIR = path.join(ROOT_DIR, 'data', 'auth')
const LOGS_DIR = path.join(ROOT_DIR, 'logs')
const DIST_DIR = path.join(ROOT_DIR, 'dist')

// Colors for terminal
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
}

function log(message: string, color: keyof typeof colors = 'reset'): void {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function logHeader(title: string): void {
  console.log('')
  log('═'.repeat(50), 'cyan')
  log(`  ${title}`, 'bright')
  log('═'.repeat(50), 'cyan')
  console.log('')
}

function logSuccess(message: string): void {
  log(`✓ ${message}`, 'green')
}

function logError(message: string): void {
  log(`✗ ${message}`, 'red')
}

function logInfo(message: string): void {
  log(`ℹ ${message}`, 'blue')
}

function logWarning(message: string): void {
  log(`⚠ ${message}`, 'yellow')
}

// Commands
const commands: Record<string, { description: string; action: () => Promise<void> | void }> = {
  help: {
    description: 'Show this help message',
    action: showHelp,
  },
  status: {
    description: 'Check bot status and configuration',
    action: checkStatus,
  },
  clean: {
    description: 'Clean all cache (auth, logs, dist)',
    action: cleanCache,
  },
  'clean:auth': {
    description: 'Clean only auth/session data',
    action: cleanAuth,
  },
  'clean:logs': {
    description: 'Clean only log files',
    action: cleanLogs,
  },
  'clean:dist': {
    description: 'Clean only build output',
    action: cleanDist,
  },
  config: {
    description: 'Show current configuration',
    action: showConfig,
  },
  'config:check': {
    description: 'Validate configuration',
    action: validateConfig,
  },
  info: {
    description: 'Show project information',
    action: showInfo,
  },
}

function showHelp(): void {
  logHeader('WhatsApp Bot CLI - Command Center')

  log('Usage:', 'bright')
  log('  npx ts-node scripts/cli.ts <command>')
  log('  npm run cli <command>')
  console.log('')

  log('Available Commands:', 'bright')
  for (const [name, cmd] of Object.entries(commands)) {
    log(`  ${name.padEnd(15)} ${cmd.description}`, 'cyan')
  }

  console.log('')
  log('NPM Scripts:', 'bright')
  log('  npm run dev          Start in development mode', 'cyan')
  log('  npm run build        Build for production', 'cyan')
  log('  npm run start        Start production build', 'cyan')
  log('  npm run clean        Clean all cache', 'cyan')
  log('  npm run clean:auth   Clean auth data only', 'cyan')
  log('  npm run status       Check bot status', 'cyan')
  console.log('')
}

function checkStatus(): void {
  logHeader('Bot Status')

  // Check if auth exists
  const authExists = fs.existsSync(AUTH_DIR) && fs.readdirSync(AUTH_DIR).length > 0
  if (authExists) {
    const files = fs.readdirSync(AUTH_DIR).length
    logSuccess(`Session data found (${files} files)`)
  } else {
    logWarning('No session data - QR code scan required')
  }

  // Check if .env exists
  const envExists = fs.existsSync(path.join(ROOT_DIR, '.env'))
  if (envExists) {
    logSuccess('.env configuration file found')
  } else {
    logError('.env file missing - copy from .env.example')
  }

  // Check node_modules
  const modulesExist = fs.existsSync(path.join(ROOT_DIR, 'node_modules'))
  if (modulesExist) {
    logSuccess('Dependencies installed')
  } else {
    logError('Dependencies not installed - run: npm install')
  }

  // Check build
  const buildExists = fs.existsSync(DIST_DIR) && fs.readdirSync(DIST_DIR).length > 0
  if (buildExists) {
    logSuccess('Production build exists')
  } else {
    logInfo('No production build - run: npm run build')
  }

  console.log('')
}

function cleanCache(): void {
  logHeader('Cleaning All Cache')
  cleanAuth()
  cleanLogs()
  cleanDist()
  logSuccess('All cache cleaned!')
}

function cleanAuth(): void {
  if (fs.existsSync(AUTH_DIR)) {
    const files = fs.readdirSync(AUTH_DIR)
    for (const file of files) {
      fs.rmSync(path.join(AUTH_DIR, file), { recursive: true })
    }
    logSuccess(`Cleaned auth data (${files.length} files removed)`)
  } else {
    logInfo('Auth directory already empty')
  }
}

function cleanLogs(): void {
  if (fs.existsSync(LOGS_DIR)) {
    const files = fs.readdirSync(LOGS_DIR)
    for (const file of files) {
      fs.rmSync(path.join(LOGS_DIR, file), { recursive: true })
    }
    logSuccess(`Cleaned logs (${files.length} files removed)`)
  } else {
    logInfo('Logs directory already empty')
  }
}

function cleanDist(): void {
  if (fs.existsSync(DIST_DIR)) {
    fs.rmSync(DIST_DIR, { recursive: true })
    logSuccess('Cleaned dist folder')
  } else {
    logInfo('Dist directory already empty')
  }
}

function showConfig(): void {
  logHeader('Current Configuration')

  const envPath = path.join(ROOT_DIR, '.env')
  if (!fs.existsSync(envPath)) {
    logError('.env file not found')
    return
  }

  const envContent = fs.readFileSync(envPath, 'utf-8')
  const lines = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'))

  for (const line of lines) {
    const [key, ...valueParts] = line.split('=')
    const value = valueParts.join('=')

    // Hide sensitive values
    if (key.toLowerCase().includes('token') || key.toLowerCase().includes('secret')) {
      log(`  ${key} = ${'*'.repeat(8)}`, 'cyan')
    } else {
      log(`  ${key} = ${value}`, 'cyan')
    }
  }

  console.log('')
}

function validateConfig(): void {
  logHeader('Validating Configuration')

  const envPath = path.join(ROOT_DIR, '.env')
  if (!fs.existsSync(envPath)) {
    logError('.env file not found - copy from .env.example')
    return
  }

  const envContent = fs.readFileSync(envPath, 'utf-8')
  const config: Record<string, string> = {}

  for (const line of envContent.split('\n')) {
    if (line.trim() && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=')
      config[key.trim()] = valueParts.join('=').trim()
    }
  }

  let hasErrors = false

  // Check required settings
  const required = ['BOT_PREFIX', 'BOT_NAME']
  for (const key of required) {
    if (!config[key]) {
      logError(`Missing required: ${key}`)
      hasErrors = true
    } else {
      logSuccess(`${key} is set`)
    }
  }

  // Check numeric settings
  const numeric = ['RATE_LIMIT_PER_MINUTE', 'MIN_RESPONSE_DELAY_MS', 'MAX_RESPONSE_DELAY_MS', 'TYPING_SPEED_MS']
  for (const key of numeric) {
    if (config[key] && isNaN(parseInt(config[key]))) {
      logError(`${key} must be a number`)
      hasErrors = true
    } else if (config[key]) {
      logSuccess(`${key} = ${config[key]}`)
    }
  }

  // Check boolean settings
  const booleans = ['ENABLE_GROUPS', 'ENABLE_AUTO_READ', 'ENABLE_TYPING_INDICATOR']
  for (const key of booleans) {
    if (config[key] && !['true', 'false'].includes(config[key].toLowerCase())) {
      logWarning(`${key} should be 'true' or 'false'`)
    } else if (config[key]) {
      logSuccess(`${key} = ${config[key]}`)
    }
  }

  console.log('')
  if (hasErrors) {
    logError('Configuration has errors!')
  } else {
    logSuccess('Configuration is valid!')
  }
}

function showInfo(): void {
  logHeader('Project Information')

  const pkgPath = path.join(ROOT_DIR, 'package.json')
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
    log(`  Name:        ${pkg.name}`, 'cyan')
    log(`  Version:     ${pkg.version}`, 'cyan')
    log(`  Description: ${pkg.description || 'N/A'}`, 'cyan')
  }

  // Count files
  const srcDir = path.join(ROOT_DIR, 'src')
  let tsFiles = 0
  const countFiles = (dir: string) => {
    if (!fs.existsSync(dir)) return
    for (const file of fs.readdirSync(dir)) {
      const fullPath = path.join(dir, file)
      if (fs.statSync(fullPath).isDirectory()) {
        countFiles(fullPath)
      } else if (file.endsWith('.ts')) {
        tsFiles++
      }
    }
  }
  countFiles(srcDir)

  console.log('')
  log(`  Source files: ${tsFiles} TypeScript files`, 'cyan')

  // Commands count
  const cmdDir = path.join(srcDir, 'commands')
  if (fs.existsSync(cmdDir)) {
    const commands = fs.readdirSync(cmdDir).filter(f => f.endsWith('.ts') && f !== 'index.ts').length
    log(`  Commands:     ${commands} commands`, 'cyan')
  }

  // Services count
  const svcDir = path.join(srcDir, 'services')
  if (fs.existsSync(svcDir)) {
    const services = fs.readdirSync(svcDir).filter(f => f.endsWith('.ts') && f !== 'index.ts').length
    log(`  Services:     ${services} services`, 'cyan')
  }

  console.log('')
}

// Main
async function main(): Promise<void> {
  const args = process.argv.slice(2)
  const command = args[0] || 'help'

  if (commands[command]) {
    await commands[command].action()
  } else {
    logError(`Unknown command: ${command}`)
    console.log('')
    showHelp()
    process.exit(1)
  }
}

main().catch(err => {
  logError(`Error: ${err.message}`)
  process.exit(1)
})
