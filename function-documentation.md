# Function Definitions & Tool Catalog

## Overview
This document defines the core functions used by the background agent for memory and scene management in the MVP implementation. All functions are synchronous and use simple in-memory data structures.

## Type Definitions

```typescript
type EmotionalState = {
  primary: string;
  intensity: number;
  triggers: string[];
};

type UserContext = {
  name: string;
  mainGoal: string;
  lifeVision: string;
  currentReality: {
    situation: string;
    blockers: string[];
  };
  opportunities: string[];
  actionSteps: string[];
};

type SceneContext = {
  sceneId: string;
  emotionalState: EmotionalState;
  userContext: UserContext;
  timestamp: number;
};

type StructuredOutput = {
  insights: string[];
  actionItems: string[];
  progressMarkers: string[];
  recommendedScene?: string;
};

type STMData = {
  currentContext: SceneContext;
  recentMessages: string[];
  structuredOutput: StructuredOutput;
};

type LTMData = {
  historicalEmotionalStates: EmotionalState[];
  behavioralPatterns: string[];
  languagePatterns: string[];
  phaseContext: {
    goal: string;
    reality: string;
    opportunities: string;
    actions: string;
  };
};
```

## Core Functions

### 1. updateSTMFromTranscript

```typescript
function updateSTMFromTranscript(
  transcript: string, 
  sceneId: string
): void
```

**Purpose:**  
Updates short-term memory with new conversation content and context.

**Implementation Notes:**
- Maintains a rolling window of recent messages
- Updates emotional state based on latest transcript
- Simple in-memory updates, no persistence needed

**Example Usage:**
```typescript
updateSTMFromTranscript(
  "I'm feeling overwhelmed with all these tasks...",
  "G5-REALITY"
);
```

### 2. updateSTMFromLTM

```typescript
function updateSTMFromLTM(
  userId: string,
  sceneId: string
): void
```

**Purpose:**  
Retrieves relevant historical context from LTM and merges into current STM.

**Implementation Notes:**
- Simple mock LTM implementation
- Focuses on emotional patterns and phase context
- Updates STM with relevant historical insights

**Example Usage:**
```typescript
updateSTMFromLTM(
  "user123",
  "G5-OPPORTUNITY"
);
```

### 3. updateStructuredOutput

```typescript
function updateStructuredOutput(
  sceneId: string,
  newData: Partial<StructuredOutput>
): void
```

**Purpose:**  
Updates the structured data collected during the coaching session.

**Implementation Notes:**
- Simple merge of new data into existing structure
- No complex validation rules
- Maintains running lists of insights and actions

**Example Usage:**
```typescript
updateStructuredOutput("G5-ACTION", {
  insights: ["User shows increased clarity when discussing specific examples"],
  actionItems: ["Schedule team review meeting for next week"]
});
```

### 4. recommendNextBestScene

```typescript
type SceneRecommendation = {
  recommendedScene: string;  // ID of recommended scene
  shouldSwitch: boolean;     // true if should switch, false to stay in current scene
  confidence: number;        // confidence level in recommendation (0-1)
};

function recommendNextBestScene(
  currentContext: SceneContext
): SceneRecommendation
```

**Purpose:**  
Analyzes current context to determine whether to continue with the current scene or switch to a different scene.

**Implementation Notes:**
- Returns the recommended scene ID and whether a switch is needed
- Always returns a valid scene ID (either current or new)
- Uses simple pattern-based logic for recommendations
- Includes confidence level to support decision making

**Example Usage:**
```typescript
const recommendation = recommendNextBestScene({
  sceneId: "G5-REALITY",
  emotionalState: {
    primary: "confident",
    intensity: 0.8,
    triggers: ["clear insight", "ready for action"]
  },
  // ... other context
});

// Example response for staying in current scene
{
  recommendedScene: "G5-REALITY",
  shouldSwitch: false,
  confidence: 0.9
}

// Example response for switching scenes
{
  recommendedScene: "G5-OPPORTUNITY",
  shouldSwitch: true,
  confidence: 0.85
}

// If shouldSwitch is true, invoke switchScene
if (recommendation.shouldSwitch) {
  switchScene(recommendation.recommendedScene);
}

### 5. switchScene

```typescript
function switchScene(
  newSceneId: string
): void
```

**Purpose:**  
Handles the transition to a new scene.

**Implementation Notes:**
- Resets relevant portions of STM
- Maintains necessary context across scenes
- Updates scene-specific structured output

**Example Usage:**
```typescript
switchScene("G5-OPPORTUNITY");
```

## Function Call Flow

Standard operation sequence:
1. After each user message:
   ```typescript
   updateSTMFromTranscript(message, currentSceneId);
   ```

2. Before generating response:
   ```typescript
   updateSTMFromLTM(userId, currentSceneId);
   updateStructuredOutput(currentSceneId, newInsights);
   ```

3. Check for scene transition:
   ```typescript
   const nextScene = recommendNextBestScene(currentContext);
   if (nextScene) {
     switchScene(nextScene);
   }
   ```

## Memory Structure

### Short-Term Memory (STM)
In-memory structure containing:
- Current scene context
- Recent message history (last 5-10 messages)
- Active structured output
- Current emotional state

### Long-Term Memory (LTM) Mock
Simple structure containing:
- Historical emotional states
- Behavioral patterns
- Language patterns
- Context from each GROW phase

## Implementation Guidelines

1. Keep all functions synchronous for MVP
2. Use simple in-memory data structures
3. Focus on core functionality over error handling
4. Trust LLM judgment for edge cases
5. Maintain clean separation between memory and scene management
