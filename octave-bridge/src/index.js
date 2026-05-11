const express = require('express');
const { createSession, executeCommand, destroySession } = require('./sessionManager');

const app = express();
app.use(express.json());

// Reject any request that doesn't have the shared secret
app.use((req, res, next) => {
  if (req.headers['x-bridge-secret'] !== process.env.BRIDGE_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});

// Create a new persistent Octave session
app.post('/session/create', async (req, res) => {
  try {
    const sessionId = await createSession();
    res.json({ sessionId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Run a command inside an existing session
app.post('/session/:id/execute', async (req, res) => {
  const { command } = req.body;
  if (!command) return res.status(400).json({ error: 'command is required' });

  try {
    const result = await executeCommand(req.params.id, command);
    res.json(result);
  } catch (err) {
    const status = err.message === 'Session not found' ? 404 : 500;
    res.status(status).json({ error: err.message });
  }
});

// Destroy a session and kill its Octave process
app.delete('/session/:id', (req, res) => {
  destroySession(req.params.id);
  res.json({ ok: true });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Octave bridge listening on :${PORT}`));
