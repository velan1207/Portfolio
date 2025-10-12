const { OAuth2Client } = require('google-auth-library');

// Use environment variable for the client id on Vercel
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const client = new OAuth2Client(CLIENT_ID);

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const id_token = req.body && req.body.id_token;
  if (!id_token) return res.status(400).json({ error: 'Missing id_token' });
  try {
    const ticket = await client.verifyIdToken({ idToken: id_token, audience: CLIENT_ID });
    const payload = ticket.getPayload();
    const email = (payload.email || '').toLowerCase();
    if (email !== 'velanm.cse2024@citchennai.net') return res.status(403).json({ error: 'Unauthorized email' });
    return res.status(200).json({ ok: true, email, payload });
  } catch (err) {
    console.error('Failed to verify id token', err && err.stack || err);
    return res.status(401).json({ error: 'Invalid ID token' });
  }
};
