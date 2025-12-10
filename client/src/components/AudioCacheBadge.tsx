// ===========================
// Audio Cache Source Badge
// Reusable component for showing cache vs API indicator
// ===========================

import React from 'react';
import { Package, Radio } from 'lucide-react';

interface AudioCacheBadgeProps {
  source: 'cache' | 'elevenlabs';
  cacheKey?: string;
  timestamp?: string;
  size?: 'sm' | 'md';
  showTooltip?: boolean;
}

export const AudioCacheBadge: React.FC<AudioCacheBadgeProps> = ({
  source,
  cacheKey,
  timestamp,
  size = 'sm',
  showTooltip = true,
}) => {
  const isCache = source === 'cache';
  const iconSize = size === 'sm' ? 14 : 16;
  
  const badge = (
    <div
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
        isCache
          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
          : 'bg-green-500/20 text-green-300 border border-green-500/30'
      }`}
      title={showTooltip ? `${isCache ? 'Cached' : 'ElevenLabs'}\n${cacheKey || ''}\n${timestamp || ''}` : undefined}
    >
      {isCache ? (
        <>
          <Package size={iconSize} />
          <span>Cached</span>
        </>
      ) : (
        <>
          <Radio size={iconSize} />
          <span>Live</span>
        </>
      )}
    </div>
  );

  return badge;
};

export default AudioCacheBadge;
