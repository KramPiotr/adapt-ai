
import { useState, useEffect, useRef } from 'react';

interface AudioCaptureOptions {
  onAudioData: (audioData: Blob) => void;
  silenceThreshold?: number;
  onSilence?: () => void;
}

export const useAudioCapture = ({ 
  onAudioData, 
  silenceThreshold = 1500,
  onSilence
}: AudioCaptureOptions) => {
  const [isRecording, setIsRecording] = useState(false);
  const audioContext = useRef<AudioContext | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const silenceTimer = useRef<number | null>(null);
  const stream = useRef<MediaStream | null>(null);

  const startRecording = async () => {
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000
        }
      });

      audioContext.current = new AudioContext({
        sampleRate: 16000
      });

      mediaRecorder.current = new MediaRecorder(stream.current, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.current.push(event.data);
          
          // Reset silence timer
          if (silenceTimer.current) {
            window.clearTimeout(silenceTimer.current);
          }
          
          silenceTimer.current = window.setTimeout(() => {
            if (audioChunks.current.length > 0) {
              const audioBlob = new Blob(audioChunks.current, { 
                type: 'audio/webm;codecs=opus' 
              });
              onAudioData(audioBlob);
              audioChunks.current = [];
              onSilence?.();
            }
          }, silenceThreshold);
        }
      };

      mediaRecorder.current.start(100); // Capture in 100ms chunks
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      throw error;
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current?.state === 'recording') {
      mediaRecorder.current.stop();
    }
    
    if (silenceTimer.current) {
      window.clearTimeout(silenceTimer.current);
    }

    if (stream.current) {
      stream.current.getTracks().forEach(track => track.stop());
    }

    if (audioContext.current) {
      audioContext.current.close();
    }

    setIsRecording(false);
    audioChunks.current = [];
  };

  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, []);

  return {
    isRecording,
    startRecording,
    stopRecording
  };
};
