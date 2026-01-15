# MOF ML Prediction Platform - Landing Page

A minimal MVP landing page for predicting mechanical properties of Metal-Organic Frameworks using machine learning.

## Features

- CIF file upload
- Miller indices input for indentation direction
- Simulated property prediction (Young's modulus, Shear modulus, Hardness)
- Clean, responsive design

## Getting Started

### Installation

```bash
npm install
```

### Run Development Server

```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

### Build for Production

```bash
npm run build
```

## Usage

1. Upload a CIF file of your MOF structure
2. Enter Miller indices (h, k, l) for the indentation direction
3. Click "Predict Properties" to see results

## Next Steps

- Connect to actual backend API for predictions
- Add 3D structure visualization using CrystVis-js
- Implement file validation and error handling
- Add more detailed property analysis

## Tech Stack

- React 18
- CSS3
- HTML5
