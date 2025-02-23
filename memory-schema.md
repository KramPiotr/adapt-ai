# Memory & Context Schema Specification

## Overview
This document defines the memory structures used in the coaching system MVP. The implementation uses simple in-memory storage for STM and a mock implementation for LTM.

## Short-Term Memory (STM)

### Schema Definition
```typescript
interface STM {
  // Basic session context
  sessionId: string;
  currentSceneId: string;
  timestamp: number;

  // Recent conversation context
  recentMessages: {
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
  }[];

  // Current user state
  userState: {
    name: string;
    mainGoal: string;
    emotionalState: {
      primary: string;
      intensity: number;  // 0-1
      triggers: string[];
      timestamp: number;
    };
  };

  // GROW framework context
  coachingContext: {
    lifeVision: string;
    currentReality: {
      situation: string;
      blockers: string[];
    };
    opportunities: string[];
    actionSteps: string[];
  };

  // Scene-specific data
  sceneContext: {
    insights: string[];
    progress: string[];
    nextSteps: string[];
  };
}
```

### Retention Policy
```typescript
const STMConfig = {
  maxMessages: 10,           // Keep last 10 messages
  messageExpiry: 300000,     // 5 minutes in milliseconds
  updateFrequency: 'perMessage',
  requireFields: [
    'sessionId',
    'currentSceneId',
    'userState.emotionalState'
  ]
};
```

### Usage Example
```typescript
const currentSTM: STM = {
  sessionId: "sess_123",
  currentSceneId: "G5-REALITY",
  timestamp: Date.now(),
  recentMessages: [
    {
      role: 'user',
      content: "I'm feeling overwhelmed with my current workload",
      timestamp: Date.now()
    }
  ],
  userState: {
    name: "Alex",
    mainGoal: "Improve work-life balance",
    emotionalState: {
      primary: "overwhelmed",
      intensity: 0.8,
      triggers: ["workload", "time management"],
      timestamp: Date.now()
    }
  },
  coachingContext: {
    lifeVision: "Build a sustainable business while maintaining health",
    currentReality: {
      situation: "Working 60+ hours per week",
      blockers: ["Too many meetings", "No delegation system"]
    },
    opportunities: ["Hire an assistant", "Implement time-blocking"],
    actionSteps: []
  },
  sceneContext: {
    insights: ["Time management is the core issue"],
    progress: ["Identified key blockers"],
    nextSteps: []
  }
};
```

## Long-Term Memory (LTM)

### Schema Definition
```typescript
interface LTM {
  // User profile
  userProfile: {
    userId: string;
    name: string;
    coachingHistory: {
      sessionCount: number;
      firstSessionDate: number;
      lastSessionDate: number;
    };
  };

  // Historical patterns
  patterns: {
    emotional: {
      state: string;
      frequency: number;  // 0-1
      commonTriggers: string[];
    }[];
    behavioral: {
      pattern: string;
      frequency: number;  // 0-1
      contexts: string[];
    }[];
    language: {
      pattern: string;
      examples: string[];
      frequency: number;  // 0-1
    }[];
  };

  // GROW framework history
  growHistory: {
    goals: {
      goal: string;
      dateSet: number;
      status: 'active' | 'achieved' | 'abandoned';
    }[];
    realitySnapshots: {
      situation: string;
      date: number;
      keyBlockers: string[];
    }[];
    pastActions: {
      action: string;
      date: number;
      outcome: string;
    }[];
  };
}
```

### Mock Implementation Notes
- LTM is implemented as a simple in-memory object for the MVP
- No actual persistence mechanism in the hackathon version
- Focus on maintaining essential historical patterns and context

### Usage Example
```typescript
const mockLTM: LTM = {
  userProfile: {
    userId: "user_123",
    name: "Alex",
    coachingHistory: {
      sessionCount: 3,
      firstSessionDate: Date.now() - 7 * 24 * 60 * 60 * 1000,  // 7 days ago
      lastSessionDate: Date.now()
    }
  },
  patterns: {
    emotional: [{
      state: "overwhelmed",
      frequency: 0.7,
      commonTriggers: ["work pressure", "time management"]
    }],
    behavioral: [{
      pattern: "perfectionism",
      frequency: 0.6,
      contexts: ["project planning", "delegation"]
    }],
    language: [{
      pattern: "should statements",
      examples: ["I should be better at this", "I should work harder"],
      frequency: 0.4
    }]
  },
  growHistory: {
    goals: [{
      goal: "Improve work-life balance",
      dateSet: Date.now() - 7 * 24 * 60 * 60 * 1000,
      status: 'active'
    }],
    realitySnapshots: [{
      situation: "Working long hours, feeling stressed",
      date: Date.now() - 7 * 24 * 60 * 60 * 1000,
      keyBlockers: ["Poor time management", "Difficulty delegating"]
    }],
    pastActions: [{
      action: "Start using a calendar blocking system",
      date: Date.now() - 3 * 24 * 60 * 60 * 1000,
      outcome: "Partial implementation, some improvement"
    }]
  }
};
```

## Memory Integration Guidelines

### STM Updates
1. Update after each message
2. Maintain rolling window of recent messages
3. Track emotional state changes
4. Update scene-specific progress markers

### LTM Access
1. Access at scene transitions
2. Pull relevant historical patterns
3. Update pattern frequencies
4. Store significant insights and breakthroughs

### Implementation Priority
1. Focus on STM functionality first
2. Implement basic LTM pattern tracking
3. Add historical context integration last
