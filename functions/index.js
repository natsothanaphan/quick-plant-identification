/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const { setGlobalOptions } = require("firebase-functions/v2");
const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const fetch = require('node-fetch');
const fs = require('fs'); // Added to handle file system operations
const { randomUUID } = require("crypto");
require('dotenv').config({path: '.env.default'});

// Required for Gemini AI
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { GoogleAIFileManager } = require("@google/generative-ai/server");

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

setGlobalOptions({ region: 'asia-southeast1' });

// Initialize Gemini AI clients (do this once at startup)
const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);
const fileManager = new GoogleAIFileManager(apiKey);

// Function to upload the file to Gemini
async function uploadToGemini(path, mimeType) {
  const uploadResult = await fileManager.uploadFile(path, {
    mimeType,
    displayName: path,
  });
  const file = uploadResult.file;
  logger.info(`Uploaded file ${file.displayName} as: ${file.name}`);
  return file;
}

// Define generation config and the Gemini model instance
const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 8192,
  responseMimeType: "application/json",
  responseSchema: {
    type: "object",
    properties: {
      "0-privateThinkingTrace": { type: "string" },
      "1-scientificName": { type: "string" },
      "2-commonNames": {
        type: "array",
        items: { type: "string" },
      },
      "3-confidenceProb": { type: "number" },
      "4-userExplanation": { type: "string" },
    },
    required: [
      "0-privateThinkingTrace",
      "1-scientificName",
      "2-commonNames",
      "3-confidenceProb",
      "4-userExplanation",
    ],
  },
};

const model = genAI.getGenerativeModel({
  model: "gemini-2.0-pro-exp-02-05",
  systemInstruction: "Identify a single plant in the image.\nOutput fields in this order: privateThinkingTrace, scientificName, commonNames, confidenceProb, userExplanation.",
});

// Create an HTTP endpoint for plant identification
exports.identifyPlant = onRequest(async (req, res) => {
  let filePath = "";

  try {
    // Only allow POST requests
    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }
    
    // Extract required data from the request body (do not accept client filename)
    const { mimeType, imageData } = req.body;
    if (!mimeType || !imageData) {
      res.status(400).json({ error: "Missing required fields: mimeType, imageData" });
      return;
    }
    
    // Generate a unique filename using UUID and an appropriate extension based on the MIME type
    let fileExtension = "";
    if (mimeType === "image/jpeg") fileExtension = ".jpeg";
    else if (mimeType === "image/png") fileExtension = ".png";
    const filename = randomUUID() + fileExtension;
    
    // Save the base64 encoded image data to a temporary file (async)
    filePath = `/tmp/${filename}`;
    await fs.promises.writeFile(filePath, imageData, { encoding: 'base64' });
    logger.info(`File saved to ${filePath}`);
    
    // Upload the file to Gemini
    const file = await uploadToGemini(filePath, mimeType);
    
    // Use generateContent instead of startChat to trigger plant identification
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              fileData: {
                mimeType: file.mimeType,
                fileUri: file.uri,
              },
            },
          ],
        },
      ],
      generationConfig,
    });
    
    // Retrieve the response text from Gemini's answer
    const responseText = await result.response.text();
    logger.info("Gemini AI response received");
    logger.info(responseText);
    
    // Return the parsed JSON from the Gemini response
    res.status(200).json(JSON.parse(responseText));
  } catch (error) {
    logger.error("Error in identifyPlant function:", error);
    res.status(500).json({ error: error.message });
  } finally {
    // Always attempt to remove the temporary file if it exists
    if (filePath) {
      try {
        await fs.promises.unlink(filePath);
        logger.info(`Temporary file ${filePath} removed`);
      } catch (cleanupError) {
        logger.warn(`Failed to remove temporary file ${filePath}: ${cleanupError.message}`);
      }
    }
  }
});
