import { spawnSync } from 'node:child_process';

export class CommandExecutionError extends Error {
  constructor(command, result) {
    const exitCode = Number.isInteger(result.status) && result.status !== 0 ? result.status : 1;
    const detail = result.error?.message || result.stderr || result.stdout || 'No command output';
    super('Failed ' + command + ' (exit ' + exitCode + '): ' + detail);
    this.name = 'CommandExecutionError';
    this.exitCode = exitCode;
  }
}
export function runCheckedCommand(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: 'utf8', timeout: 120_000, maxBuffer: 10 * 1024 * 1024, ...options, shell: false,
  });
  if (result.error || result.status !== 0) throw new CommandExecutionError(command, result);
  return result.stdout;
}
