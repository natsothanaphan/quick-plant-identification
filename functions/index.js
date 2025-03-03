require('dotenv').config({ path: ['.env', '.env.default'] });
const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');
const { setGlobalOptions } = require('firebase-functions/v2');
const { onRequest } = require('firebase-functions/v2/https');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { GoogleAIFileManager } = require('@google/generative-ai/server');
const fs = require('fs');
const { randomUUID } = require('crypto');
const logger = require('firebase-functions/logger');
const express = require('express');

setGlobalOptions({ region: 'asia-southeast1' });
initializeApp();
const db = getFirestore();
const storage = getStorage();

const app = express();
app.use(express.json());

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }
  const idToken = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await getAuth().verifyIdToken(idToken);
    req.uid = decodedToken.uid;
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};
app.use(authenticate);

app.get('/api/ping', (req, res) => {
  res.send('pong');
});

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const fileManager = new GoogleAIFileManager(GEMINI_API_KEY);

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 8192,
  responseMimeType: 'application/json',
  responseSchema: {
    type: 'object',
    properties: {
      '0-privateThinkingTrace': { type: 'string' },
      '1-scientificName': { type: 'string' },
      '2-commonNames': {
        type: 'array',
        items: { type: 'string' },
      },
      '3-confidenceProb': { type: 'number' },
      '4-userExplanation': { type: 'string' },
    },
    required: [
      '0-privateThinkingTrace',
      '1-scientificName',
      '2-commonNames',
      '3-confidenceProb',
      '4-userExplanation',
    ],
  },
};
const model = genAI.getGenerativeModel({
  model: 'gemini-2.0-pro-exp-02-05',
  systemInstruction:
    'Identify a single plant in the image.\nOutput fields in this order: privateThinkingTrace, scientificName, commonNames, confidenceProb, userExplanation.',
});

const uploadToStorageAndFirestore = async (uid, filename, filePath) => {
  const bucket = storage.bucket();
  const storagePath = `${uid}/images/${filename}`;
  await bucket.upload(filePath, {
    destination: storagePath,
  });
  logger.info(`File uploaded to Firebase Storage at ${storagePath}`);
  const requestDoc = { 
    filename: storagePath, 
    createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
  };
  const docRef = await db
    .collection('users').doc(uid)
    .collection('requests').add(requestDoc);
  logger.info(`Firestore document created for request: ${docRef.id}`);
  return docRef.id;
};

const uploadToGemini = async (path, mimeType) => {
  const uploadResult = await fileManager.uploadFile(path, { mimeType, displayName: path });
  const file = uploadResult.file;
  logger.info(`Uploaded file ${file.displayName} as: ${file.name}`);
  return file;
};

const updateFirestore = async (uid, docId, result) => {
  const docRef = db
    .collection('users').doc(uid)
    .collection('requests').doc(docId);
  await docRef.update({
    result,
    updatedAt: FieldValue.serverTimestamp(),
  });
  logger.info(`Firestore document updated for request: ${docId}`);
};

app.post('/api/identifyPlant', async (req, res) => {
  let filePath = '';
  try {
    const { mimeType, imageData } = req.body;
    if (!mimeType || !imageData) return res.status(400).json({ error: 'Missing required fields: mimeType, imageData' });
    const filename = randomUUID() + (mimeType === 'image/jpeg' ? '.jpeg' : mimeType === 'image/png' ? '.png' : '');
    filePath = `/tmp/${filename}`;
    await fs.promises.writeFile(filePath, imageData, { encoding: 'base64' });
    logger.info(`File saved to ${filePath}`);

    const backgroundUploadTask = uploadToStorageAndFirestore(req.uid, filename, filePath);
    const file = await uploadToGemini(filePath, mimeType);
    const result = await model.generateContent( { generationConfig, contents: [ {
        role: 'user',
        parts: [ { fileData: { mimeType: file.mimeType, fileUri: file.uri } } ],
    } ] } );
    const data = JSON.parse(await result.response.text());
    logger.info('Gemini AI response received', data);
    const docId = await backgroundUploadTask;
    await updateFirestore(req.uid, docId, data);
    res.status(200).json(data);
  } catch (error) {
    logger.error('Error in /api/identifyPlant:', error);
    res.status(500).json({ error: error.message });
  } finally {
    if (!filePath) return;
    try {
      await fs.promises.unlink(filePath);
      logger.info(`Temporary file ${filePath} removed`);
    } catch (error) {
      logger.warn(`Failed to remove temporary file ${filePath}: ${error.message}`);
    }
  }
});

const docToData = (doc) => {
  const data = doc.data();
  return { id: doc.id, ...data,
    createdAt: data.createdAt.toDate(), updatedAt: data.updatedAt.toDate() };
};

app.get('/api/history', async (req, res) => {
  try {
    const { day, timezone } = req.query;
    if (!day) return res.status(400).json({ error: 'Query parameter `day` is required in yyyy-mm-dd format' });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return res.status(400).json({ error: 'Invalid day format. Use yyyy-mm-dd.' });
    const targetDate = new Date(day);
    if (isNaN(targetDate)) return res.status(400).json({ error: 'Invalid day format. Use yyyy-mm-dd.' });
    if (!timezone) return res.status(400).json({ error: 'Query parameter `timezone` is required' });
    const timezoneOffset = parseInt(timezone, 10);
    if (isNaN(timezoneOffset)) return res.status(400).json({ error: 'Invalid timezone format. Use integer representing UTC offset in minutes.' });
    const startTime = new Date(targetDate);
    startTime.setMinutes(startTime.getMinutes() - timezoneOffset);
    const endTime = new Date(startTime);
    endTime.setDate(endTime.getDate() + 1);
    logger.info(`startTime: ${startTime.toISOString()}, endTime: ${endTime.toISOString()}`);
    
    const requestsRef = db.collection('users').doc(req.uid).collection('requests'); 
    const snapshot = await requestsRef.orderBy('createdAt', 'desc')
      .where('createdAt', '>=', startTime).where('createdAt', '<', endTime).get();
    const data = snapshot.docs.map(docToData);
    res.status(200).json(data);
  } catch (error) {
    logger.error('Error in /api/history:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/images/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const storagePath = `${req.uid}/images/${filename}`;
    const bucket = storage.bucket();
    const file = bucket.file(storagePath);
    const [metadata] = await file.getMetadata();
    const mimeType = metadata.contentType || 'application/octet-stream';
    res.setHeader('Content-Type', mimeType);
    file.createReadStream().on('error', (error) => {
      logger.error(`Error reading file ${storagePath}:`, error);
      res.status(500).send(error.message);
    }).pipe(res);
  } catch (error) {
    logger.error('Error in /api/images/:filename:', error);
    res.status(500).json({ error: error.message });
  }
});

exports.app = onRequest(app);
