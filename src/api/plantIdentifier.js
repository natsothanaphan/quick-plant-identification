// Hardcoded mode switch: options are "MOCK_SUCCESS", "MOCK_ERROR", or "REAL_API"
const API_MODE = "REAL_API"; // Change this value to change the behavior

// Optional simulated delay for the mock cases (in milliseconds)
const SIMULATED_DELAY_MS = 2000;

export async function identifyPlant({ mimeType, imageData }) {
  if (API_MODE === "MOCK_SUCCESS") {
    // Simulate a successful response after a delay
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          "0-privateThinkingTrace": "Mocked private thinking trace.",
          "1-scientificName": "Rosa rubiginosa",
          "2-commonNames": ["Sweet Briar", "Eglantine Rose"],
          "3-confidenceProb": 0.95,
          "4-userExplanation": "The image is highly likely to be of Rosa rubiginosa due to its distinct features. The image is highly likely to be of Rosa rubiginosa due to its distinct features. The image is highly likely to be of Rosa rubiginosa due to its distinct features."
        });
      }, SIMULATED_DELAY_MS);
    });
  } else if (API_MODE === "MOCK_ERROR") {
    // Simulate an error response after a delay
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        reject(new Error("Mock error: Plant identification failed."));
      }, SIMULATED_DELAY_MS);
    });
  } else if (API_MODE === "REAL_API") {
    // Call the real API endpoint. Adjust the URL as needed, perhaps to your Firebase Functions endpoint.
    try {
      const response = await fetch("/api/identifyPlant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ mimeType, imageData })
      });
      if (!response.ok) {
        throw new Error(`Identify Plant API returned error: ${response.statusText}`);
      }
      // Parse JSON and log the result before returning
      const data = await response.json();
      console.log("API response:", data);
      return data;
    } catch (error) {
      throw new Error(`Identify Plant API call failed: ${error.message}`);
    }
  } else {
    throw new Error("Invalid API mode configuration");
  }
}
