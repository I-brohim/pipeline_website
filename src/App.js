import React, { useState } from 'react';
import './App.css';
import ShapChart from './components/ShapChart';
import StructureViewer from './components/StructureViewer';

// Feature names for MOF structures
const FEATURE_NAMES = [
  "PLD (Å)",  // Pore Limiting Diameter
  "LCD (Å)",  // Largest Cavity Diameter
  "Void Fraction",
  "Density (g/cm³)",
  "Metal Electronegativity"
];

// Standard indentation directions (0/1 combinations)
const INDENTATION_DIRECTIONS = [
  [0, 0, 1],
  [0, 1, 0],
  [1, 0, 0],
  [0, 1, 1],
  [1, 0, 1],
  [1, 1, 0],
  [1, 1, 1]
];

// Generate mock structural features
const generateMockFeatures = (fileSize, millerIndices) => {
  const [h, k, l] = millerIndices;
  const seed = (fileSize + h * 1000 + k * 100 + l * 10) % 10000;
  
  // Simple seeded random (not cryptographically secure but consistent)
  const seededRandom = (seed) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };
  
  return [
    5 + seededRandom(seed) * 10,      // PLD in Angstroms
    10 + seededRandom(seed + 1) * 15,  // LCD in Angstroms
    0.3 + seededRandom(seed + 2) * 0.5, // Void fraction
    0.5 + seededRandom(seed + 3) * 1.5, // Density g/cm³
    1.5 + seededRandom(seed + 4) * 1.0  // Metal electronegativity
  ];
};

// Generate mock SHAP values
const generateMockShapValues = (features) => {
  const sum = features.reduce((a, b) => a + b, 0);
  const seed = Math.floor(sum * 100) % 10000;
  
  const seededRandom = (s) => {
    const x = Math.sin(s) * 10000;
    return x - Math.floor(x);
  };
  
  return features.map((_, i) => {
    const val = (seededRandom(seed + i) - 0.5) * 4;
    return i % 2 === 0 ? Math.abs(val) : -Math.abs(val);
  });
};

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' or 'desc'
  const [expandedRows, setExpandedRows] = useState({});
  const [selectedDirection, setSelectedDirection] = useState(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.name.endsWith('.cif')) {
      setSelectedFile(file);
      setResults(null);
    } else {
      alert('Please select a valid .cif file');
      event.target.value = null;
    }
  };

  const toggleRow = (index) => {
    setExpandedRows(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
    // Set selected direction when expanding
    if (!expandedRows[index]) {
      const sorted = getSortedResults();
      setSelectedDirection(sorted[index].direction);
    }
  };

  const toggleSort = () => {
    setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
  };

  const getSortedResults = () => {
    if (!results) return [];
    const sorted = [...results];
    sorted.sort((a, b) => {
      return sortOrder === 'desc' 
        ? b.youngs_modulus - a.youngs_modulus
        : a.youngs_modulus - b.youngs_modulus;
    });
    return sorted;
  };

  const handlePredict = async () => {
    if (!selectedFile) {
      alert('Please upload a CIF file first');
      return;
    }

    setLoading(true);
    setResults(null);
    setExpandedRows({});

    // Simulate processing delay
    setTimeout(() => {
      const predictions = [];
      const fileSize = selectedFile.size;
      
      // Generate predictions for each indentation direction
      for (const direction of INDENTATION_DIRECTIONS) {
        const [h, k, l] = direction;
        
        // Generate mock features
        const features = generateMockFeatures(fileSize, direction);
        
        // Generate mock prediction
        const basePrediction = 15.0;
        const seed = fileSize + h * 100 + k * 10 + l;
        const seededRandom = (s) => {
          const x = Math.sin(s) * 10000;
          return x - Math.floor(x);
        };
        const prediction = basePrediction + (seededRandom(seed) - 0.5) * 10;
        
        // Generate mock SHAP values
        const shapValues = generateMockShapValues(features);
        
        // Prepare SHAP data
        const shapData = FEATURE_NAMES.map((name, i) => ({
          feature: name,
          value: features[i],
          importance: shapValues[i]
        }));
        
        // Sort by absolute importance
        shapData.sort((a, b) => Math.abs(b.importance) - Math.abs(a.importance));
        
        predictions.push({
          direction,
          youngs_modulus: parseFloat(prediction.toFixed(2)),
          shap_values: shapData
        });
      }
      
      setResults(predictions);
      setLoading(false);
    }, 800); // Simulate processing time
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
            Upload a CIF file of your MOF structure to predict Young's modulus
            for all standard indentation directions.
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

        {selectedFile && (
          <StructureViewer 
            cifFile={selectedFile} 
            millerIndices={selectedDirection}
          />
        )}

        <button className="predict-button" onClick={handlePredict} disabled={loading}>
          {loading ? 'Predicting...' : 'Predict Properties'}
        </button>

        {loading && (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Analyzing MOF structure and calculating properties...</p>
          </div>
        )}

        {results && (
          <section className="results">
            <div className="results-header">
              <h2>Predicted Properties</h2>
              <button className="sort-button" onClick={toggleSort}>
                Sort by Modulus {sortOrder === 'desc' ? '↓' : '↑'}
              </button>
            </div>
            
            <div className="results-table">
              <div className="table-header">
                <div className="col-direction">Direction</div>
                <div className="col-modulus">Young's Modulus (GPa)</div>
                <div className="col-expand">Analysis</div>
              </div>
              
              {getSortedResults().map((prediction, index) => {
                const [h, k, l] = prediction.direction;
                const isExpanded = expandedRows[index];
                
                return (
                  <div key={index} className="table-row-wrapper">
                    <div className="table-row">
                      <div className="col-direction">
                        [{h},{k},{l}]
                      </div>
                      <div className="col-modulus">
                        {prediction.youngs_modulus}
                      </div>
                      <div className="col-expand">
                        <button 
                          className="expand-button"
                          onClick={() => toggleRow(index)}
                        >
                          {isExpanded ? '▼' : '▶'} SHAP
                        </button>
                      </div>
                    </div>
                    
                    {isExpanded && (
                      <div className="shap-section">
                        <ShapChart shapValues={prediction.shap_values} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
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


