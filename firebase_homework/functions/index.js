const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
admin.initializeApp();
const db = admin.firestore();

const app = express();
app.use(express.json());

app.post('/signup', async (req, res) => {
  const { name, email } = req.body;
  if (/[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(name)) return res.status(400).send('이름에 한글이 포함되어 있으면 안 됩니다.');
  if (!email || !email.includes('@')) return res.status(400).send('이메일 형식이 잘못되었습니다.');

  const userRef = db.collection('users').doc(name);
  const userDoc = await userRef.get();
  if (userDoc.exists) return res.status(400).send('이미 존재하는 유저입니다.');

  await userRef.set({ email, createdAt: Date.now() });
  return res.status(200).send('가입 성공');
});

app.get('/getUser', async (req, res) => {
  const name = req.query.name;
  if (!name) return res.status(400).send('name 파라미터가 필요합니다.');

  const doc = await db.collection('users').doc(name).get();
  if (!doc.exists) return res.status(404).send('유저를 찾을 수 없습니다.');

  return res.status(200).json(doc.data());
});

app.put('/updateEmail', async (req, res) => {
  const name = req.query.name;
  const newEmail = req.body.email;
  if (!name || !newEmail) return res.status(400).send('name과 email이 필요합니다.');
  if (!newEmail.includes('@')) return res.status(400).send('올바른 이메일 형식이 아닙니다.');

  const docRef = db.collection('users').doc(name);
  const doc = await docRef.get();
  if (!doc.exists) return res.status(404).send('유저가 존재하지 않습니다.');

  await docRef.update({ email: newEmail });
  return res.status(200).send('이메일 수정 완료');
});

app.delete('/deleteUser', async (req, res) => {
  const name = req.query.name;
  if (!name) return res.status(400).send('name 파라미터가 필요합니다.');

  const docRef = db.collection('users').doc(name);
  const doc = await docRef.get();
  if (!doc.exists) return res.status(404).send('유저가 존재하지 않습니다.');

  const { createdAt } = doc.data();
  if (Date.now() - createdAt < 60000) return res.status(403).send('가입 후 1분이 지나야 삭제할 수 있습니다.');

  await docRef.delete();
  return res.status(200).send('유저 삭제 완료');
});

exports.api = functions.https.onRequest(app);
