const { spawn } = require('child_process');
const { v4: uuidv4 } = require('uuid');

const sessions = new Map();
const TTL_MS = (parseInt(process.env.SESSION_TTL_MINUTES) || 30) * 60 * 1000;
const OCTAVE_PROMPT = /octave:\d+> $/m;

function createSession() {
  return new Promise((resolve, reject) => {
    const id = uuidv4();
    const proc = spawn('octave', ['--no-gui', '--interactive'], {
      env: { ...process.env, TERM: 'dumb' },
    });

    let buffer = '';

    const onInitialPrompt = (chunk) => {
      buffer += chunk.toString();
      if (OCTAVE_PROMPT.test(buffer)) {
        proc.stdout.removeListener('data', onInitialPrompt);
        sessions.set(id, { proc, lastActive: Date.now() });
        scheduleExpiry(id);

        // Load the control package so that lqr, lsim, ss, place are available.
        // We do this once per session right after startup rather than requiring
        // each caller to remember to load it.
        executeCommand(id, 'pkg load control')
          .then(() => resolve(id))
          .catch(reject);
      }
    };

    proc.stdout.on('data', onInitialPrompt);
    proc.stderr.on('data', () => {});
    proc.on('error', reject);

    setTimeout(() => reject(new Error('Octave did not start in time')), 10000);
  });
}

function executeCommand(id, command) {
  return new Promise((resolve, reject) => {
    const session = sessions.get(id);
    if (!session) return reject(new Error('Session not found'));

    session.lastActive = Date.now();
    let stdout = '';
    let stderr = '';

    const onData = (chunk) => {
      stdout += chunk.toString();
      if (OCTAVE_PROMPT.test(stdout)) {
        session.proc.stdout.removeListener('data', onData);
        session.proc.stderr.removeListener('data', onErr);
        const output = stdout.replace(/octave:\d+> $/, '').trim();
        resolve({ stdout: output, stderr, success: true });
      }
    };

    const onErr = (chunk) => { stderr += chunk.toString(); };

    session.proc.stdout.on('data', onData);
    session.proc.stderr.on('data', onErr);
    session.proc.stdin.write(command + '\n');
  });
}

function destroySession(id) {
  const session = sessions.get(id);
  if (session) {
    session.proc.kill();
    sessions.delete(id);
  }
}

function scheduleExpiry(id) {
  setTimeout(() => {
    const session = sessions.get(id);
    if (!session) return;
    if (Date.now() - session.lastActive >= TTL_MS) {
      destroySession(id);
    } else {
      scheduleExpiry(id);
    }
  }, TTL_MS);
}

module.exports = { createSession, executeCommand, destroySession };
