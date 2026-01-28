Seeding Firestore and Storage

This project includes a helper script to seed Firestore and Firebase Storage from `seed_data.json`.

Prerequisites
- Node.js installed.
- A Firebase service account JSON file (create in Google Cloud IAM -> Service Accounts -> Create key). Save locally.

Steps
1. Install dependencies (in project root):

```powershell
npm install firebase-admin
```

2. Set the environment variable pointing to your service account JSON:

```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS = 'C:\path\to\service-account.json'
```

3. Run the script:

```powershell
node scripts/seed_firestore.js
```

What it does
- Writes `portfolio_meta/main` with meta data (name, headline, about, profile, resume, contact).
- Writes collections: `portfolio_projects`, `portfolio_internships`, `portfolio_skills`, `portfolio_achievements`.
- Uploads local files referenced in `seed_data.json` (`profile.image`, `resume`) to the default Storage bucket and stores signed URLs in Firestore.

Notes
- The script deletes existing documents in the target collections before writing new ones.
- Signed URLs are long-lived (5 years) for convenience; you may prefer to generate short-lived URLs or make the Storage objects public depending on your rules.

