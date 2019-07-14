import consola from 'consola'
import chalk from 'chalk'
import exit from 'exit'

chalk.enabled = false

jest.setTimeout(60000)

consola.mockTypes(() => jest.fn())

function errorTrap (error) {
  process.stderr.write('\n' + error.stack + '\n')
  exit(1)
}

process.on('unhandledRejection', errorTrap)
process.on('uncaughtException', errorTrap)
