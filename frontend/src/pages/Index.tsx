import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import LoadingSpinner from "@/components/LoadingSpinner";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAudioHandler } from "@/hooks/useAudioHandler";
import CallInterface from "@/components/call/CallInterface";
import WelcomeScreen from "@/components/call/WelcomeScreen";

const Index = () => {
  const [isMuted, setIsMuted] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [startTime, setStartTime] = useState(Date.now());
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentSession, setCurrentSession] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  const {
    transcript,
    aiResponses,
    isRecording,
    audioRef,
    startRecording,
    stopRecording,
    setTranscript,
    setAiResponses,
  } = useAudioHandler();

  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, [user, navigate]);

  const handleToggleMute = () => {
    setIsMuted(!isMuted);
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
    }
  };

  const testTextToSpeech = async () => {
    try {
      setIsProcessing(true);
      console.log("Testing text-to-speech...");
      const { data, error } = await supabase.functions.invoke(
        "text-to-speech",
        {
          body: { text: "Hello! I'm your AI Coach. How can I help you today?" },
        }
      );

      if (error) {
        throw error;
      }

      if (data?.audioContent) {
        const audioBlob = new Blob(
          [Uint8Array.from(atob(data.audioContent), (c) => c.charCodeAt(0))],
          { type: "audio/mpeg" }
        );
        const audioUrl = URL.createObjectURL(audioBlob);

        if (audioRef.current) {
          audioRef.current.src = audioUrl;
          await audioRef.current.play();
        }

        setAiResponses((prev) => [
          ...prev,
          "Hello! I'm your AI Coach. How can I help you today?",
        ]);
      }
    } catch (error) {
      console.error("Error in text-to-speech:", error);
      toast.error("Failed to generate speech");
    } finally {
      setIsProcessing(false);
    }
  };

  const startCall = async () => {
    if (!user) {
      toast.error("Please sign in to start a call");
      return;
    }

    try {
      console.log("Starting new session...");
      const { data, error } = await supabase
        .from("sessions")
        .insert([{ user_id: user.id }])
        .select("id")
        .single();

      if (error) throw error;

      console.log("Session created:", data.id);
      setCurrentSession(data.id);
      setIsCallActive(true);
      setStartTime(Date.now());
      setTranscript([]);
      setAiResponses([]);
      await startRecording(data.id, data.id);
      await testTextToSpeech();
    } catch (error) {
      console.error("Error starting session:", error);
      toast.error("Failed to start session");
    }
  };

  const handleEndCall = async () => {
    console.log("Ending call...");
    stopRecording();

    if (currentSession) {
      try {
        const { error } = await supabase
          .from("sessions")
          .update({
            ended_at: new Date().toISOString(),
            transcript: transcript.join("\n"),
            ai_responses: aiResponses,
          })
          .eq("id", currentSession);

        if (error) throw error;

        console.log("Session saved successfully");
        toast.success("Session saved successfully");
      } catch (error) {
        console.error("Error ending session:", error);
        toast.error("Failed to save session");
      }
    }

    setIsCallActive(false);
    setCurrentSession(null);
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading AI Coach..." />;
  }

  return (
    <div className="max-w-2xl mx-auto">
      {!isCallActive ? (
        <WelcomeScreen onStartCall={startCall} isProcessing={isProcessing} />
      ) : (
        <CallInterface
          startTime={startTime}
          isRecording={isRecording}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onEndCall={handleEndCall}
          audioRef={audioRef}
        />
      )}
    </div>
  );
};

export default Index;
