const express = require('express');
const path = require('path');
const {OAuth2Client} = require('google-auth-library');

// Load client id from google-config.json (kept in repo so both client and server can read it).
const cfg = require('./google-config.json');
const GOOGLE_CLIENT_ID = cfg.GOOGLE_CLIENT_ID || '549204749893-j1anhthdgss8col96hkbhc548pjarliv.apps.googleusercontent.com';

const client = new OAuth2Client(GOOGLE_CLIENT_ID);
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
// Serve static files from repository root (index.html, admin.html, app.js, etc.)
app.use(express.static(path.join(__dirname)));
// Endpoint to verify Google ID tokens server-side.
app.post('/auth/google', async (req, res) => {
  const idToken = req.body && req.body.id_token;
  if (!idToken) return res.status(400).json({ error: 'Missing id_token' });
  try {
    const ticket = await client.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    // payload contains email, name, sub, etc. You can implement additional checks (hd, hosted domain)
    const email = payload.email && payload.email.toLowerCase();
    // Example: allow a specific email (your editor account) or accept any verified Google user.
    // Uncomment and change the check below to restrict to your account:
  if(email !== 'velanm.cse2024@citchennai.net') return res.status(403).json({ error: 'Unauthorized email' });

    return res.json({ ok: true, email, payload });
  } catch (err) {
    console.error('Failed to verify id token', err && err.stack || err);
    return res.status(401).json({ error: 'Invalid ID token' });
  }
});

app.listen(PORT, () => {
  console.log(`Dev server listening on http://localhost:${PORT}`);
  console.log('Make sure to replace the placeholder client ID in google-config.json with your Google OAuth Client ID.');
});
