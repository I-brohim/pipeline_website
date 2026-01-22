import React, { useState } from 'react';
import './App.css';
import ShapChart from './components/ShapChart';

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [millerH, setMillerH] = useState('');
  const [millerK, setMillerK] = useState('');
  const [millerL, setMillerL] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.name.endsWith('.cif')) {
      setSelectedFile(file);
      setResult(null);
    } else {
      alert('Please select a valid .cif file');
      event.target.value = null;
    }
  };

  const handlePredict = async () => {
    if (!selectedFile) {
      alert('Please upload a CIF file first');
      return;
    }

    if (!millerH || !millerK || !millerL) {
      alert('Please enter Miller indices (h, k, l)');
      return;
    }

    setLoading(true);
    setResult(null);

    // Create FormData to send file and Miller indices
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('millerH', millerH);
    formData.append('millerK', millerK);
    formData.append('millerL', millerL);

    try {
      const response = await fetch('http://localhost:8000/predict', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (data.error) {
        alert(`Prediction error: ${data.error}`);
        setLoading(false);
        return;
      }

      setResult(data);
      setLoading(false);
    } catch (error) {
      alert(`Failed to get prediction: ${error.message}`);
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="header">
        <h1>ML Prediction Platform</h1>
        <p>Predict Mechanical Properties</p>
      </header>

      <main className="main">
        <section className="intro">
          <h2>About</h2>
          <p>
            Upload a CIF file of your structure and specify
            the indentation direction using Miller indices to predict mechanical
            properties.
          </p>
        </section>

        <section className="upload-section">
          <h2>Upload Structure</h2>
          <div className="file-input-wrapper">
            <label htmlFor="cif-upload" className="file-label">
              Choose CIF File
            </label>
            <input
              id="cif-upload"
              type="file"
              accept=".cif"
              onChange={handleFileChange}
              className="file-input"
            />
            {selectedFile && (
              <span className="file-name">{selectedFile.name}</span>
            )}
          </div>
        </section>

        <section className="miller-section">
          <h2>Indentation Direction (Miller Indices)</h2>
          <div className="miller-inputs">
            <div className="input-group">
              <label>h:</label>
              <input
                type="number"
                value={millerH}
                onChange={(e) => setMillerH(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="input-group">
              <label>k:</label>
              <input
                type="number"
                value={millerK}
                onChange={(e) => setMillerK(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="input-group">
              <label>l:</label>
              <input
                type="number"
                value={millerL}
                onChange={(e) => setMillerL(e.target.value)}
                placeholder="1"
              />
            </div>
          </div>
        </section>

        <button className="predict-button" onClick={handlePredict} disabled={loading}>
          {loading ? 'Predicting...' : 'Predict Properties'}
        </button>

        {loading && (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Analyzing MOF structure and calculating properties...</p>
          </div>
        )}

        {result && (
          <section className="results">
            <h2>Predicted Properties</h2>
            <div className="result-grid">
              <div className="result-item">
                <span className="result-label">Young's Modulus:</span>
                <span className="result-value">{result.youngs_modulus} GPa</span>
              </div>
            </div>
            
            {result.shap_values && result.shap_values.length > 0 && (
              <ShapChart shapValues={result.shap_values} />
            )}
          </section>
        )}
      </main>

      <footer className="footer">
        <p>© 2026</p>
      </footer>
    </div>
  );
}

export default App;


