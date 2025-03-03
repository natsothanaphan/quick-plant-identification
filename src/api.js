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
  console.log('api identifyPlant start', { mimeType });
  // return await doMockSuccess();
  // return await doMockError();
  try {
    const resp = await fetch('/api/identifyPlant', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ mimeType, imageData }),
    });
    if (!resp.ok) {
      const errData = await resp.json();
      console.error('api identifyPlant error', { errData });
      throw new Error(errData.error || 'Failed api identifyPlant');
    }
    const data = await resp.json();
    console.log('api identifyPlant done', { data });
    return data;
  } catch (err) {
    throw err;
  }
};

const getHistory = async (token, day, timezone) => {
  console.log('api getHistory start', { day, timezone });
  try {
    const resp = await fetch(`/api/history?day=${encodeURIComponent(day)}&timezone=${encodeURIComponent(timezone)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!resp.ok) {
      const errData = await resp.json();
      console.error('api getHistory error', { errData });
      throw new Error(errData.error || 'Failed api getHistory');
    }
    const data = await resp.json();
    console.log('api getHistory done', { data });
    return data;
  } catch (err) {
    throw err;
  }
};

const imageCache = new Map();

const fetchImage = async (token, filename) => {
  console.log('api fetchImage start', { filename });
  if (imageCache.has(filename)) {
    const imgURL = imageCache.get(filename);
    console.log('api fetchImage cache hit', { imgURL });
    return imgURL;
  }
  try {
    const resp = await fetch(`/api/images/${filename}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!resp.ok) {
      console.error('api fetchImage error');
      throw new Error('Failed to fetch image');
    }
    const blob = await resp.blob();
    const imgURL = URL.createObjectURL(blob);
    console.log('api fetchImage done', { imgURL });
    imageCache.set(filename, imgURL);
    return imgURL;
  } catch (err) {
    throw err;
  }
};

export default {
  identifyPlant,
  getHistory,
  fetchImage,
};
