import React, { useState, useEffect } from 'react';
import './HistoryPage.css';
import api from '../api.js';
import { alertAndLogErr, formatDay, formatTimestamp, getTimezone } from '../utils.js';

const HistoryPage = ({ user, onBack }) => {
  const [selectedDay, setSelectedDay] = useState(formatDay(new Date()));
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState({});
  const [images, setImages] = useState({});

  const timezone = getTimezone();

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const history = await api.getHistory(token, selectedDay, timezone);
      setHistory(history);
      setExpanded({});
    } catch (err) {
      alertAndLogErr(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = async (entry) => {
    const id = entry.id;
    setExpanded((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
    if (expanded[id]) return;
    if (images[id]) return;
    try {
      const token = await user.getIdToken();
      const filename = entry.filename.split('/').pop();
      const imgURL = await api.fetchImage(token, filename);
      setImages((prev) => ({
        ...prev,
        [id]: imgURL,
      }));
    } catch (err) {
      alertAndLogErr(err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [selectedDay]);

  return <>
    <button onClick={onBack} className='back-button'>Back</button>
    <div className='history-list'>
      <input type='date' value={selectedDay}
        onChange={(e) => setSelectedDay(e.target.value)} />
      {loading && <p>Loading...</p>}
      {!loading && history.length === 0 && <p>No history</p>}
      {!loading && history.length > 0 && <ul>{history.map((entry) => <li key={entry.id}>
        <a href='#' onClick={() => toggleExpand(entry)}>
          <span>{expanded[entry.id] ? '📖' : '📕'}</span>{' '}
          <span>{formatTimestamp(entry.createdAt)}</span>
        </a>
        {expanded[entry.id] && <div className='history-entry'>
          {!images[entry.id] && <p>Loading...</p>}
          {images[entry.id] && <img src={images[entry.id]} alt='History image' />}
          {!entry.result && <p>No result</p>}
          {entry.result && <div className='result-container'>
            <p>🔬 Scientific name—<em>{entry.result['1-scientificName']}</em></p>
            <p>💬 Common names—{entry.result['2-commonNames'].join('; ')}</p>
            <p>❓ Confidence—{entry.result['3-confidenceProb']}</p>
            <p>✏️ Explanation—{entry.result['4-userExplanation']}</p>
          </div>}
        </div>}
      </li>)}</ul>}
      {!loading && <button onClick={fetchHistory}>Reload</button>}
    </div>
  </>;
};

export default HistoryPage;
