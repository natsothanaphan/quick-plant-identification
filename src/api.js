const doMockSuccess = () => new Promise((resolve) => {
  setTimeout(() => {
    resolve({
      '0-privateThinkingTrace': 'Mocked private thinking trace.',
      '1-scientificName': 'Rosa rubiginosa',
      '2-commonNames': ['Sweet Briar', 'Eglantine Rose'],
      '3-confidenceProb': 0.95,
      '4-userExplanation': 'The image is highly likely to be of Rosa rubiginosa due to its distinct features. The image is highly likely to be of Rosa rubiginosa due to its distinct features. The image is highly likely to be of Rosa rubiginosa due to its distinct features.'
    });
  }, 2000);
});
const doMockError = () => new Promise((resolve, reject) => {
  setTimeout(() => {
    reject(new Error('Mock error: Plant identification failed.'));
  }, 2000);
});

const identifyPlant = async (token, { mimeType, imageData }) => {
  // return await doMockSuccess();
  // return await doMockError();
  try {
    const resp = await fetch('/api/identifyPlant', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ mimeType, imageData }),
    });
    if (!resp.ok) {
      throw new Error(`Identify Plant API returned error: ${resp.status}`);
    }
    const data = await resp.json();
    console.log('API response:', data);
    return data;
  } catch (error) {
    throw new Error(`Identify Plant API call failed: ${error.message}`);
  }
};

export default { identifyPlant };
