import { action, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";

// Build personalized system prompt based on user profile
function buildMentorPrompt(
  profile: {
    challenges?: string[];
    motivationStyle?: string;
    personalContext?: string;
    bigPictureGoal?: string;
  } | null,
): string {
  // Base rules
  let prompt = `You are Sentinel, a productivity coach. Your job is to analyze what the user accomplished in their work session and give brief, direct feedback.

RULES:
1. Be extremely concise - max 2-3 sentences
2. Be honest but not cruel
3. If they accomplished something meaningful, acknowledge it briefly and push them forward
4. If they admit to procrastination/distraction, call it out but redirect positively
5. If they're vague, ask for specifics next time
6. Always end with a forward-looking action or encouragement
`;

  // Customize tone based on motivation style
  if (profile?.motivationStyle === "tough_love") {
    prompt += `
TONE: Direct and challenging. No sugarcoating. "Stop making excuses. Ship it." Push them hard but fairly.`;
  } else if (profile?.motivationStyle === "encouraging") {
    prompt += `
TONE: Warm and supportive. Celebrate wins enthusiastically. "You're doing great! Keep that momentum!" Be their cheerleader.`;
  } else if (profile?.motivationStyle === "analytical") {
    prompt += `
TONE: Logical and framework-based. Explain the "why". "Here's why this approach works..." Give structured feedback.`;
  } else if (profile?.motivationStyle === "collaborative") {
    prompt += `
TONE: Partnership approach. "Let's figure this out together." Ask questions, suggest options, feel like a teammate.`;
  } else {
    prompt += `
TONE: Balanced - firm but supportive. Think experienced mentor who believes in them.`;
  }

  // Add challenge-specific guidance
  if (profile?.challenges && profile.challenges.length > 0) {
    prompt += `\n\nUSER'S CHALLENGES (be sensitive to these):`;
    if (profile.challenges.includes("imposter_syndrome")) {
      prompt += `\n- IMPOSTER SYNDROME: Remind them of their competence. "You built this. You belong here."`;
    }
    if (profile.challenges.includes("perfectionism")) {
      prompt += `\n- PERFECTIONISM: Emphasize "done > perfect". "Ship it ugly. Iterate later."`;
    }
    if (profile.challenges.includes("procrastination")) {
      prompt += `\n- PROCRASTINATION: Focus on starting, not finishing. "What's the smallest next step?"`;
    }
    if (profile.challenges.includes("decision_paralysis")) {
      prompt += `\n- DECISION PARALYSIS: Make clear recommendations. "Do X. Don't overthink it."`;
    }
    if (profile.challenges.includes("distraction")) {
      prompt += `\n- DISTRACTION: Suggest environment changes. "Phone in another room next time."`;
    }
    if (profile.challenges.includes("overwork")) {
      prompt += `\n- OVERWORK: Celebrate taking breaks. "Rest is part of the process. Good job stepping away."`;
    }
  }

  // Add personal context if available
  if (profile?.personalContext) {
    prompt += `\n\nPERSONAL CONTEXT: ${profile.personalContext}`;
  }

  // Add goal context if available
  if (profile?.bigPictureGoal) {
    prompt += `\n\nUSER'S BIG GOAL: ${profile.bigPictureGoal} - Connect feedback to this when relevant.`;
  }

  return prompt;
}

// The default "Ruthless Mentor" system prompt (fallback)
const DEFAULT_MENTOR_PROMPT = `You are Sentinel, a ruthless but caring productivity coach. Your job is to analyze what the user accomplished in their work session and give brief, direct feedback.

RULES:
1. Be extremely concise - max 2-3 sentences
2. Be honest but not cruel - firm but supportive
3. If they accomplished something meaningful, acknowledge it briefly and push them forward
4. If they admit to procrastination/distraction, call it out but redirect positively
5. If they're vague, ask for specifics next time
6. Always end with a forward-looking action or encouragement
7. Use direct, punchy language. No fluff.

EXAMPLES:
- Input: "Fixed the login bug and wrote tests"
  Output: "Solid. Tests are discipline. Next block: tackle that API refactor you've been avoiding."

- Input: "Got distracted, scrolled Twitter for 30 mins"  
  Output: "At least you're honest. That's step one. Next session: phone in another room. Let's go."

- Input: "Worked on stuff"
  Output: "Too vague. What specifically shipped? Be concrete next time. Own your wins."

- Input: "Finished the dashboard component and started on the API integration"
  Output: "Good momentum. Don't lose it. Push through the API integration - finish what you start."

TONE: Think Navy SEAL instructor meets supportive older sibling. Firm, direct, no BS, but ultimately wants you to succeed.`;

// Analyze accountability note with AI
export const analyzeNote = action({
  args: {
    note: v.string(),
    userId: v.id("users"),
    taskGoal: v.optional(v.string()), // What they planned to work on
  },
  handler: async (
    ctx,
    args,
  ): Promise<{
    feedback: string;
    sentiment: "positive" | "neutral" | "needs_improvement";
  }> => {
    const apiKey = process.env.OPENAI_API_KEY;

    // Fetch user profile for personalization
    const profile = await ctx.runQuery(api.userProfiles.get, {
      userId: args.userId,
    });

    // If no API key, return a placeholder response
    if (!apiKey) {
      console.warn("No OPENAI_API_KEY set - returning placeholder feedback");
      return {
        feedback: "Good session logged. Keep the momentum going.",
        sentiment: "neutral",
      };
    }

    try {
      // Build personalized prompt
      const systemPrompt = profile
        ? buildMentorPrompt(profile)
        : DEFAULT_MENTOR_PROMPT;

      // Build user message with task context
      let userMessage = `What did I accomplish? "${args.note}"`;
      if (args.taskGoal) {
        userMessage = `I planned to: "${args.taskGoal}"\nWhat I actually did: "${args.note}"`;
      }

      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userMessage },
            ],
            max_tokens: 150,
            temperature: 0.7,
          }),
        },
      );

      if (!response.ok) {
        const error = await response.text();
        console.error("OpenAI API error:", error);
        return {
          feedback: "Session logged. Keep pushing forward.",
          sentiment: "neutral",
        };
      }

      const data = await response.json();
      const feedback =
        data.choices[0]?.message?.content?.trim() || "Good work. Keep going.";

      // Determine sentiment based on feedback content
      const lowerFeedback = feedback.toLowerCase();
      let sentiment: "positive" | "neutral" | "needs_improvement" = "neutral";

      if (
        lowerFeedback.includes("solid") ||
        lowerFeedback.includes("good") ||
        lowerFeedback.includes("great") ||
        lowerFeedback.includes("nice") ||
        lowerFeedback.includes("awesome") ||
        lowerFeedback.includes("excellent")
      ) {
        sentiment = "positive";
      } else if (
        lowerFeedback.includes("honest") ||
        lowerFeedback.includes("vague") ||
        lowerFeedback.includes("avoid") ||
        lowerFeedback.includes("distract") ||
        lowerFeedback.includes("try") ||
        lowerFeedback.includes("next time")
      ) {
        sentiment = "needs_improvement";
      }

      return { feedback, sentiment };
    } catch (error) {
      console.error("AI analysis error:", error);
      return {
        feedback: "Session logged. Stay focused on what matters most.",
        sentiment: "neutral",
      };
    }
  },
});

// Store AI feedback in the session (called after unlock)
export const storeFeedback = internalMutation({
  args: {
    sessionId: v.id("sessions"),
    aiFeedback: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.sessionId, {
      aiFeedback: args.aiFeedback,
    });
  },
});

// Task suggestion system prompt
const TASK_SUGGESTER_PROMPT = `You are a productivity coach helping someone decide what to work on next. Based on their recent work history, suggest ONE specific, actionable task for their next session.

RULES:
1. Suggest ONE task only - be specific
2. Base it on their recent work if available (continue momentum or tackle something new)
3. Keep it short - max 10 words
4. Make it actionable (start with a verb)
5. If they have incomplete work, suggest finishing it
6. If they just finished something, suggest the logical next step

OUTPUT FORMAT: Just the task, nothing else. No explanations.

EXAMPLES:
- "Finish the API integration you started"
- "Write tests for the login component"
- "Review and merge pending PRs"
- "Fix the bug reported yesterday"
- "Start on the dashboard redesign"`;

// ============================================
// IN-SESSION AI COACH
// ============================================

type CoachingType =
  | "procrastinating" // Help them start
  | "stuck" // Help break down the problem
  | "doubting" // Counter imposter syndrome
  | "overwhelmed" // Help simplify
  | "unfocused" // Refocus on goal
  | "motivation" // Generic motivation boost
  | "checkin"; // Proactive check-in

// Build coaching prompt based on type and user profile
function buildCoachingPrompt(
  type: CoachingType,
  profile: {
    challenges?: string[];
    motivationStyle?: string;
    personalContext?: string;
    bigPictureGoal?: string;
  } | null,
): string {
  // Base personality
  let tone = "supportive but direct";
  if (profile?.motivationStyle === "tough_love") {
    tone = "firm and challenging - no sugarcoating, push them hard";
  } else if (profile?.motivationStyle === "encouraging") {
    tone = "warm and enthusiastic - be their cheerleader";
  } else if (profile?.motivationStyle === "analytical") {
    tone = "logical and structured - explain the why";
  } else if (profile?.motivationStyle === "collaborative") {
    tone = "like a teammate - 'let's figure this out together'";
  }

  const basePrompt = `You are Sentinel, an AI productivity coach. Be ${tone}.
CRITICAL: Keep responses under 50 words. Be punchy and actionable.`;

  const prompts: Record<CoachingType, string> = {
    procrastinating: `${basePrompt}

The user is procrastinating and struggling to start. Help them take the FIRST tiny step.
- Don't lecture about procrastination
- Give ONE specific micro-action they can do in the next 30 seconds
- Make it so small it's impossible to refuse
- End with "Go. Now."

${profile?.challenges?.includes("procrastination") ? "They struggle with procrastination regularly - be understanding but firm." : ""}`,

    stuck: `${basePrompt}

The user is stuck on their task. Help them break through.
- Ask ONE clarifying question OR give ONE specific technique
- Suggest: rubber duck debugging, working backwards, or taking a different angle
- Don't give generic advice

${profile?.challenges?.includes("decision_paralysis") ? "They have decision paralysis - make a clear recommendation, don't give options." : ""}`,

    doubting: `${basePrompt}

The user is experiencing imposter syndrome. Counter it directly.
- Acknowledge the feeling is normal
- Remind them of their competence (reference their goal if known)
- Reframe: "feeling like a fraud often means you're growing"
- End with affirmation of their capability

${profile?.bigPictureGoal ? `Their big goal is: "${profile.bigPictureGoal}" - they're clearly capable of big things.` : ""}`,

    overwhelmed: `${basePrompt}

The user feels overwhelmed. Help them simplify.
- Acknowledge the feeling
- Help them identify the ONE thing that matters most right now
- Suggest parking everything else mentally
- "What's the one thing that, if done, makes everything else easier?"

${profile?.challenges?.includes("perfectionism") ? "They're a perfectionist - remind them 'done > perfect'." : ""}`,

    unfocused: `${basePrompt}

The user has lost focus. Help them refocus.
- Don't shame them for drifting
- Redirect attention to their stated goal
- Suggest a quick reset: deep breath, state the goal out loud
- "What were you trying to accomplish? Let's get back to that."`,

    motivation: `${basePrompt}

The user needs a motivation boost. Give them one.
- Be energizing, not preachy
- Reference their goal or the bigger picture
- End with an action-oriented push
- "Let's GO. You've got this."

${profile?.bigPictureGoal ? `Connect to their goal: "${profile.bigPictureGoal}"` : ""}`,

    checkin: `${basePrompt}

This is a proactive check-in during their work session. 
- Ask how it's going
- Offer help if they're stuck
- Keep it brief and non-intrusive
- "Quick check: How's it going? Need any help?"`,
  };

  let prompt = prompts[type];

  // Add personal context if available
  if (profile?.personalContext) {
    prompt += `\n\nPersonal context about user: ${profile.personalContext}`;
  }

  return prompt;
}

// Main coaching action - called when user taps a help button
export const getCoachingHelp = action({
  args: {
    userId: v.id("users"),
    type: v.union(
      v.literal("procrastinating"),
      v.literal("stuck"),
      v.literal("doubting"),
      v.literal("overwhelmed"),
      v.literal("unfocused"),
      v.literal("motivation"),
    ),
    currentTask: v.optional(v.string()), // What they're working on
    projectId: v.optional(v.id("projects")), // Current project for context
    additionalContext: v.optional(v.string()), // Any extra context they provide
    timeInSession: v.optional(v.number()), // Minutes into current session
  },
  handler: async (
    ctx,
    args,
  ): Promise<{ message: string; followUp?: string }> => {
    const apiKey = process.env.OPENAI_API_KEY;

    // Get user profile
    const profile = await ctx.runQuery(api.userProfiles.get, {
      userId: args.userId,
    });

    // Fallback responses if no API key
    const fallbacks: Record<string, { message: string; followUp?: string }> = {
      procrastinating: {
        message: "Open the file. Just look at it. That's step one. Go.",
        followUp: "What's the tiniest thing you can do right now?",
      },
      stuck: {
        message:
          "Try explaining the problem out loud, like you're teaching someone. Often the answer appears.",
        followUp: "What specifically is blocking you?",
      },
      doubting: {
        message:
          "Imposter syndrome hits hardest when you're growing. That discomfort? It means you're leveling up. You belong here.",
      },
      overwhelmed: {
        message:
          "Pause. Breathe. What's the ONE thing that matters most right now? Everything else can wait.",
        followUp: "Let's simplify: what's your single priority?",
      },
      unfocused: {
        message:
          "It happens. Take a breath, state your goal out loud, and dive back in. You've got this.",
      },
      motivation: {
        message:
          "You're in the arena. Most people never even start. Keep pushing—you're closer than you think.",
      },
    };

    if (!apiKey) {
      return (
        fallbacks[args.type] || { message: "Keep going. You've got this." }
      );
    }

    try {
      const systemPrompt = buildCoachingPrompt(args.type, profile);

      // Get project context if available
      let projectContext = "";
      if (args.projectId) {
        const project = await ctx.runQuery(api.projects.get, {
          projectId: args.projectId,
        });
        if (project) {
          projectContext = `\n\nPROJECT: "${project.name}"${project.goal ? ` - Goal: ${project.goal}` : ""}`;
          if (project.coachingMode === "ship_fast") {
            projectContext += "\n(HIGH URGENCY - user is in ship-fast mode)";
          }
        }
      }

      // Build user message with context
      let userMessage = `I'm ${
        args.type === "procrastinating"
          ? "procrastinating"
          : args.type === "stuck"
            ? "stuck"
            : args.type === "doubting"
              ? "doubting myself"
              : args.type === "overwhelmed"
                ? "feeling overwhelmed"
                : args.type === "unfocused"
                  ? "having trouble focusing"
                  : "needing motivation"
      }.`;

      if (args.currentTask) {
        userMessage += `\n\nI'm supposed to be working on: "${args.currentTask}"`;
      }
      if (projectContext) {
        userMessage += projectContext;
      }
      if (args.additionalContext) {
        userMessage += `\n\n[USER PROVIDED MORE DETAILS - give a DIFFERENT, MORE SPECIFIC response than before]\nThey said: "${args.additionalContext}"`;
      }
      if (args.timeInSession) {
        userMessage += `\n\n(${args.timeInSession} minutes into this session)`;
      }

      // Use higher temperature when user provides more context (for varied responses)
      const temperature = args.additionalContext ? 0.95 : 0.8;

      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userMessage },
            ],
            max_tokens: 120, // Slightly more for detailed responses
            temperature,
          }),
        },
      );

      if (!response.ok) {
        console.error("OpenAI API error:", await response.text());
        return fallbacks[args.type] || { message: "Keep pushing forward." };
      }

      const data = await response.json();
      const message =
        data.choices[0]?.message?.content?.trim() ||
        fallbacks[args.type]?.message ||
        "Keep going.";

      return { message };
    } catch (error) {
      console.error("AI coaching error:", error);
      return (
        fallbacks[args.type] || { message: "Stay focused. You've got this." }
      );
    }
  },
});

// Proactive check-in - called at intervals during session
export const getProactiveCheckIn = action({
  args: {
    userId: v.id("users"),
    currentTask: v.optional(v.string()),
    minutesElapsed: v.number(),
    totalMinutes: v.number(),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{ message: string; showHelp: boolean }> => {
    const apiKey = process.env.OPENAI_API_KEY;
    const profile = await ctx.runQuery(api.userProfiles.get, {
      userId: args.userId,
    });

    // Calculate progress
    const progress = Math.round(
      (args.minutesElapsed / args.totalMinutes) * 100,
    );
    const isHalfway = progress >= 45 && progress <= 55;
    const isNearEnd = progress >= 80;

    // Fallback messages
    if (!apiKey) {
      if (isNearEnd) {
        return {
          message:
            "Almost there! Final push. What can you finish before time's up?",
          showHelp: false,
        };
      }
      if (isHalfway) {
        return {
          message: "Halfway through! How's it going? Need help with anything?",
          showHelp: true,
        };
      }
      return { message: "Quick check: Still on track?", showHelp: true };
    }

    try {
      const systemPrompt = buildCoachingPrompt("checkin", profile);

      let userMessage = `${args.minutesElapsed} minutes into a ${args.totalMinutes}-minute session (${progress}% done).`;
      if (args.currentTask) {
        userMessage += `\nWorking on: "${args.currentTask}"`;
      }
      if (isNearEnd) {
        userMessage += "\nSession ending soon - help them finish strong.";
      } else if (isHalfway) {
        userMessage += "\nHalfway point - good time to check in.";
      }

      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userMessage },
            ],
            max_tokens: 60,
            temperature: 0.7,
          }),
        },
      );

      if (!response.ok) {
        return { message: "How's it going? Need any help?", showHelp: true };
      }

      const data = await response.json();
      const message =
        data.choices[0]?.message?.content?.trim() || "Still on track?";

      return { message, showHelp: !isNearEnd };
    } catch (error) {
      console.error("AI check-in error:", error);
      return { message: "Quick check: How's it going?", showHelp: true };
    }
  },
});

// ============================================
// TASK SUGGESTIONS
// ============================================

// Get task suggestion for pre-session (now project-aware)
export const suggestTask = action({
  args: {
    userId: v.id("users"),
    projectId: v.optional(v.id("projects")),
  },
  handler: async (ctx, args): Promise<{ task: string; reasoning?: string }> => {
    const apiKey = process.env.OPENAI_API_KEY;

    // Get recent sessions for context
    const recentSessions = await ctx.runQuery(api.sessions.listByUser, {
      userId: args.userId,
      limit: 5,
    });

    // Get project context if provided
    let projectContext = "";
    let projectTasks: { title: string; status: string; priority: string }[] =
      [];

    if (args.projectId) {
      const project = await ctx.runQuery(api.projects.get, {
        projectId: args.projectId,
      });
      if (project) {
        projectContext = `
PROJECT: ${project.name}
${project.goal ? `GOAL: ${project.goal}` : ""}
MODE: ${project.coachingMode}`;

        // Get tasks and columns for this project
        const tasks = await ctx.runQuery(api.tasks.listByProjectFlat, {
          projectId: args.projectId,
        });
        const columns = await ctx.runQuery(api.kanbanColumns.listByProject, {
          projectId: args.projectId,
        });

        // Build a map of columnId -> status based on column properties
        const columnStatusMap = new Map<string, string>();
        for (const col of columns) {
          if (col.isCompleteColumn) {
            columnStatusMap.set(col._id, "done");
          } else if (col.name === "In Progress" || col.order === 1) {
            columnStatusMap.set(col._id, "in_progress");
          } else {
            columnStatusMap.set(col._id, "todo");
          }
        }

        projectTasks = tasks.map((t) => ({
          title: t.title,
          status: columnStatusMap.get(t.columnId) || "todo",
          priority: t.priority,
        }));
      }
    }

    // Build context from recent sessions
    const recentWork = recentSessions
      .filter((s) => s.taskDescription || s.userNotes)
      .map((s) => {
        const task = s.taskDescription || "Unknown task";
        const outcome = s.userNotes || "No notes";
        const completed = s.didUnlockProperly ? "completed" : "incomplete";
        return `- ${task} (${completed}): ${outcome}`;
      })
      .join("\n");

    // Get time of day for context
    const hour = new Date().getHours();
    const timeContext =
      hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";

    // If no API key, suggest from project tasks
    if (!apiKey) {
      const inProgress = projectTasks.find((t) => t.status === "in_progress");
      if (inProgress) return { task: inProgress.title };

      const highPriority = projectTasks.find(
        (t) => t.status === "todo" && t.priority === "high",
      );
      if (highPriority) return { task: highPriority.title };

      const anyTodo = projectTasks.find((t) => t.status === "todo");
      if (anyTodo) return { task: anyTodo.title };

      return { task: "Pick your most important task and start" };
    }

    try {
      // Build task list for AI
      const taskList =
        projectTasks.length > 0
          ? `\nPROJECT TASKS:\n${projectTasks.map((t) => `- [${t.status}] ${t.title} (${t.priority})`).join("\n")}`
          : "";

      let userMessage = projectContext
        ? `${projectContext}${taskList}\n\nRecent work:\n${recentWork || "No recent sessions"}\n\nIt's ${timeContext}. What should I focus on next?`
        : recentWork
          ? `Recent work:\n${recentWork}\n\nIt's ${timeContext}. What should I focus on next?`
          : `It's ${timeContext} and I'm starting fresh. What should I focus on?`;

      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: TASK_SUGGESTER_PROMPT },
              { role: "user", content: userMessage },
            ],
            max_tokens: 50,
            temperature: 0.7,
          }),
        },
      );

      if (!response.ok) {
        console.error("OpenAI API error:", await response.text());
        return { task: "Focus on your highest-priority task" };
      }

      const data = await response.json();
      const task =
        data.choices[0]?.message?.content?.trim() ||
        "Focus on what matters most";

      return { task };
    } catch (error) {
      console.error("AI suggestion error:", error);
      return { task: "Pick one important task and commit to it" };
    }
  },
});
