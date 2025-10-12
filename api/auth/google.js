const { OAuth2Client } = require('google-auth-library');
const path = require('path');

// Helper to write consistent cross-origin headers so the GIS popup/postMessage is not blocked
function setCommonHeaders(req, res){
  // Allow the requesting origin to access this endpoint (safer than '*')
  const origin = req.headers.origin || '*';
  try{
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }catch(e){}
  // Allow JSON POSTs from the browser
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  // Allow popups to communicate back (important for some Identity flows)
  // This value permits cross-origin popups to communicate while keeping same-origin for normal pages
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  // Keep embedder policy permissive here (do not force COEP)
  res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
}

// Load client id from repo config (same file used by the client)
let GOOGLE_CLIENT_ID = null;
let client = null;
try{
  const cfg = require(path.join(__dirname, '..', '..', 'google-config.json'));
  GOOGLE_CLIENT_ID = cfg && cfg.GOOGLE_CLIENT_ID;
  if(GOOGLE_CLIENT_ID) client = new OAuth2Client(GOOGLE_CLIENT_ID);
}catch(e){
  // swallow here; we'll return an informative error when invoked
  console.error('google-config.json load failed', e && (e.stack || e));
}

module.exports = async (req, res) => {
  setCommonHeaders(req, res);

  // Handle preflight requests quickly
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!GOOGLE_CLIENT_ID || !client) {
    console.error('Missing GOOGLE_CLIENT_ID in serverless env or google-config.json not found');
    return res.status(500).json({ error: 'Server misconfiguration: missing GOOGLE_CLIENT_ID' });
  }

  let idToken = null;
  // Vercel typically parses JSON body for us; accept either id_token or credential fields
  try{
    if (req.body && typeof req.body === 'object' && req.body.id_token) idToken = req.body.id_token;
    if (!idToken && req.body && typeof req.body === 'object' && req.body.credential) idToken = req.body.credential;
  }catch(e){
    // If body parsing failed, try to read raw body (unlikely on Vercel)
    console.error('Error reading request body', e && (e.stack || e));
  }

  if (!idToken) return res.status(400).json({ error: 'Missing id_token' });

  try {
    const ticket = await client.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    const email = (payload && payload.email || '').toLowerCase();

    // NOTE (debug): temporarily allow any verified Google account so we can confirm
    // the deployed token verification flow works. Remove or restore this check
    // to restrict editing to a single admin email after verification.
    // Uncomment the block below to restrict to the admin email again.
    // if (email !== 'velanm.cse2024@citchennai.net') {
    //   return res.status(403).json({ error: 'Unauthorized email', email });
    // }

    return res.status(200).json({ ok: true, email, payload });
  } catch (err) {
    // Log full error to server logs for diagnosis
    console.error('Failed to verify id token (serverless)', err && (err.stack || err));
    // Return a clearer error to the client so the UI can show helpful messages
    const message = err && err.message ? err.message : 'Invalid ID token';
    return res.status(401).json({ error: 'Invalid ID token', details: message });
  }
};
