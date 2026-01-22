from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
import tempfile
import os
from typing import Dict

app = FastAPI()

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Feature names for MOF structures
FEATURE_NAMES = [
    "PLD (Å)",  # Pore Limiting Diameter
    "LCD (Å)",  # Largest Cavity Diameter
    "Void Fraction",
    "Density (g/cm³)",
    "Metal Electronegativity"
]

def generate_mock_features(cif_path: str, miller_indices: tuple) -> np.ndarray:
    """
    Generate mock structural features for demonstration.
    
    TODO: Replace with actual feature extraction using pymatgen/Zeo++:
    - PLD (Pore Limiting Diameter)
    - LCD (Largest Cavity Diameter)
    - Void fraction
    - Framework density
    - Metal properties
    
    For now, generates consistent random features based on file and Miller indices.
    """
    # Use file size and miller indices to generate consistent features
    file_size = os.path.getsize(cif_path)
    h, k, l = miller_indices
    
    # Generate pseudo-features that are consistent for the same file + indices
    seed = (file_size + h * 1000 + k * 100 + l * 10) % 10000
    np.random.seed(seed)
    
    features = np.array([
        np.random.uniform(5, 15),      # PLD in Angstroms
        np.random.uniform(10, 25),     # LCD in Angstroms
        np.random.uniform(0.3, 0.8),   # Void fraction
        np.random.uniform(0.5, 2.0),   # Density g/cm³
        np.random.uniform(1.5, 2.5)    # Metal electronegativity
    ])
    
    return features

def generate_mock_shap_values(features: np.ndarray) -> np.ndarray:
    """
    Generate mock SHAP values for demonstration.
    
    TODO: Replace with actual SHAP calculation when model is available.
    
    For now, generates random SHAP values that sum to approximate the deviation
    from a base prediction.
    """
    # Generate random SHAP values with some correlation to feature values
    # Some positive, some negative to show feature contribution
    np.random.seed(int(features.sum() * 100) % 10000)
    
    shap_values = np.random.randn(len(features)) * 2
    # Make sure some are positive and some negative
    shap_values[::2] = np.abs(shap_values[::2])  # Make even indices positive
    shap_values[1::2] = -np.abs(shap_values[1::2])  # Make odd indices negative
    
    return shap_values

@app.post("/predict")
async def predict(
    file: UploadFile = File(...),
    millerH: int = Form(...),
    millerK: int = Form(...),
    millerL: int = Form(...)
) -> Dict:
    """
    Predict Young's Modulus from CIF file and Miller indices.
    Returns mock prediction and SHAP feature importance values.
    
    TODO: Replace with actual model prediction when model is available.
    """
    # Validate file type
    if not file.filename.endswith('.cif'):
        return {"error": "File must be a .cif file"}, 400
    
    # Save uploaded file temporarily
    with tempfile.NamedTemporaryFile(delete=False, suffix='.cif') as temp_file:
        content = await file.read()
        temp_file.write(content)
        temp_path = temp_file.name
    
    try:
        # Generate mock features
        miller_indices = (millerH, millerK, millerL)
        features = generate_mock_features(temp_path, miller_indices)
        
        # Generate mock prediction (random but consistent for same input)
        base_prediction = 15.0  # Base Young's modulus
        prediction = base_prediction + np.random.uniform(-5, 5)
        
        # Generate mock SHAP values
        shap_values = generate_mock_shap_values(features)
        
        # Prepare SHAP data for frontend
        shap_data = [
            {
                "feature": FEATURE_NAMES[i],
                "value": float(features[i]),
                "importance": float(shap_values[i])
            }
            for i in range(len(FEATURE_NAMES))
        ]
        
        # Sort by absolute importance
        shap_data.sort(key=lambda x: abs(x["importance"]), reverse=True)
        
        return {
            "youngs_modulus": round(float(prediction), 2),
            "shap_values": shap_data,
            "miller_indices": {"h": millerH, "k": millerK, "l": millerL}
        }
        
    except Exception as e:
        return {"error": f"Prediction failed: {str(e)}"}, 500
        
    finally:
        # Clean up temporary file
        if os.path.exists(temp_path):
            os.unlink(temp_path)

@app.get("/")
async def root():
    return {"message": "MOF Property Prediction API", "status": "running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
