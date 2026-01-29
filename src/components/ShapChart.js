import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer, ReferenceLine } from 'recharts';
import './ShapChart.css';

const ShapChart = ({ shapValues }) => {
  if (!shapValues || shapValues.length === 0) {
    return null;
  }

  // Prepare data for the chart
  const chartData = shapValues.map(item => ({
    feature: item.feature,
    importance: item.importance,
    value: item.value
  }));

  // Custom tooltip to show feature value and importance
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="shap-tooltip">
          <p className="tooltip-feature">{data.feature}</p>
          <p className="tooltip-value">Value: {data.value.toFixed(2)}</p>
          <p className="tooltip-importance">
            Impact: {data.importance > 0 ? '+' : ''}{data.importance.toFixed(3)} GPa
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="shap-chart-container">
      <h3>Feature Importance Analysis (SHAP)</h3>
      <p className="shap-description">
        Shows how each structural feature contributed to the predicted Young's Modulus.
        Dark bars increase the prediction, light bars decrease it.
      </p>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" label={{ value: 'SHAP Value (GPa)', position: 'insideBottom', offset: -5 }} />
          <YAxis type="category" dataKey="feature" width={110} />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine x={0} stroke="#666" strokeWidth={2} />
          <Bar dataKey="importance" radius={[0, 4, 4, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.importance > 0 ? '#4a4a4a' : '#8a8a8a'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="shap-legend">
        <div className="legend-item">
          <span className="legend-color positive"></span>
          <span>Increases prediction</span>
        </div>
        <div className="legend-item">
          <span className="legend-color negative"></span>
          <span>Decreases prediction</span>
        </div>
      </div>
    </div>
  );
};

export default ShapChart;
