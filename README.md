# MOF Property Prediction Platform

frontend-only react demo for predicting mechanical properties of metal-organic frameworks (mofs) from cif files.

## features

- **cif file upload**: drag & drop or browse to upload mof structure files
- **young's modulus prediction**: calculates for all 7 standard indentation directions: [001], [010], [100], [011], [101], [110], [111]
- **3d structure visualization**: interactive ngl viewer with:
  - ball-and-stick molecular representation
  - hydrogen bond contacts (orange)
  - cartesian xyz axes (grey, semi-transparent)
  - miller plane visualization (blue arrow + wireframe)
  - mouse controls: rotate (left drag), pan (right drag), zoom (scroll)
- **shap feature importance**: expandable analysis per direction showing feature contributions
- **miller plane overlay**: visualizes indentation direction when selecting results
- **sortable results**: toggle ascending/descending by young's modulus
- **log file export**: download complete results as timestamped .log file
- **fully client-side**: no backend required, runs entirely in browser

## tech stack

- react 18.2
- ngl viewer 2.4 (molecular visualization)
- recharts 3.7 (shap charts)
- vanilla css

## setup

```bash
npm install
npm start
```

opens on `http://localhost:3000`

## usage

1. upload a .cif file of your mof structure
2. view the 3d visualization
3. click "predict properties" to generate predictions
4. expand individual results to see shap analysis + miller plane overlay
5. download results as .log file for record keeping

## note

currently uses mock data generation for demo purposes. replace `generateMockFeatures` and `generateMockShapValues` functions in `src/App.js` with actual ml model inference when ready.

cif files must contain valid `_atom_site` loop with coordinate data. incomplete or malformed cif files will fail to visualize.
