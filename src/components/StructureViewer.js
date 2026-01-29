import React, { useEffect, useRef, useState } from 'react';
import * as NGL from 'ngl';
import './StructureViewer.css';

const StructureViewer = ({ cifFile, millerIndices = null }) => {
  const viewerRef = useRef(null);
  const stageRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const shapeCompRef = useRef(null);

  useEffect(() => {
    if (!viewerRef.current) return;

    // Initialize NGL Stage
    if (!stageRef.current) {
      stageRef.current = new NGL.Stage(viewerRef.current, {
        backgroundColor: 'white'
      });
      
      // Add mouse controls info
      stageRef.current.mouseControls.add('drag-left', NGL.MouseActions.rotateDrag);
      stageRef.current.mouseControls.add('drag-right', NGL.MouseActions.panDrag);
      stageRef.current.mouseControls.add('scroll', NGL.MouseActions.zoomScroll);
    }

    // Handle window resize
    const handleResize = () => {
      if (stageRef.current) {
        stageRef.current.handleResize();
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    if (!cifFile || !stageRef.current) return;

    setLoading(true);
    setError(null);

    // Clear previous structures
    stageRef.current.removeAllComponents();
    shapeCompRef.current = null;

    // Read CIF file content
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const cifContent = e.target.result;
        
        // Create blob for NGL
        const blob = new Blob([cifContent], { type: 'text/plain' });
        
        // Load structure
        const component = await stageRef.current.loadFile(blob, { ext: 'cif' });
        
        // Add wire/line representation
        component.addRepresentation('line', {
          colorScheme: 'element',
          linewidth: 2
        });
        
        // Add ball representation for atoms
        component.addRepresentation('ball+stick', {
          colorScheme: 'element',
          radius: 0.3,
          bondScale: 0.3
        });
        
        // Mock h-bond visualization (would need actual h-bond detection in real impl)
        // For now, just show some distance measurements on heteroatoms
        try {
          component.addRepresentation('contact', {
            sele: 'hetero',
            filterSele: 'hetero',
            maxDistance: 3.5,
            color: 'orange',
            labelVisible: false
          });
        } catch (err) {
          console.log('Could not add h-bond representation:', err);
        }

        // Add cartesian xyz axes
        addCartesianAxes(component.structure);

        // Add miller plane visualization if indices provided
        if (millerIndices && component.structure.unitcell) {
          try {
            addMillerPlane(component.structure.unitcell, millerIndices);
          } catch (err) {
            console.log('Could not add miller plane:', err);
          }
        }
        
        // Auto-center and zoom
        component.autoView();
        
        setLoading(false);
      } catch (err) {
        console.error('Error loading structure:', err);
        setError('Failed to load structure. Make sure this is a valid CIF file.');
        setLoading(false);
      }
    };
    
    reader.onerror = () => {
      setError('Failed to read file');
      setLoading(false);
    };
    
    reader.readAsText(cifFile);
  }, [cifFile, millerIndices]);

  // Add cartesian xyz coordinate axes
  const addCartesianAxes = (structure) => {
    if (!stageRef.current) return;

    const bbox = structure.getBoundingBox();
    const center = bbox.getCenter(new NGL.Vector3());
    const size = bbox.getSize(new NGL.Vector3());
    const axisLength = Math.max(size.x, size.y, size.z) * 2.5; // extend way beyond

    const shape = new NGL.Shape('cartesian-axes');
    const grey = [0.5, 0.5, 0.5, 0.3]; // grey with 30% opacity
    const radius = 0.02;
    const tickSize = axisLength * 0.05;
    const tickInterval = Math.max(size.x, size.y, size.z) * 0.2;

    // X axis (grey)
    shape.addCylinder(
      [center.x - axisLength, center.y, center.z],
      [center.x + axisLength, center.y, center.z],
      grey,
      radius
    );
    shape.addText(
      [center.x + axisLength * 1.05, center.y, center.z],
      grey,
      1.5,
      'X'
    );
    // X axis tick marks
    for (let i = -Math.floor(axisLength / tickInterval); i <= Math.floor(axisLength / tickInterval); i++) {
      if (i === 0) continue;
      const pos = center.x + i * tickInterval;
      shape.addCylinder(
        [pos, center.y - tickSize, center.z],
        [pos, center.y + tickSize, center.z],
        grey,
        radius * 0.8
      );
    }

    // Y axis (grey)
    shape.addCylinder(
      [center.x, center.y - axisLength, center.z],
      [center.x, center.y + axisLength, center.z],
      grey,
      radius
    );
    shape.addText(
      [center.x, center.y + axisLength * 1.05, center.z],
      grey,
      1.5,
      'Y'
    );
    // Y axis tick marks
    for (let i = -Math.floor(axisLength / tickInterval); i <= Math.floor(axisLength / tickInterval); i++) {
      if (i === 0) continue;
      const pos = center.y + i * tickInterval;
      shape.addCylinder(
        [center.x - tickSize, pos, center.z],
        [center.x + tickSize, pos, center.z],
        grey,
        radius * 0.8
      );
    }

    // Z axis (grey)
    shape.addCylinder(
      [center.x, center.y, center.z - axisLength],
      [center.x, center.y, center.z + axisLength],
      grey,
      radius
    );
    shape.addText(
      [center.x, center.y, center.z + axisLength * 1.05],
      grey,
      1.5,
      'Z'
    );
    // Z axis tick marks
    for (let i = -Math.floor(axisLength / tickInterval); i <= Math.floor(axisLength / tickInterval); i++) {
      if (i === 0) continue;
      const pos = center.z + i * tickInterval;
      shape.addCylinder(
        [center.x - tickSize, center.y, pos],
        [center.x + tickSize, center.y, pos],
        grey,
        radius * 0.8
      );
    }

    const axesComp = stageRef.current.addComponentFromObject(shape);
    axesComp.addRepresentation('buffer');
  };


  // Calculate miller plane normal and add visualization
  const addMillerPlane = (unitcell, [h, k, l]) => {
    if (!stageRef.current) return;

    // Get unit cell params
    const a = unitcell.a || 10;
    const b = unitcell.b || 10;
    const c = unitcell.c || 10;
    const alpha = (unitcell.alpha || 90) * Math.PI / 180;
    const beta = (unitcell.beta || 90) * Math.PI / 180;
    const gamma = (unitcell.gamma || 90) * Math.PI / 180;

    // Calculate reciprocal lattice vectors (simplified for orthogonal cells)
    const cosAlpha = Math.cos(alpha);
    const cosBeta = Math.cos(beta);
    const cosGamma = Math.cos(gamma);
    const sinGamma = Math.sin(gamma);

    const V = a * b * c * Math.sqrt(1 - cosAlpha**2 - cosBeta**2 - cosGamma**2 + 2*cosAlpha*cosBeta*cosGamma);
    
    // Reciprocal lattice
    const aStar = (b * c * Math.sin(alpha)) / V;
    const bStar = (a * c * Math.sin(beta)) / V;
    const cStar = (a * b * sinGamma) / V;

    // Normal vector in reciprocal space
    const nx = h * aStar;
    const ny = k * bStar;
    const nz = l * cStar;
    
    // Normalize
    const norm = Math.sqrt(nx**2 + ny**2 + nz**2);
    if (norm < 0.001) return; // skip if indices are all zero
    
    const nxNorm = nx / norm;
    const nyNorm = ny / norm;
    const nzNorm = nz / norm;

    // Get structure center
    const center = unitcell.getCenter(new NGL.Vector3());
    
    // Create arrow showing plane normal
    const arrowLength = Math.max(a, b, c) * 0.8;
    const shape = new NGL.Shape('miller-plane');
    
    // Draw arrow from center in normal direction
    const endPoint = [
      center.x + nxNorm * arrowLength,
      center.y + nyNorm * arrowLength,
      center.z + nzNorm * arrowLength
    ];
    
    shape.addArrow(
      [center.x, center.y, center.z],
      endPoint,
      [0.2, 0.5, 1.0], // blue color
      arrowLength * 0.05 // radius
    );

    // Add label
    shape.addText(
      endPoint,
      [0.2, 0.5, 1.0],
      1.5,
      `(${h}${k}${l})`
    );

    // Create plane mesh (simplified - just a quad perpendicular to normal)
    const planeSize = Math.max(a, b, c) * 0.6;
    
    // Find two perpendicular vectors to normal
    let v1, v2;
    if (Math.abs(nxNorm) < 0.9) {
      v1 = { x: 1, y: 0, z: 0 };
    } else {
      v1 = { x: 0, y: 1, z: 0 };
    }
    
    // Cross product to get perpendicular
    const crossX = nyNorm * v1.z - nzNorm * v1.y;
    const crossY = nzNorm * v1.x - nxNorm * v1.z;
    const crossZ = nxNorm * v1.y - nyNorm * v1.x;
    const crossNorm = Math.sqrt(crossX**2 + crossY**2 + crossZ**2);
    
    v1 = {
      x: crossX / crossNorm,
      y: crossY / crossNorm,
      z: crossZ / crossNorm
    };
    
    // Second perpendicular
    const cross2X = nyNorm * v1.z - nzNorm * v1.y;
    const cross2Y = nzNorm * v1.x - nxNorm * v1.z;
    const cross2Z = nxNorm * v1.y - nyNorm * v1.x;
    const cross2Norm = Math.sqrt(cross2X**2 + cross2Y**2 + cross2Z**2);
    
    v2 = {
      x: cross2X / cross2Norm,
      y: cross2Y / cross2Norm,
      z: cross2Z / cross2Norm
    };

    // Draw semi-transparent plane quad
    const corners = [
      [
        center.x + v1.x * planeSize + v2.x * planeSize,
        center.y + v1.y * planeSize + v2.y * planeSize,
        center.z + v1.z * planeSize + v2.z * planeSize
      ],
      [
        center.x - v1.x * planeSize + v2.x * planeSize,
        center.y - v1.y * planeSize + v2.y * planeSize,
        center.z - v1.z * planeSize + v2.z * planeSize
      ],
      [
        center.x - v1.x * planeSize - v2.x * planeSize,
        center.y - v1.y * planeSize - v2.y * planeSize,
        center.z - v1.z * planeSize - v2.z * planeSize
      ],
      [
        center.x + v1.x * planeSize - v2.x * planeSize,
        center.y + v1.y * planeSize - v2.y * planeSize,
        center.z + v1.z * planeSize - v2.z * planeSize
      ]
    ];

    // Add mesh (edges of plane)
    for (let i = 0; i < 4; i++) {
      shape.addCylinder(
        corners[i],
        corners[(i + 1) % 4],
        [0.2, 0.5, 1.0], // solid blue, matching arrow
        0.05
      );
    }

    shapeCompRef.current = stageRef.current.addComponentFromObject(shape);
    shapeCompRef.current.addRepresentation('buffer');
  };

  return (
    <div className="structure-viewer-container">
      <div className="viewer-header">
        <h3>Structure Visualization</h3>
        <p className="viewer-instructions">
          Drag to rotate • Right-click to pan • Scroll to zoom
          {millerIndices && <span> • Blue arrow: ({millerIndices[0]}{millerIndices[1]}{millerIndices[2]}) plane normal</span>}
        </p>
      </div>
      
      {loading && (
        <div className="viewer-loading">
          <div className="spinner"></div>
          <p>Loading structure...</p>
        </div>
      )}
      
      {error && (
        <div className="viewer-error">
          <p>{error}</p>
        </div>
      )}
      
      <div 
        ref={viewerRef} 
        className="ngl-viewer"
        style={{ display: loading || error ? 'none' : 'block' }}
      />
      
      <div className="viewer-legend">
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#FF6B6B' }}>━</span>
          <span>Oxygen</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#4ECDC4' }}>━</span>
          <span>Carbon</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#95E1D3' }}>━</span>
          <span>Nitrogen</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#FFA500' }}>━</span>
          <span>H-bonds</span>
        </div>
        {millerIndices && (
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: '#3380FF' }}>➤</span>
            <span>Miller plane ({millerIndices[0]}{millerIndices[1]}{millerIndices[2]})</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StructureViewer;
