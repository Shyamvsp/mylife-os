import { MODULES, type ModuleKey } from "./modules";

export interface ParsedEntryAction {
  type: "CREATE_ENTRY";
  module: ModuleKey;
  title: string;
  details?: string;
  entry_date: string;
  data: Record<string, string>;
  explanation: string;
}

export interface QueryAction {
  type: "QUERY_INFO";
  targetModule?: ModuleKey;
  dateFilter?: "today" | "all" | "recent";
  explanation: string;
}

export interface ChatAction {
  type: "CHAT_RESPONSE";
  message: string;
}

export type AgentResult = ParsedEntryAction | QueryAction | ChatAction;

/**
 * Extracts date from text or returns today's YYYY-MM-DD
 */
export function extractDate(text: string): string {
  const lower = text.toLowerCase();
  const now = new Date();

  if (lower.includes("yesterday")) {
    const yesterday = new Date(now.getTime() - 86400000);
    return yesterday.toISOString().slice(0, 10);
  }
  if (lower.includes("tomorrow")) {
    const tomorrow = new Date(now.getTime() + 86400000);
    return tomorrow.toISOString().slice(0, 10);
  }

  // Look for YYYY-MM-DD
  const isoMatch = text.match(/\b(20\d\d-[01]\d-[0-3]\d)\b/);
  if (isoMatch) return isoMatch[1];

  // Look for DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = text.match(/\b([0-3]?\d)[/-]([01]?\d)[/-](20\d\d)\b/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, "0");
    const month = dmyMatch[2].padStart(2, "0");
    return `${dmyMatch[3]}-${month}-${day}`;
  }

  return now.toISOString().slice(0, 10);
}

/**
 * Intelligent Rule-Based Natural Language Processor
 * Understands natural voice/text commands and translates them into module records
 */
export function parseNaturalLanguageCommand(rawInput: string): AgentResult[] {
  const text = rawInput.trim();
  if (!text) {
    return [{ type: "CHAT_RESPONSE", message: "I'm listening! You can tell me what you did today, like workouts, study sessions, expenses, or tasks." }];
  }

  const lower = text.toLowerCase();

  // 1. Detect Queries (e.g. "What did I do today?", "Show my workouts", "List my tasks")
  if (
    lower.startsWith("what did i") ||
    lower.startsWith("what are my") ||
    lower.startsWith("show my") ||
    lower.startsWith("show me") ||
    lower.startsWith("list my") ||
    lower.includes("how much did i spend") ||
    lower.includes("show records") ||
    lower.includes("view my")
  ) {
    let targetModule: ModuleKey | undefined;
    for (const key of Object.keys(MODULES) as ModuleKey[]) {
      if (lower.includes(key) || (key === "fitness" && (lower.includes("workout") || lower.includes("gym")))) {
        targetModule = key;
        break;
      }
    }
    const isToday = lower.includes("today");
    return [
      {
        type: "QUERY_INFO",
        targetModule,
        dateFilter: isToday ? "today" : "all",
        explanation: targetModule
          ? `Searching your ${MODULES[targetModule].title} records${isToday ? " for today" : ""}...`
          : `Looking up your recent records across all modules...`,
      },
    ];
  }

  // 2. Check for Greetings / General questions
  if (/^(hi|hello|hey|good morning|good evening|who are you|help)\b/i.test(lower) && text.length < 25) {
    return [
      {
        type: "CHAT_RESPONSE",
        message:
          "Hello Shyam! 👋 I am your Antigravity AI Agent. You can speak or type whatever you did, and I will automatically organize and store it in your 12 applications. For example, say: 'Today I ran 5km, 8000 steps, and studied React for 2 hours'.",
      },
    ];
  }

  // 3. Multi-segment parsing (handle composite sentences with "and also", "plus", "and spent", etc.)
  const segments = splitIntoIntentSegments(text);
  const actions: AgentResult[] = [];

  for (const seg of segments) {
    const action = parseSingleIntent(seg, text);
    if (action) actions.push(action);
  }

  if (actions.length > 0) return actions;

  // Fallback to journal if it's general thoughts or reflection
  const date = extractDate(text);
  return [
    {
      type: "CREATE_ENTRY",
      module: "journal",
      title: text.length > 50 ? text.slice(0, 47) + "..." : text,
      details: text,
      entry_date: date,
      data: {
        mood: detectMood(lower),
        highlights: text,
      },
      explanation: "Saved to your Daily Journal.",
    },
  ];
}

function splitIntoIntentSegments(text: string): string[] {
  // Split on phrases like "and also", "and spent", "and studied", "plus I", or semicolons/newlines
  const parts = text.split(/(?:\r?\n|;|\band also\b|\bplus I\b|\band i spent\b|\band spent\b|\band studied\b|\band worked out\b)/i);
  return parts.map((p) => p.trim()).filter((p) => p.length > 4);
}

function parseSingleIntent(seg: string, fullContext: string): ParsedEntryAction | null {
  const lower = seg.toLowerCase();
  const date = extractDate(seg) || extractDate(fullContext);

  // 1. FITNESS MODULE
  if (
    lower.includes("workout") ||
    lower.includes("gym") ||
    lower.includes("steps") ||
    lower.includes("running") ||
    lower.includes("ran ") ||
    lower.includes("jogging") ||
    lower.includes("calories") ||
    lower.includes("weight") ||
    lower.includes("pushups") ||
    lower.includes("chest") ||
    lower.includes("leg day") ||
    lower.includes("cardio") ||
    lower.includes("walked") ||
    lower.includes("fitness")
  ) {
    const stepsMatch = seg.match(/(\d+[\d,]*)\s*(?:steps?|k\s*steps)/i);
    const steps = stepsMatch ? stepsMatch[1].replace(/,/g, "") : "";

    const calMatch = seg.match(/(\d+[\d,]*)\s*(?:cal|calories|kcal)/i);
    const calories = calMatch ? calMatch[1].replace(/,/g, "") : "";

    const weightMatch = seg.match(/(\d+(?:\.\d+)?)\s*(?:kg|kgs|kilos?)/i);
    const weight = weightMatch ? weightMatch[1] : "";

    const duration = extractDurationMinutes(seg);

    // Workout type detection
    let workout = "Workout session";
    if (lower.includes("run") || lower.includes("running")) workout = "Running / Jogging";
    else if (lower.includes("gym")) workout = "Gym Workout";
    else if (lower.includes("walk") || lower.includes("walking")) workout = "Walking";
    else if (lower.includes("chest")) workout = "Chest Workout";
    else if (lower.includes("leg")) workout = "Leg Day Workout";
    else if (lower.includes("cardio")) workout = "Cardio";

    const title = steps
      ? `${workout} (${steps} steps)`
      : `${workout}${duration ? ` - ${duration}m` : ""}`;

    return {
      type: "CREATE_ENTRY",
      module: "fitness",
      title: title,
      details: seg,
      entry_date: date,
      data: {
        workout,
        steps,
        calories,
        weight_kg: weight,
        duration_minutes: duration ? String(duration) : "",
        notes: seg,
      },
      explanation: `Logged ${workout} in Fitness${steps ? ` (${steps} steps)` : ""}${duration ? ` (${duration} mins)` : ""}.`,
    };
  }

  // 2. STUDY MODULE
  if (
    lower.includes("study") ||
    lower.includes("studied") ||
    lower.includes("studying") ||
    lower.includes("reading") ||
    lower.includes("read ") ||
    lower.includes("chapter") ||
    lower.includes("subject") ||
    lower.includes("exam") ||
    lower.includes("homework") ||
    lower.includes("lecture") ||
    lower.includes("course") ||
    lower.includes("dsa") ||
    lower.includes("math") ||
    lower.includes("physics")
  ) {
    const duration = extractDurationMinutes(seg);

    // Try to extract subject
    let subject = "General Study";
    const subMatch = seg.match(/(?:studied|study|reading|course in)\s+([a-zA-Z0-9#+.\s]{2,25})(?:\s+for|\s+at|\s+unit|\s+chapter|\.|$)/i);
    if (subMatch && subMatch[1].trim().length > 1) {
      subject = subMatch[1].trim();
    }

    return {
      type: "CREATE_ENTRY",
      module: "study",
      title: `${subject} Study Session`,
      details: seg,
      entry_date: date,
      data: {
        subject: subject,
        duration_minutes: duration ? String(duration) : "60",
        status: "Completed",
        notes: seg,
      },
      explanation: `Recorded study session for "${subject}"${duration ? ` (${duration} mins)` : ""}.`,
    };
  }

  // 3. EXPENSES MODULE
  if (
    lower.includes("spent") ||
    lower.includes("cost") ||
    lower.includes("bought") ||
    lower.includes("paid") ||
    lower.includes("rupees") ||
    lower.includes("inr") ||
    lower.includes("rs") ||
    lower.includes("₹") ||
    lower.includes("expense") ||
    lower.includes("lunch") ||
    lower.includes("dinner") ||
    lower.includes("petrol") ||
    lower.includes("shopping")
  ) {
    const amountMatch = seg.match(/(?:rs\.?|inr|₹|\$)\s*(\d+(?:\.\d+)?)|(\d+(?:\.\d+)?)\s*(?:rs|rupees|inr|bucks)/i);
    const amount = amountMatch ? amountMatch[1] || amountMatch[2] : "";

    let category = "Other";
    if (lower.includes("food") || lower.includes("lunch") || lower.includes("dinner") || lower.includes("breakfast") || lower.includes("tea") || lower.includes("coffee") || lower.includes("snack") || lower.includes("juice")) category = "Food";
    else if (lower.includes("travel") || lower.includes("cab") || lower.includes("uber") || lower.includes("auto") || lower.includes("bus") || lower.includes("train") || lower.includes("petrol") || lower.includes("fuel")) category = "Travel";
    else if (lower.includes("shopping") || lower.includes("clothes") || lower.includes("shoes") || lower.includes("amazon")) category = "Shopping";
    else if (lower.includes("bill") || lower.includes("recharge") || lower.includes("wifi") || lower.includes("electricity")) category = "Bills";
    else if (lower.includes("medicine") || lower.includes("doctor") || lower.includes("hospital")) category = "Health";
    else if (lower.includes("book") || lower.includes("course") || lower.includes("tuition")) category = "Education";

    let paymentMethod = "UPI";
    if (lower.includes("cash")) paymentMethod = "Cash";
    else if (lower.includes("card") || lower.includes("credit") || lower.includes("debit")) paymentMethod = "Card";

    const title = amount ? `Spent ₹${amount} on ${category}` : `Expense for ${category}`;

    return {
      type: "CREATE_ENTRY",
      module: "expenses",
      title: title,
      details: seg,
      entry_date: date,
      data: {
        amount: amount || "0",
        category: category,
        payment_method: paymentMethod,
        notes: seg,
      },
      explanation: `Logged expense of ₹${amount || "?"} under ${category} (${paymentMethod}).`,
    };
  }

  // 4. TASKS MODULE (Including "done my work" / "completed work")
  if (
    lower.includes("done my work") ||
    lower.includes("finished work") ||
    lower.includes("completed my work") ||
    lower.includes("work is done") ||
    lower.includes("work done") ||
    lower.includes("finished tasks") ||
    lower.includes("todo") ||
    lower.includes("to-do") ||
    lower.includes("task") ||
    lower.includes("need to") ||
    lower.includes("have to") ||
    lower.includes("remind me to") ||
    lower.includes("must do") ||
    lower.includes("assignment") ||
    lower.includes("deadline")
  ) {
    const isCompletedWork =
      lower.includes("done") || lower.includes("finished") || lower.includes("completed");

    let priority = "Medium";
    if (lower.includes("urgent") || lower.includes("important") || lower.includes("high priority") || lower.includes("asap")) priority = "High";
    else if (lower.includes("low priority") || lower.includes("whenever")) priority = "Low";

    let cleanTitle = isCompletedWork
      ? "Daily Work & Objectives Completed"
      : seg.replace(/^(?:task:?|todo:?|need to|have to|remind me to)\s*/i, "");
    if (cleanTitle.length > 70) cleanTitle = cleanTitle.slice(0, 67) + "...";

    return {
      type: "CREATE_ENTRY",
      module: "tasks",
      title: cleanTitle || "Daily Work",
      details: seg,
      entry_date: date,
      data: {
        priority: priority,
        status: isCompletedWork ? "Done" : "To do",
        due_date: date,
        notes: seg,
      },
      explanation: isCompletedWork
        ? `Great job, Shyam! Marked your daily work as completed in Tasks.`
        : `Created task "${cleanTitle}" with ${priority} priority.`,
    };
  }

  // 5. CALENDAR MODULE
  if (
    lower.includes("meeting") ||
    lower.includes("appointment") ||
    lower.includes("calendar") ||
    lower.includes("event") ||
    lower.includes("schedule") ||
    lower.includes("interview") ||
    lower.match(/\bat \d{1,2}(?::\d{2})?\s*(?:am|pm)?\b/i)
  ) {
    const timeMatch = seg.match(/\b(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\b/i);
    const startTime = timeMatch ? timeMatch[1] : "10:00";

    let title = seg.replace(/^(?:calendar:?|event:?|meeting:?)\s*/i, "");
    if (title.length > 60) title = title.slice(0, 57) + "...";

    return {
      type: "CREATE_ENTRY",
      module: "calendar",
      title: title || "Scheduled Event",
      details: seg,
      entry_date: date,
      data: {
        start_time: startTime,
        location: lower.includes("online") || lower.includes("zoom") || lower.includes("meet") ? "Google Meet" : "Campus",
        notes: seg,
      },
      explanation: `Scheduled "${title}" on your Calendar for ${date} at ${startTime}.`,
    };
  }

  // 6. PROJECTS MODULE
  if (
    lower.includes("project") ||
    lower.includes("developed") ||
    lower.includes("building") ||
    lower.includes("github") ||
    lower.includes("repository") ||
    lower.includes("feature added")
  ) {
    return {
      type: "CREATE_ENTRY",
      module: "projects",
      title: seg.length > 50 ? seg.slice(0, 47) + "..." : seg,
      details: seg,
      entry_date: date,
      data: {
        status: "In progress",
        technologies: "Next.js, TypeScript, Tailwind, Supabase",
        notes: seg,
      },
      explanation: `Recorded project progress in Projects module.`,
    };
  }

  // 7. HABITS MODULE
  if (lower.includes("habit") || lower.includes("streak") || lower.includes("routine")) {
    return {
      type: "CREATE_ENTRY",
      module: "habits",
      title: seg.length > 50 ? seg.slice(0, 47) + "..." : seg,
      details: seg,
      entry_date: date,
      data: {
        frequency: "Daily",
        completed: "Yes",
        notes: seg,
      },
      explanation: `Marked habit complete for today.`,
    };
  }

  // 8. GOALS MODULE
  if (lower.includes("goal") || lower.includes("target") || lower.includes("aim") || lower.includes("milestone")) {
    return {
      type: "CREATE_ENTRY",
      module: "goals",
      title: seg.length > 50 ? seg.slice(0, 47) + "..." : seg,
      details: seg,
      entry_date: date,
      data: {
        category: "Personal",
        status: "In progress",
        progress: "25",
        next_action: seg,
      },
      explanation: `Added new milestone to your Goals.`,
    };
  }

  // 9. SKILLS MODULE
  if (lower.includes("skill") || lower.includes("learned react") || lower.includes("practiced coding")) {
    return {
      type: "CREATE_ENTRY",
      module: "skills",
      title: seg.length > 50 ? seg.slice(0, 47) + "..." : seg,
      details: seg,
      entry_date: date,
      data: {
        technology: "Coding",
        level: "Intermediate",
        progress: "50",
        next_step: seg,
      },
      explanation: `Recorded skill progress.`,
    };
  }

  // Default to Daily Journal for feelings, day reflections, or uncategorized notes
  return {
    type: "CREATE_ENTRY",
    module: "journal",
    title: seg.length > 50 ? seg.slice(0, 47) + "..." : seg,
    details: seg,
    entry_date: date,
    data: {
      mood: detectMood(lower),
      highlights: seg,
    },
    explanation: `Recorded in your Daily Journal for ${date}.`,
  };
}

function extractDurationMinutes(text: string): number | null {
  const hrMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:hour|hours|hr|hrs)/i);
  if (hrMatch) {
    return Math.round(parseFloat(hrMatch[1]) * 60);
  }
  const minMatch = text.match(/(\d+)\s*(?:min|mins|minutes|minute)/i);
  if (minMatch) {
    return parseInt(minMatch[1], 10);
  }
  return null;
}

function detectMood(text: string): string {
  if (text.includes("great") || text.includes("awesome") || text.includes("fantastic") || text.includes("super")) return "Great";
  if (text.includes("good") || text.includes("happy") || text.includes("productive")) return "Good";
  if (text.includes("tired") || text.includes("low") || text.includes("bad") || text.includes("exhausted")) return "Low";
  return "Good";
}
