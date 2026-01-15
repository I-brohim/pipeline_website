import React, { useEffect, useRef } from 'react';
import * as $3Dmol from '3dmol';
import './CrystalViewer.css';

const CrystalViewer = ({ cifContent }) => {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);

  // Initialize 3Dmol viewer on mount
  useEffect(() => {
    if (containerRef.current && !viewerRef.current) {
      const config = { backgroundColor: 'white' };
      const viewer = $3Dmol.createViewer(containerRef.current, config);
      viewerRef.current = viewer;
    }
  }, []);

  // Load CIF content when it changes
  useEffect(() => {
    if (viewerRef.current && cifContent) {
      try {
        const viewer = viewerRef.current;
        
        // Clear previous structure
        viewer.clear();
        
        // Add model from CIF data
        viewer.addModel(cifContent, 'cif');
        
        // Set style - sphere for atoms, stick for bonds
        viewer.setStyle({}, {
          sphere: { radius: 0.3 },
          stick: { radius: 0.15 }
        });
        
        // Add unit cell box
        viewer.addUnitCell();
        
        // Zoom to fit and render
        viewer.zoomTo();
        viewer.render();
      } catch (error) {
        console.error('Failed to load CIF structure:', error);
      }
    }
  }, [cifContent]);

  return (
    <div className="crystal-viewer-wrapper">
      <div ref={containerRef} className="crystal-viewer-container" />
    </div>
  );
};

export default CrystalViewer;
