
import React from 'react';

interface WelcomeScreenProps {
  onStartCall: () => void;
  isProcessing: boolean;
}

const WelcomeScreen = ({ onStartCall, isProcessing }: WelcomeScreenProps) => {
  return (
    <div className="text-center mt-32">
      <h1 className="text-3xl font-bold text-primary mb-8">
        Welcome to AI Coach
      </h1>
      <button
        onClick={onStartCall}
        className="bg-primary text-white px-8 py-3 rounded-lg hover:bg-primary/90 transition-colors"
        disabled={isProcessing}
      >
        {isProcessing ? "Starting..." : "Start Call"}
      </button>
    </div>
  );
};

export default WelcomeScreen;
