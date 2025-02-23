import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface StatusCircleProps {
  id: string;
  label: string;
  isActive?: boolean;
}

const StatusCircle = ({ id, label, isActive = false }: StatusCircleProps) => (
  <div className="flex flex-col items-center gap-2 mb-4">
    <div
      className={`w-24 h-24 rounded-full flex items-center justify-center text-xs text-center p-2 transition-colors ${
        isActive
          ? "bg-primary text-white"
          : "bg-gray-800 text-gray-400 border border-gray-700"
      }`}
    >
      <div>
        <div className="text-xs font-medium">{id}</div>
        {label}
      </div>
    </div>
  </div>
);

interface CoachingStatusProps {
  currentStage: string;
}

const CoachingStatus = ({ currentStage }: CoachingStatusProps) => {
  return (
    <div className="bg-background p-6 rounded-lg">
      <h2 className="text-xl mb-4 text-left">
        Scene Transition & Coach Behavior
      </h2>
      <p className="text-gray-400 mb-8 text-sm text-left">
        {currentStage === "systematic-assessment"
          ? "Once calmer, the coachee is ready for structured exploration. The coach shifts to a steady, methodical voice in R1: 'Systematic-Assessment Reality' to map the situation clearly."
          : "Analyzing the current situation and planning next steps."}
      </p>

      <div className="grid grid-cols-4 gap-4">
        <div>
          <h3 className="text-lg mb-2">GOAL</h3>
          <StatusCircle id="G1" label="Direct-Structured" />
          <StatusCircle id="G2" label="Values-Deep-Dive" />
          <StatusCircle id="G3" label="Strategic-Analytical" />
          <StatusCircle id="G4" label="Expansive-Creative" />
          <StatusCircle id="G5" label="Stabilization" />
        </div>

        <div>
          <h3 className="text-lg mb-2">REALITY</h3>
          <StatusCircle
            id="R1"
            label="Systematic-Assessment"
            isActive={currentStage === "systematic-assessment"}
          />
          <StatusCircle id="R2" label="Emotional-Landscape" />
          <StatusCircle id="R3" label="Systems-Thinking" />
          <StatusCircle id="R4" label="Resource-Mapping" />
          <StatusCircle id="R5" label="Pattern-Recognition" />
          <StatusCircle id="R6" label="Direct-Investigation" />
        </div>

        <div>
          <h3 className="text-lg mb-2">OPPORTUNITY</h3>
          <StatusCircle id="O1" label="Creative-Generative" />
          <StatusCircle id="O2" label="Strategic-Analytical" />
          <StatusCircle id="O3" label="Resource-Activation" />
          <StatusCircle id="O4" label="Learning-Development" />
          <StatusCircle id="O5" label="Solution-Engineering" />
          <StatusCircle id="O6" label="Confidence-Building" />
        </div>

        <div>
          <h3 className="text-lg mb-2">WAY FORWARD</h3>
          <StatusCircle id="W1" label="Action-Planning" />
          <StatusCircle id="W2" label="Commitment-Building" />
          <StatusCircle id="W3" label="Support-Structure" />
          <StatusCircle id="W4" label="Integration-Focused" />
        </div>
      </div>
    </div>
  );
};

export default CoachingStatus;
