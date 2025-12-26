import React from 'react';
import type { MetricCardProps } from '../../types/admin';

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon, color, description }) => {
  return (
    <div className="bg-surface rounded-lg border border-gray-800 p-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 ${color}/20 rounded-lg`}>
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold text-white">{value}</p>
          <p className="text-xs text-gray-400">{title}</p>
          {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
        </div>
      </div>
    </div>
  );
};

export default MetricCard;