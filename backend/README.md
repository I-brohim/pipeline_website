# Backend Setup

## Installation

```bash
cd backend
pip install -r requirements.txt
```

## Running the Server

```bash
python app.py
```

The API will run on http://localhost:5000

## Endpoints

### POST /predict
Predicts Young's Modulus from CIF file and Miller indices.

**Parameters:**
- `file`: CIF file upload
- `millerH`: Miller index h (int)
- `millerK`: Miller index k (int)
- `millerL`: Miller index l (int)

**Response:**
```json
{
  "youngs_modulus": 15.42,
  "shap_values": [
    {"feature": "PLD (Å)", "value": 12.5, "importance": 2.3},
    {"feature": "LCD (Å)", "value": 18.2, "importance": 1.8},
    ...
  ],
  "miller_indices": {"h": 0, "k": 0, "l": 1}
}
```

## Model Notes

**Current Status:** No model yet - returns mock predictions and SHAP values for demonstration.

**When model is ready:**
1. Add model file to backend directory (e.g., `model.pkl` or `model.xgb`)
2. Add `xgboost` and `shap` to requirements.txt
3. Load model in app.py startup
4. Replace `generate_mock_features()` with actual pymatgen/Zeo++ feature extraction
5. Replace mock prediction with `model.predict()`
6. Replace `generate_mock_shap_values()` with actual SHAP calculation
