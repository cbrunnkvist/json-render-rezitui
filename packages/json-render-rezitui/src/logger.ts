import * as fs from 'fs';
import * as path from 'path';

let debugFd: number | null = null;
let debugFdPath: string | null = null;

/**
 * Get or create a file descriptor for debug logging.
 * Writes to a "debug.log" file in the current working directory.
 */
function getDebugFd(): number | null {
  if (debugFd !== null) return debugFd;
  try {
    debugFdPath = path.resolve(process.cwd(), 'debug.log');
    debugFd = fs.openSync(debugFdPath, 'a');
    return debugFd;
  } catch {
    return null;
  }
}

/**
 * Internal logger that writes to a debug.log file to avoid disturbing the TUI.
 * Enabled if REZI_DEBUG environment variable is set, or if explicitly enabled.
 */
export function logDebug(enabled: boolean, message: string, ...args: any[]) {
  if (enabled || process.env.REZI_DEBUG) {
    const fd = getDebugFd();
    if (fd === null) return;

    const timestamp = new Date().toISOString();

    // Ensure all arguments are serialized to a single line
    const formattedArgs = args.map(a => {
      if (a instanceof Error) return a.stack || a.message;
      if (typeof a === 'object') {
        try {
          const s = JSON.stringify(a);
          return s.length > 100 ? s.substring(0, 97) + "..." : s;
        } catch (e) {
          return '[Obj]';
        }
      }
      return String(a);
    }).join(' ');

    const line = `[REZI-DEBUG ${timestamp}] ${message} ${formattedArgs}\n`;

    try {
      fs.writeSync(fd, line);
    } catch (e) {
      // Ignore write errors
    }
  }
}
