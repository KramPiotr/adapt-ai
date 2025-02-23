
import React from 'react';

interface AudioWaveformProps {
  isActive?: boolean;
}

const AudioWaveform = ({ isActive = true }: AudioWaveformProps) => {
  return (
    <div className="flex items-center justify-center gap-1 h-16">
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className={`w-1 bg-primary/60 rounded-full ${isActive ? 'animate-wave' : ''}`}
          style={{
            height: `${Math.random() * 100}%`,
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
    </div>
  );
};

export default AudioWaveform;
