/*
  Seed Firestore and Storage from seed_data.json using Firebase Admin SDK.
  Usage: set GOOGLE_APPLICATION_CREDENTIALS to your service account JSON, then:
    node scripts/seed_firestore.js
*/
const fs = require('fs');
const path = require('path');

const seedPath = path.join(__dirname, '..', 'seed_data.json');
if(!fs.existsSync(seedPath)){
  console.error('seed_data.json not found at', seedPath);
  process.exit(1);
}
const data = JSON.parse(fs.readFileSync(seedPath, 'utf8'));

// Initialize Firebase Admin
let admin;
try{
  admin = require('firebase-admin');
}catch(e){
  console.error('Please install firebase-admin: npm i firebase-admin');
  process.exit(1);
}

if(!process.env.GOOGLE_APPLICATION_CREDENTIALS){
  console.error('Set GOOGLE_APPLICATION_CREDENTIALS to your service account JSON file path');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.applicationDefault()
});

const firestore = admin.firestore();
// get default bucket after initializeApp
const bucket = admin.storage().bucket();

async function uploadLocalFileIfExists(localPath, destPath){
  if(!localPath) return null;
  const abs = path.join(process.cwd(), localPath);
  if(!fs.existsSync(abs)) return null;
  console.log('Uploading', abs, 'to', destPath);
  await bucket.upload(abs, { destination: destPath, gzip: true });
  const file = bucket.file(destPath);
  const [url] = await file.getSignedUrl({ action: 'read', expires: Date.now()+1000*60*60*24*365*5 });
  return url;
}

(async ()=>{
  try{
    console.log('Seeding meta doc');
    const meta = { name: data.name||'', headline: data.headline||'', about: data.about||'', profile: { caption: data.profile && data.profile.caption || '' }, resume: data.resume || '', contact: data.contact || {}, lastUpdate: Date.now() };
    // upload profile image if local path present
    if(data.profile && data.profile.image && !data.profile.image.startsWith('http')){
      const dest = `profile-images/${path.basename(data.profile.image)}`;
      const url = await uploadLocalFileIfExists(data.profile.image, dest);
      if(url) meta.profile.image = url; else meta.profile.image = data.profile.image;
    }else if(data.profile && data.profile.image){
      meta.profile.image = data.profile.image;
    }

    // upload resume if local
    if(data.resume && !data.resume.startsWith('http')){
      const dest = `resumes/${path.basename(data.resume)}`;
      const url = await uploadLocalFileIfExists(data.resume, dest);
      if(url) meta.resume = url; else meta.resume = data.resume;
    }

    await firestore.collection('portfolio_meta').doc('main').set(meta);

    console.log('Seeding projects');
    const projects = data.projects || [];
    // delete existing docs in projects collection
    const pSnap = await firestore.collection('portfolio_projects').get();
    const pBatch = firestore.batch();
    pSnap.forEach(d => pBatch.delete(d.ref));
    await pBatch.commit();
    // write new
    for(let i=0;i<projects.length;i++){
      const p = Object.assign({}, projects[i], { order: i });
      await firestore.collection('portfolio_projects').add(p);
    }

    console.log('Seeding internships');
    const internships = data.internships || [];
    const iSnap = await firestore.collection('portfolio_internships').get();
    const iBatch = firestore.batch();
    iSnap.forEach(d => iBatch.delete(d.ref));
    await iBatch.commit();
    for(let i=0;i<internships.length;i++){
      const inst = Object.assign({}, internships[i], { order: i });
      await firestore.collection('portfolio_internships').add(inst);
    }

    console.log('Seeding skills');
    const skills = data.skills || { technical: [], soft: [] };
    const sSnap = await firestore.collection('portfolio_skills').get();
    const sBatch = firestore.batch();
    sSnap.forEach(d => sBatch.delete(d.ref));
    await sBatch.commit();
    let idx = 0;
    for(const t of skills.technical || []){
      await firestore.collection('portfolio_skills').add(Object.assign({}, t, { type: 'technical', order: idx++ }));
    }
    for(const s of skills.soft || []){
      await firestore.collection('portfolio_skills').add(Object.assign({}, { name: s.name }, { type: 'soft', order: idx++ }));
    }

    console.log('Seeding achievements');
    const aSnap = await firestore.collection('portfolio_achievements').get();
    const aBatch = firestore.batch();
    aSnap.forEach(d => aBatch.delete(d.ref));
    await aBatch.commit();
    for(let i=0;i<(data.achievements||[]).length;i++){
      await firestore.collection('portfolio_achievements').add({ text: data.achievements[i], order: i });
    }

    console.log('Seed complete');
    process.exit(0);
  }catch(e){
    console.error('Seed failed', e);
    process.exit(1);
  }
})();
