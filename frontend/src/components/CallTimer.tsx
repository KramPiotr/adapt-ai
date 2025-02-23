
import React, { useState, useEffect } from 'react';

interface CallTimerProps {
  startTime: number;
}

const CallTimer = ({ startTime }: CallTimerProps) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="text-center mb-8">
      <h2 className="text-xl font-semibold text-primary">Call in Progress - {formatTime(elapsed)}</h2>
    </div>
  );
};

export default CallTimer;
