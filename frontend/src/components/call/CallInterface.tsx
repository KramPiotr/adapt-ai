
import React from 'react';
import CallTimer from '../CallTimer';
import AudioWaveform from '../AudioWaveform';
import CallControls from '../CallControls';
import Transcript from '../transcript/Transcript';
import CoachingStatus from '../CoachingStatus';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface CallInterfaceProps {
  startTime: number;
  isRecording: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  onEndCall: () => void;
  audioRef: React.RefObject<HTMLAudioElement>;
}

const CallInterface = ({
  startTime,
  isRecording,
  isMuted,
  onToggleMute,
  onEndCall,
  audioRef,
}: CallInterfaceProps) => {
  return (
    <>
      <CallTimer startTime={startTime} />
      <div className="bg-white rounded-2xl p-8 shadow-lg">
        <div className="text-center mb-8">
          <div className="w-24 h-24 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center">
            <div
              className={`w-16 h-16 bg-primary rounded-full ${
                isRecording ? "animate-pulse" : ""
              }`}
            />
          </div>
          <p className="text-lg text-primary">
            {isRecording ? "Listening..." : "Call Active"}
          </p>
        </div>

        <audio ref={audioRef} className="hidden" />
        <AudioWaveform isActive={isRecording} />
        <CallControls
          isMuted={isMuted}
          onToggleMute={onToggleMute}
          onEndCall={onEndCall}
        />

        <Tabs defaultValue="transcript" className="w-full mt-8">
          <TabsList className="grid grid-cols-2 bg-gray-800">
            <TabsTrigger value="transcript">Transcript</TabsTrigger>
            <TabsTrigger value="coaching-status">Coaching Status</TabsTrigger>
          </TabsList>

          <TabsContent value="transcript" className="mt-6">
            <Transcript />
          </TabsContent>

          <TabsContent value="coaching-status" className="mt-6">
            <CoachingStatus currentStage="systematic-assessment" />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default CallInterface;
