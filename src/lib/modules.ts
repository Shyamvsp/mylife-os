export type FieldType = "text" | "textarea" | "number" | "date" | "url" | "select";
export type ModuleField = { key: string; label: string; type: FieldType; placeholder?: string; options?: string[]; required?: boolean };
export type ModuleConfig = {
  title: string;
  description: string;
  icon: string;
  gradient: string;
  accentBadge: string;
  emoji: string;
  fields: ModuleField[];
};

export const MODULES = {
  study: {
    title: "Study",
    description: "Subjects, study sessions, exams and learning notes.",
    icon: "BookOpen",
    emoji: "📚",
    gradient: "from-indigo-600/15 via-blue-600/5 to-transparent",
    accentBadge: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
    fields: [
      { key: "subject", label: "Subject", type: "text", required: true },
      { key: "topic", label: "Topic / unit", type: "text" },
      { key: "duration_minutes", label: "Study duration (minutes)", type: "number" },
      { key: "status", label: "Status", type: "select", options: ["Planned", "In progress", "Completed"] },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
  },
  fitness: {
    title: "Fitness",
    description: "Track workouts, weight, steps and nutrition notes.",
    icon: "Dumbbell",
    emoji: "🏋️",
    gradient: "from-emerald-600/15 via-teal-600/5 to-transparent",
    accentBadge: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    fields: [
      { key: "weight_kg", label: "Weight (kg)", type: "number" },
      { key: "steps", label: "Walking steps", type: "number" },
      { key: "calories", label: "Calories (kcal)", type: "number" },
      { key: "workout", label: "Workout", type: "text" },
      { key: "duration_minutes", label: "Workout duration (minutes)", type: "number" },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
  },
  skills: {
    title: "Skills",
    description: "Technologies, proficiency and learning progress.",
    icon: "Code",
    emoji: "💻",
    gradient: "from-violet-600/15 via-purple-600/5 to-transparent",
    accentBadge: "bg-violet-500/10 text-violet-500 border-violet-500/20",
    fields: [
      { key: "technology", label: "Technology / skill", type: "text", required: true },
      { key: "level", label: "Current level", type: "select", options: ["Beginner", "Basic", "Intermediate", "Advanced"] },
      { key: "progress", label: "Progress (%)", type: "number" },
      { key: "practice_hours", label: "Practice hours", type: "number" },
      { key: "next_step", label: "Next step", type: "textarea" },
    ],
  },
  certifications: {
    title: "Certifications",
    description: "Certificates, issuers, dates and credential links.",
    icon: "Award",
    emoji: "🏆",
    gradient: "from-amber-600/15 via-yellow-600/5 to-transparent",
    accentBadge: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    fields: [
      { key: "issuer", label: "Issuing organization", type: "text" },
      { key: "issue_date", label: "Issue date", type: "date" },
      { key: "credential_url", label: "Credential URL", type: "url" },
      { key: "file_path", label: "Stored file path (optional)", type: "text" },
      { key: "description", label: "Description", type: "textarea" },
    ],
  },
  projects: {
    title: "Projects",
    description: "Ideas, active projects, technologies and milestones.",
    icon: "FolderKanban",
    emoji: "🚀",
    gradient: "from-cyan-600/15 via-sky-600/5 to-transparent",
    accentBadge: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
    fields: [
      { key: "status", label: "Status", type: "select", options: ["Idea", "Planning", "In progress", "On hold", "Completed"] },
      { key: "technologies", label: "Technologies", type: "text", placeholder: "Next.js, PostgreSQL, Python" },
      { key: "github_url", label: "GitHub URL", type: "url" },
      { key: "demo_url", label: "Live demo URL", type: "url" },
      { key: "deadline", label: "Target date", type: "date" },
      { key: "notes", label: "Description / notes", type: "textarea" },
    ],
  },
  journal: {
    title: "Daily Journal",
    description: "Capture what you did, learned and plan next.",
    icon: "NotebookPen",
    emoji: "✍️",
    gradient: "from-rose-600/15 via-pink-600/5 to-transparent",
    accentBadge: "bg-rose-500/10 text-rose-500 border-rose-500/20",
    fields: [
      { key: "mood", label: "Mood", type: "select", options: ["Great", "Good", "Okay", "Low"] },
      { key: "highlights", label: "Today's highlights", type: "textarea" },
      { key: "learning", label: "What I learned", type: "textarea" },
      { key: "tomorrow", label: "Tomorrow's plan", type: "textarea" },
    ],
  },
  expenses: {
    title: "Expenses",
    description: "Personal spending, categories and savings notes.",
    icon: "Wallet",
    emoji: "💰",
    gradient: "from-emerald-600/15 via-green-600/5 to-transparent",
    accentBadge: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    fields: [
      { key: "amount", label: "Amount (INR)", type: "number", required: true },
      { key: "category", label: "Category", type: "select", options: ["Food", "Travel", "Education", "Shopping", "Bills", "Health", "Other"] },
      { key: "payment_method", label: "Payment method", type: "select", options: ["Cash", "UPI", "Card", "Bank transfer", "Other"] },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
  },
  goals: {
    title: "Goals",
    description: "Long-term targets, milestones and progress.",
    icon: "Target",
    emoji: "🎯",
    gradient: "from-fuchsia-600/15 via-purple-600/5 to-transparent",
    accentBadge: "bg-fuchsia-500/10 text-fuchsia-500 border-fuchsia-500/20",
    fields: [
      { key: "category", label: "Category", type: "select", options: ["Career", "Education", "Fitness", "Finance", "Personal", "Other"] },
      { key: "target_date", label: "Target date", type: "date" },
      { key: "progress", label: "Progress (%)", type: "number" },
      { key: "status", label: "Status", type: "select", options: ["Not started", "In progress", "Completed"] },
      { key: "next_action", label: "Next action", type: "textarea" },
    ],
  },
  habits: {
    title: "Habits",
    description: "Track recurring routines and daily consistency.",
    icon: "Repeat",
    emoji: "⚡",
    gradient: "from-orange-600/15 via-amber-600/5 to-transparent",
    accentBadge: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    fields: [
      { key: "frequency", label: "Frequency", type: "select", options: ["Daily", "Weekdays", "Weekly"] },
      { key: "target", label: "Target", type: "text", placeholder: "Read 20 pages" },
      { key: "completed", label: "Completed today", type: "select", options: ["Yes", "No"] },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
  },
  tasks: {
    title: "Tasks",
    description: "To-dos, deadlines, priorities and next actions.",
    icon: "ListTodo",
    emoji: "✅",
    gradient: "from-blue-600/15 via-indigo-600/5 to-transparent",
    accentBadge: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    fields: [
      { key: "priority", label: "Priority", type: "select", options: ["Low", "Medium", "High"] },
      { key: "status", label: "Status", type: "select", options: ["To do", "Doing", "Done"] },
      { key: "due_date", label: "Due date", type: "date" },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
  },
  calendar: {
    title: "Calendar",
    description: "Important dates, events and appointments.",
    icon: "CalendarDays",
    emoji: "🗓️",
    gradient: "from-purple-600/15 via-pink-600/5 to-transparent",
    accentBadge: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    fields: [
      { key: "start_time", label: "Start time", type: "text", placeholder: "09:30" },
      { key: "end_time", label: "End time", type: "text", placeholder: "10:30" },
      { key: "location", label: "Location", type: "text" },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
  },
} satisfies Record<string, ModuleConfig>;

export type ModuleKey = keyof typeof MODULES;
export function isModuleKey(value: string): value is ModuleKey {
  return Object.prototype.hasOwnProperty.call(MODULES, value);
}
