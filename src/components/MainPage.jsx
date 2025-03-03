import React, { useState, useRef } from 'react';
import './MainPage.css';
import api from '../api.js';
import { alertAndLogErr, convertFileToBase64 } from '../utils.js';

const MainPage = ({ user }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const fileInputRef = useRef(null);
  const activeReqId = useRef(0);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'image/jpeg' && file.type !== 'image/png') {
      alertAndLogErr(new Error('Please select a JPEG or PNG image'));
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setLoading(false);
    setResult(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      alertAndLogErr(new Error('No file selected'));
      return;
    }

    activeReqId.current++;
    const thisReqId = activeReqId.current;
    setLoading(true);
    setResult(null);
    try {
      const base64Str = await convertFileToBase64(selectedFile);
      if (thisReqId !== activeReqId.current) return;
      const idToken = await user.getIdToken();
      if (thisReqId !== activeReqId.current) return;
      const data = await api.identifyPlant(idToken, { mimeType: selectedFile.type, imageData: base64Str });

      if (thisReqId !== activeReqId.current) return;
      setResult(data);
    } catch (err) {
      if (thisReqId !== activeReqId.current) return;
      alertAndLogErr(err);
    } finally {
      if (thisReqId !== activeReqId.current) return;
      setLoading(false);
    }
  };

  const handleReset = () => {
    activeReqId.current++
    setSelectedFile(null);
    setPreviewUrl('');
    setLoading(false);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = null;
  };

  return <>
    <form className='submit-form' onSubmit={handleSubmit}>
      <input type='file' accept='image/jpeg, image/png' ref={fileInputRef}
        onChange={handleFileChange} />
      {selectedFile && <>
        {previewUrl && <img src={previewUrl} alt='Preview' />}
        <button type='submit' title='Submit' disabled={loading}>{!loading ? '🧪' : 'Loading...'}</button>
      </>}
    </form>
    {!loading && result && <div className='result-container'>
      <p>🔬 Scientific name—<em>{result['1-scientificName']}</em></p>
      <p>💬 Common names—{result['2-commonNames'].join('; ')}</p>
      <p>❓ Confidence—{result['3-confidenceProb']}</p>
      <p>✏️ Explanation—{result['4-userExplanation']}</p>
    </div>}
    <button onClick={handleReset} className='reset-button' title='Clear'>❌</button>
  </>;
};

export default MainPage;
