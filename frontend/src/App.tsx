import React, { useState } from 'react';
import axios from 'axios';

interface PageResult {
  url: string;
  summary: string;
}

interface ComparisonResult {
  wikipedia: PageResult | null;
  grockypedia: PageResult | null;
}

function App() {
  const [term, setTerm] = useState('');
  const [results, setResults] = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!term) return;

    setLoading(true);
    setError('');
    setResults(null);

    try {
      const response = await axios.get(`/api/compare?term=${encodeURIComponent(term)}`);
      setResults(response.data);
    } catch (err) {
      setError('Failed to fetch results. Is the backend running?');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Wiki vs Grokipedia Comparison</h1>
      <form onSubmit={handleSearch} style={{ marginBottom: '20px' }}>
        <input
          type="text"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Enter search term (e.g., Apple)"
          style={{ padding: '8px', width: '300px', marginRight: '10px' }}
        />
        <button type="submit" disabled={loading} style={{ padding: '8px 16px' }}>
          {loading ? 'Searching...' : 'Compare'}
        </button>
      </form>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div style={{ display: 'flex', gap: '20px' }}>
        <div style={{ flex: 1, border: '1px solid #ccc', padding: '15px', borderRadius: '8px' }}>
          <h2>Wikipedia</h2>
          {results?.wikipedia ? (
            <div>
              <p>{results.wikipedia.summary}</p>
              <a href={results.wikipedia.url} target="_blank" rel="noopener noreferrer">Read more on Wikipedia</a>
            </div>
          ) : (
            <p>{loading ? 'Loading...' : 'No Wikipedia result found.'}</p>
          )}
        </div>

        <div style={{ flex: 1, border: '1px solid #ccc', padding: '15px', borderRadius: '8px' }}>
          <h2>Grokipedia</h2>
          {results?.grockypedia ? (
            <div>
              <p>{results.grockypedia.summary}</p>
              <a href={results.grockypedia.url} target="_blank" rel="noopener noreferrer">Read more on Grokipedia</a>
            </div>
          ) : (
            <p>{loading ? 'Loading...' : 'No Grokipedia result found.'}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
