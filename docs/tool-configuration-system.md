# Tool Configuration System Design

## Problem Statement

When teachers edit lesson prompts:
1. Tool call instructions may become weak or accidentally deleted
2. Teachers can't selectively choose which tools are available
3. No way to customize when tools should fire (trigger conditions)
4. All tools are always sent to Gemini regardless of lesson needs
5. Prompts may contain unnecessary tokens

## Solution Architecture

### Core Principle: **Separation of Concerns**

```
┌─────────────────────────────────────────────────────────────┐
│                    LESSON CONFIGURATION                      │
├─────────────────────────────────────────────────────────────┤
│  1. Conversation Prompt (free-form teacher content)         │
│  2. Tool Configuration (structured, UI-managed)             │
│  3. Trigger Templates (system-provided, teacher-selected)   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│               RUNTIME PROMPT BUILDER                         │
├─────────────────────────────────────────────────────────────┤
│  Assembles final prompt from:                               │
│  - Teacher's conversation prompt                            │
│  - Selected tool declarations (filtered)                    │
│  - Trigger instructions (from templates)                    │
│  - Token optimization applied                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. Data Schema Updates

### New: `ToolConfiguration` Type

```typescript
// src/types/toolConfig.ts

// Available tool identifiers
export type TutorToolId =
  | 'mark_for_review'      // Error tracking
  | 'update_user_profile'  // Preference learning
  | 'show_session_summary' // Session ending
  | 'mark_task_complete'   // Task tracking
  | 'mark_item_mastered'   // Review lessons only
  | 'play_student_audio';  // Review lessons only

// Trigger condition types
export type TriggerConditionType =
  | 'always'              // Tool always available
  | 'keyword'             // Fire when keywords mentioned
  | 'turn_count'          // Fire after X turns
  | 'time_remaining'      // Fire when X minutes left
  | 'task_context'        // Fire when discussing tasks
  | 'error_detected'      // Fire on linguistic errors
  | 'session_ending';     // Fire at session end

export interface TriggerCondition {
  type: TriggerConditionType;
  // Condition-specific parameters
  keywords?: string[];       // For 'keyword' type
  minTurns?: number;         // For 'turn_count' type
  minutesRemaining?: number; // For 'time_remaining' type
}

export interface ToolConfig {
  toolId: TutorToolId;
  enabled: boolean;
  triggerCondition: TriggerCondition;
  customInstructions?: string; // Optional override for this specific tool
}

export interface LessonToolConfiguration {
  tools: ToolConfig[];
  globalInstructions?: string; // General guidance for all tool usage
}

// Default configurations for common lesson types
export const TOOL_PRESETS: Record<string, LessonToolConfiguration> = {
  standard_lesson: {
    tools: [
      { toolId: 'mark_for_review', enabled: true, triggerCondition: { type: 'error_detected' } },
      { toolId: 'update_user_profile', enabled: true, triggerCondition: { type: 'always' } },
      { toolId: 'show_session_summary', enabled: true, triggerCondition: { type: 'session_ending' } },
      { toolId: 'mark_task_complete', enabled: true, triggerCondition: { type: 'task_context' } },
    ],
  },
  review_lesson: {
    tools: [
      { toolId: 'mark_for_review', enabled: true, triggerCondition: { type: 'error_detected' } },
      { toolId: 'mark_item_mastered', enabled: true, triggerCondition: { type: 'always' } },
      { toolId: 'play_student_audio', enabled: true, triggerCondition: { type: 'always' } },
      { toolId: 'show_session_summary', enabled: true, triggerCondition: { type: 'session_ending' } },
    ],
  },
  conversation_only: {
    tools: [
      { toolId: 'mark_for_review', enabled: true, triggerCondition: { type: 'error_detected' } },
      { toolId: 'show_session_summary', enabled: true, triggerCondition: { type: 'session_ending' } },
    ],
  },
  no_tracking: {
    tools: [], // Pure conversation, no tools
  },
};
```

### Updated `MissionDocument`

```typescript
// Update MissionDocument in src/types/firestore.ts

export interface MissionDocument {
  // ... existing fields ...

  // NEW: Structured tool configuration
  toolConfiguration: LessonToolConfiguration;

  // REMOVED - delete these fields:
  // functionCallingEnabled?: boolean;      // DELETE
  // functionCallingInstructions?: string;  // DELETE
}
```

**Clean break**: Remove old fields entirely. Existing lessons get default config on first edit.

---

## 2. System Trigger Templates

Store standardized instructions per trigger type that get injected at runtime:

```typescript
// src/lib/toolTriggerTemplates.ts

export const TRIGGER_TEMPLATES: Record<TriggerConditionType, string> = {
  always: '', // No special instructions needed

  error_detected: `Call this function SILENTLY when the student makes any linguistic error:
- Grammar (wrong tense, conjugation, word order)
- Pronunciation (incorrect sounds, stress)
- Vocabulary (wrong word, false friend)
- Cultural (inappropriate formality)
Do NOT interrupt conversation flow. Log errors in the background.`,

  session_ending: `Call this function ONLY when:
- The session timer expires
- The student explicitly says goodbye/ends the conversation
- You've naturally wrapped up the practice objectives
Do NOT call this mid-conversation.`,

  task_context: `Call this function when the student SUCCESSFULLY accomplishes a lesson objective:
- Wait for clear completion, not partial attempts
- Match against the task IDs provided in context
- Only mark once per task`,

  keyword: `Call this function when the student mentions these topics: {{keywords}}.`,

  turn_count: `Call this function after at least {{minTurns}} conversation turns have passed.`,

  time_remaining: `Call this function when approximately {{minutesRemaining}} minutes remain in the session.`,
};

// Interpolate template with config values
export function buildTriggerInstruction(
  condition: TriggerCondition
): string {
  let template = TRIGGER_TEMPLATES[condition.type];

  if (condition.keywords) {
    template = template.replace('{{keywords}}', condition.keywords.join(', '));
  }
  if (condition.minTurns) {
    template = template.replace('{{minTurns}}', String(condition.minTurns));
  }
  if (condition.minutesRemaining) {
    template = template.replace('{{minutesRemaining}}', String(condition.minutesRemaining));
  }

  return template;
}
```

---

## 3. Runtime Prompt Builder

Assembles the final system prompt from separate concerns:

```typescript
// src/lib/promptBuilder.ts

import { TUTOR_FUNCTION_DECLARATIONS, FunctionDeclaration } from '@/types/functions';
import { LessonToolConfiguration, ToolConfig } from '@/types/toolConfig';
import { buildTriggerInstruction } from './toolTriggerTemplates';
import { optimizePromptTokens } from './tokenOptimizer';

interface PromptBuildResult {
  systemPrompt: string;
  functionDeclarations: FunctionDeclaration[];
  estimatedTokens: number;
}

interface BuildPromptOptions {
  conversationPrompt: string;    // Teacher's custom content
  toolConfiguration: LessonToolConfiguration;
  tasks?: Array<{ id: string; text: string }>;
  durationMinutes?: number;
  targetLevel?: string;
  optimizeTokens?: boolean;      // Default: true
}

export function buildLessonPrompt(options: BuildPromptOptions): PromptBuildResult {
  const {
    conversationPrompt,
    toolConfiguration,
    tasks,
    durationMinutes,
    targetLevel,
    optimizeTokens = true,
  } = options;

  // 1. Filter enabled tools
  const enabledTools = toolConfiguration.tools.filter(t => t.enabled);

  // 2. Get matching function declarations
  const functionDeclarations = TUTOR_FUNCTION_DECLARATIONS.filter(
    decl => enabledTools.some(t => t.toolId === decl.name)
  );

  // 3. Build tool instructions section
  const toolInstructions = buildToolInstructions(enabledTools, toolConfiguration.globalInstructions);

  // 4. Build task context if present
  const taskContext = tasks?.length
    ? buildTaskContext(tasks)
    : '';

  // 5. Assemble final prompt
  let systemPrompt = assemblePrompt({
    conversationPrompt,
    toolInstructions,
    taskContext,
    durationMinutes,
    targetLevel,
  });

  // 6. Optimize tokens if requested
  if (optimizeTokens) {
    systemPrompt = optimizePromptTokens(systemPrompt);
  }

  return {
    systemPrompt,
    functionDeclarations,
    estimatedTokens: estimateTokenCount(systemPrompt),
  };
}

function buildToolInstructions(
  tools: ToolConfig[],
  globalInstructions?: string
): string {
  if (tools.length === 0) return '';

  const parts: string[] = [];

  if (globalInstructions) {
    parts.push(globalInstructions);
  }

  parts.push('You have access to these functions:\n');

  for (const tool of tools) {
    const triggerText = buildTriggerInstruction(tool.triggerCondition);
    const customText = tool.customInstructions || '';

    parts.push(`**${tool.toolId}**: ${triggerText} ${customText}`.trim());
  }

  return parts.join('\n\n');
}

function buildTaskContext(tasks: Array<{ id: string; text: string }>): string {
  return `
## Lesson Objectives
The student should accomplish these tasks during the session:
${tasks.map(t => `- ${t.id}: ${t.text}`).join('\n')}

When a task is clearly completed, call mark_task_complete with the task ID.`;
}

function assemblePrompt(parts: {
  conversationPrompt: string;
  toolInstructions: string;
  taskContext: string;
  durationMinutes?: number;
  targetLevel?: string;
}): string {
  const sections: string[] = [];

  // Main conversation context
  sections.push(parts.conversationPrompt);

  // Session metadata
  if (parts.durationMinutes || parts.targetLevel) {
    sections.push(`
## Session Parameters
${parts.durationMinutes ? `- Duration: ${parts.durationMinutes} minutes` : ''}
${parts.targetLevel ? `- Student Level: ${parts.targetLevel}` : ''}`);
  }

  // Task context
  if (parts.taskContext) {
    sections.push(parts.taskContext);
  }

  // Tool instructions (always at end for clear separation)
  if (parts.toolInstructions) {
    sections.push(`
## Available Functions
${parts.toolInstructions}`);
  }

  return sections.filter(Boolean).join('\n\n');
}

function estimateTokenCount(text: string): number {
  // Rough estimation: ~4 chars per token for English
  return Math.ceil(text.length / 4);
}
```

---

## 4. Token Optimization Utilities

Standard practices for reducing prompt tokens:

```typescript
// src/lib/tokenOptimizer.ts

/**
 * Token Optimization Strategy:
 *
 * DO optimize:
 * - Remove redundant whitespace (multiple spaces/newlines)
 * - Remove trailing spaces
 * - Combine short consecutive lines
 * - Remove empty markdown headers
 *
 * DON'T optimize:
 * - Single newlines (preserve paragraph structure)
 * - Indentation (models understand structure)
 * - Content words (semantic meaning matters)
 * - Punctuation (affects interpretation)
 */

export function optimizePromptTokens(prompt: string): string {
  let optimized = prompt;

  // 1. Normalize line endings
  optimized = optimized.replace(/\r\n/g, '\n');

  // 2. Remove trailing whitespace from lines
  optimized = optimized.replace(/[ \t]+$/gm, '');

  // 3. Collapse multiple blank lines to single
  optimized = optimized.replace(/\n{3,}/g, '\n\n');

  // 4. Remove multiple spaces (keep single)
  optimized = optimized.replace(/  +/g, ' ');

  // 5. Remove empty headers (## \n)
  optimized = optimized.replace(/^#+\s*$/gm, '');

  // 6. Trim start/end whitespace
  optimized = optimized.trim();

  return optimized;
}

/**
 * Advanced optimization for very large prompts
 * Only use when hitting token limits
 */
export function aggressiveTokenOptimization(prompt: string): string {
  let optimized = optimizePromptTokens(prompt);

  // Remove markdown formatting (headers become plain text)
  optimized = optimized.replace(/^#+\s+/gm, '');

  // Remove bullet point formatting
  optimized = optimized.replace(/^\s*[-*]\s+/gm, '• ');

  // Shorten common phrases
  const shortenings: [RegExp, string][] = [
    [/Do NOT/gi, "Don't"],
    [/should not/gi, "shouldn't"],
    [/will not/gi, "won't"],
    [/for example/gi, 'e.g.'],
    [/such as/gi, 'like'],
  ];

  for (const [pattern, replacement] of shortenings) {
    optimized = optimized.replace(pattern, replacement);
  }

  return optimized;
}

/**
 * Estimate token count for a string
 * More accurate than character-based for mixed content
 */
export function estimateTokens(text: string): number {
  // GPT/Claude tokenization rules (approximate):
  // - Common words: 1 token
  // - Spaces usually merge with following word
  // - Punctuation: often separate tokens
  // - Numbers: 1-3 digits per token

  const words = text.split(/\s+/).length;
  const punctuation = (text.match(/[.,!?;:'"()[\]{}]/g) || []).length;

  // Rough formula: words + 30% for punctuation/special chars
  return Math.ceil(words * 1.3 + punctuation * 0.5);
}

/**
 * Compare original vs optimized prompt
 */
export function getOptimizationStats(original: string, optimized: string) {
  const originalTokens = estimateTokens(original);
  const optimizedTokens = estimateTokens(optimized);
  const savedTokens = originalTokens - optimizedTokens;
  const savingsPercent = ((savedTokens / originalTokens) * 100).toFixed(1);

  return {
    originalTokens,
    optimizedTokens,
    savedTokens,
    savingsPercent: `${savingsPercent}%`,
    originalChars: original.length,
    optimizedChars: optimized.length,
  };
}
```

---

## 5. UI Component: Tool Configuration Panel

### Component Design

```tsx
// src/components/dashboard/LessonFormModal/ToolConfigPanel.tsx

interface ToolConfigPanelProps {
  configuration: LessonToolConfiguration;
  onChange: (config: LessonToolConfiguration) => void;
  presetType?: 'standard_lesson' | 'review_lesson' | 'conversation_only' | 'no_tracking';
}

/**
 * UI Layout:
 *
 * ┌──────────────────────────────────────────────────────────┐
 * │ Tool Configuration                              [Preset ▼]│
 * ├──────────────────────────────────────────────────────────┤
 * │                                                          │
 * │ ☑ Error Tracking (mark_for_review)                       │
 * │   └─ Trigger: [On linguistic errors ▼]                   │
 * │                                                          │
 * │ ☑ Profile Learning (update_user_profile)                 │
 * │   └─ Trigger: [Always available ▼]                       │
 * │                                                          │
 * │ ☑ Session Summary (show_session_summary)                 │
 * │   └─ Trigger: [At session end ▼]                         │
 * │                                                          │
 * │ ☑ Task Completion (mark_task_complete)                   │
 * │   └─ Trigger: [When discussing tasks ▼]                  │
 * │                                                          │
 * │ ☐ Audio Playback (play_student_audio)                    │
 * │   └─ Review lessons only                                 │
 * │                                                          │
 * │ ☐ Mastery Marking (mark_item_mastered)                   │
 * │   └─ Review lessons only                                 │
 * │                                                          │
 * ├──────────────────────────────────────────────────────────┤
 * │ Estimated tokens: ~120 │ Tools enabled: 4/6              │
 * └──────────────────────────────────────────────────────────┘
 */
```

### Tool Display Metadata

```typescript
// src/lib/toolMetadata.ts

export const TOOL_DISPLAY_INFO: Record<TutorToolId, {
  name: string;
  description: string;
  icon: string; // Lucide icon name
  category: 'core' | 'review' | 'optional';
  defaultEnabled: boolean;
  availableTriggers: TriggerConditionType[];
}> = {
  mark_for_review: {
    name: 'Error Tracking',
    description: 'Silently log linguistic errors for later review',
    icon: 'AlertCircle',
    category: 'core',
    defaultEnabled: true,
    availableTriggers: ['always', 'error_detected'],
  },
  update_user_profile: {
    name: 'Profile Learning',
    description: 'Learn student preferences and interests',
    icon: 'User',
    category: 'core',
    defaultEnabled: true,
    availableTriggers: ['always'],
  },
  show_session_summary: {
    name: 'Session Summary',
    description: 'Display performance summary at session end',
    icon: 'BarChart',
    category: 'core',
    defaultEnabled: true,
    availableTriggers: ['session_ending', 'time_remaining'],
  },
  mark_task_complete: {
    name: 'Task Completion',
    description: 'Track lesson objective completion',
    icon: 'CheckSquare',
    category: 'core',
    defaultEnabled: true,
    availableTriggers: ['task_context', 'always'],
  },
  mark_item_mastered: {
    name: 'Mastery Marking',
    description: 'Mark review items as mastered',
    icon: 'Award',
    category: 'review',
    defaultEnabled: false,
    availableTriggers: ['always'],
  },
  play_student_audio: {
    name: 'Audio Playback',
    description: 'Play student error recordings',
    icon: 'Play',
    category: 'review',
    defaultEnabled: false,
    availableTriggers: ['always', 'keyword'],
  },
};
```

---

## 6. Integration with Gemini Client

Update the client to use filtered tools:

```typescript
// In src/services/geminiDirectClient.ts

import { buildLessonPrompt } from '@/lib/promptBuilder';

class GeminiDirectClient {
  async connect(): Promise<void> {
    // Build prompt with filtered tools
    const { systemPrompt, functionDeclarations } = buildLessonPrompt({
      conversationPrompt: this.config.systemPrompt,
      toolConfiguration: this.config.toolConfiguration || getDefaultToolConfig(),
      tasks: this.config.tasks,
      durationMinutes: this.config.durationMinutes,
      targetLevel: this.config.level,
    });

    const liveConfig = {
      systemInstruction: systemPrompt,
      // Only include selected tools!
      tools: functionDeclarations.length > 0
        ? functionDeclarations
        : undefined,
      // ... other config
    };

    this.session = await this.client.live.connect({
      model: 'gemini-2.0-flash-exp',
      config: liveConfig,
      callbacks: { /* ... */ },
    });
  }
}
```

---

## 7. Smart Auto-Enabling

Tools automatically enable based on lesson configuration:

```typescript
// src/lib/toolAutoConfig.ts

/**
 * Automatically adjusts tool configuration based on lesson content
 * Called whenever lesson form data changes
 */
export function applySmartDefaults(
  config: LessonToolConfiguration,
  lessonContext: {
    hasTasks: boolean;
    isReviewLesson: boolean;
    durationMinutes?: number;
  }
): LessonToolConfiguration {
  const tools = [...config.tools];

  // AUTO-ENABLE: mark_task_complete when lesson has tasks
  if (lessonContext.hasTasks) {
    const taskTool = tools.find(t => t.toolId === 'mark_task_complete');
    if (taskTool) {
      taskTool.enabled = true;
    } else {
      tools.push({
        toolId: 'mark_task_complete',
        enabled: true,
        triggerCondition: { type: 'task_context' },
      });
    }
  }

  // AUTO-ENABLE: review tools for review lessons
  if (lessonContext.isReviewLesson) {
    const reviewTools: TutorToolId[] = ['mark_item_mastered', 'play_student_audio'];
    for (const toolId of reviewTools) {
      if (!tools.find(t => t.toolId === toolId)) {
        tools.push({
          toolId,
          enabled: true,
          triggerCondition: { type: 'always' },
        });
      }
    }
  }

  // AUTO-ENABLE: show_session_summary always (can be disabled manually)
  const summaryTool = tools.find(t => t.toolId === 'show_session_summary');
  if (!summaryTool) {
    tools.push({
      toolId: 'show_session_summary',
      enabled: true,
      triggerCondition: { type: 'session_ending' },
    });
  }

  return { ...config, tools };
}
```

### UI Behavior

When teacher adds tasks in the form:
1. `mark_task_complete` checkbox automatically checks ✓
2. Shows toast: "Task tracking enabled automatically"
3. Teacher can still uncheck if they don't want it

---

## 8. Teacher Trigger Customization

**Yes, teachers CAN customize when each tool fires.**

### Trigger Editor UI

Each enabled tool has a trigger dropdown with options:

```
┌─────────────────────────────────────────────────────────────┐
│ ☑ Error Tracking (mark_for_review)                          │
│   ├─ When to call: [On linguistic errors ▼]                 │
│   │                 ┌─────────────────────┐                 │
│   │                 │ ○ Always available  │                 │
│   │                 │ ● On linguistic errors │ ← default    │
│   │                 │ ○ After X turns     │                 │
│   │                 │ ○ Custom keywords   │                 │
│   │                 └─────────────────────┘                 │
│   │                                                         │
│   └─ Custom instruction (optional):                         │
│      [                                                    ] │
│      "Only log errors severity 5+ for this beginner lesson" │
└─────────────────────────────────────────────────────────────┘
```

### Available Trigger Options Per Tool

| Tool | Available Triggers | Default |
|------|-------------------|---------|
| `mark_for_review` | always, error_detected, keyword | error_detected |
| `update_user_profile` | always, turn_count, keyword | always |
| `show_session_summary` | session_ending, time_remaining | session_ending |
| `mark_task_complete` | task_context, always, keyword | task_context |
| `mark_item_mastered` | always, keyword | always |
| `play_student_audio` | always, keyword | always |

### Custom Trigger: Keywords

When teacher selects "Custom keywords" trigger:

```
┌─────────────────────────────────────────────────────────────┐
│ ☑ Profile Learning (update_user_profile)                    │
│   ├─ When to call: [Custom keywords ▼]                      │
│   │                                                         │
│   └─ Keywords that trigger this tool:                       │
│      [hobby] [favorite] [like] [enjoy] [+Add]               │
│                                                             │
│      AI will call this when student mentions these words    │
└─────────────────────────────────────────────────────────────┘
```

### Custom Trigger: Time-based

```
┌─────────────────────────────────────────────────────────────┐
│ ☑ Session Summary (show_session_summary)                    │
│   ├─ When to call: [Time remaining ▼]                       │
│   │                                                         │
│   └─ Call when minutes remaining: [2] ▼                     │
│      Options: 1, 2, 3, 5 minutes                            │
└─────────────────────────────────────────────────────────────┘
```

### Custom Instructions Field

Teachers can add specific guidance per tool:

```typescript
interface ToolConfig {
  toolId: TutorToolId;
  enabled: boolean;
  triggerCondition: TriggerCondition;
  customInstructions?: string; // Teacher's specific guidance
}

// Example custom instructions:
// mark_for_review: "Focus on verb conjugation errors, ignore minor pronunciation"
// show_session_summary: "Be extra encouraging, this is a nervous student"
// mark_task_complete: "Only mark task-2 if they use formal register"
```

---

## Summary: Benefits

| Problem | Solution |
|---------|----------|
| Tools lost when editing prompt | Tools stored separately in `toolConfiguration` |
| Can't select specific tools | UI checkboxes per tool with presets |
| Can't customize triggers | Dropdown per tool + custom instructions field |
| All tools always sent | Runtime filtering - only selected tools sent to Gemini |
| Token waste | `optimizePromptTokens` removes redundancy |
| Tasks added but tool forgotten | Auto-enable `mark_task_complete` when tasks exist |

## Teacher Control Summary

**What teachers CAN customize:**

1. **Which tools are enabled** - checkboxes per tool
2. **When each tool fires** - trigger condition dropdown
3. **Custom keywords** - for keyword-based triggers
4. **Time thresholds** - for time-based triggers
5. **Per-tool instructions** - custom guidance text field

**What's automatic (smart defaults):**

1. Adding tasks → auto-enables `mark_task_complete`
2. Review lessons → auto-enables review-specific tools
3. Session summary → enabled by default (can disable)
4. Default presets → one-click configurations

## Implementation Priority

1. **Phase 1**: Types + prompt builder + token optimizer
2. **Phase 2**: Tool config UI panel in lesson form
3. **Phase 3**: Trigger dropdown + custom instructions
4. **Phase 4**: Smart auto-enabling + presets
