# MOF Property Prediction Platform

frontend-only react demo for predicting mechanical properties of metal-organic frameworks (mofs) from cif files.

## features

- upload .cif structure files
- predicts young's modulus for all 7 standard indentation directions: [001], [010], [100], [011], [101], [110], [111]
- shap feature importance analysis per direction (collapsible)
- sortable results table
- fully client-side (no backend required)

## tech stack

- react 18
- recharts for visualization
- vanilla css

## setup

```bash
npm install
npm start
```

opens on `http://localhost:3000`

## note

currently uses mock data generation for demo purposes. replace `generateMockFeatures` and `generateMockShapValues` functions in `src/App.js` with actual ml model inference when ready.
