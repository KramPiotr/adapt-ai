
import React from 'react';
import { Mic, MicOff, PhoneOff } from 'lucide-react';

interface CallControlsProps {
  isMuted: boolean;
  onToggleMute: () => void;
  onEndCall: () => void;
}

const CallControls = ({ isMuted, onToggleMute, onEndCall }: CallControlsProps) => {
  return (
    <div className="flex justify-center gap-8 mt-8">
      <button
        onClick={onToggleMute}
        className={`p-4 rounded-full transition-colors ${
          isMuted ? 'bg-accent' : 'bg-primary'
        } text-white hover:opacity-90`}
      >
        {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
      </button>
      <button
        onClick={onEndCall}
        className="p-4 rounded-full bg-accent text-white hover:opacity-90 transition-colors"
      >
        <PhoneOff size={24} />
      </button>
    </div>
  );
};

export default CallControls;
