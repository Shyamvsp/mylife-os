export type FieldType = "text" | "textarea" | "number" | "date" | "url" | "select";
export type ModuleField = {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  options?: string[];
  required?: boolean;
};

export type Subsection = {
  id: string;
  label: string;
  icon?: string;
  description?: string;
};

export type ModuleConfig = {
  title: string;
  shortTitle?: string;
  appNumber: number;
  description: string;
  icon: string;
  gradient: string;
  accentBadge: string;
  accentColor: string;
  emoji: string;
  themeStyle: {
    bgGradient: string;
    cardBorder: string;
    accentGlow: string;
    textAccent: string;
  };
  subsections: Subsection[];
  fields: ModuleField[];
};

export const MODULES = {
  study: {
    appNumber: 2,
    title: "Study Management",
    shortTitle: "Study",
    description: "Academic syllabus, units, lecture notes, exam timetables and study hours.",
    icon: "BookOpen",
    emoji: "📚",
    accentColor: "#6366f1",
    gradient: "from-indigo-900/30 via-violet-900/15 to-transparent",
    accentBadge: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
    themeStyle: {
      bgGradient: "radial-gradient(ellipse at top, rgba(99, 102, 241, 0.15), transparent 70%)",
      cardBorder: "rgba(99, 102, 241, 0.25)",
      accentGlow: "rgba(99, 102, 241, 0.35)",
      textAccent: "text-indigo-400",
    },
    subsections: [
      { id: "academic_profile", label: "Academic Profile" },
      { id: "college_course", label: "College & Course" },
      { id: "semesters", label: "Semester Manager" },
      { id: "subjects", label: "Subject Management" },
      { id: "syllabus", label: "Unit-wise Syllabus" },
      { id: "notes_pdf", label: "Notes & PDFs" },
      { id: "assignments", label: "Assignment Tracker" },
      { id: "exam_timetable", label: "Exam Timetable" },
      { id: "study_hours", label: "Study-Hour Tracker" },
      { id: "timetable", label: "Weekly Timetable" },
      { id: "exam_prep", label: "Exam Prep Progress" },
      { id: "subject_analytics", label: "Subject Analytics" },
    ],
    fields: [
      { key: "subcategory", label: "Subsection", type: "select", options: [
        "Academic Profile", "College & Course", "Semester Manager", "Subject Management",
        "Unit-wise Syllabus", "Notes & PDFs", "Assignment Tracker", "Exam Timetable",
        "Study-Hour Tracker", "Weekly Timetable", "Exam Prep Progress", "Subject Analytics"
      ] },
      { key: "subject", label: "Subject / Course", type: "text", required: true },
      { key: "topic", label: "Topic / Unit / Chapter", type: "text" },
      { key: "duration_minutes", label: "Study duration (minutes)", type: "number" },
      { key: "status", label: "Status", type: "select", options: ["Planned", "In progress", "Completed", "Needs Revision"] },
      { key: "notes", label: "Notes & Key Learnings", type: "textarea" },
    ],
  },

  fitness: {
    appNumber: 3,
    title: "Fitness Tracker",
    shortTitle: "Fitness",
    description: "Workouts, daily weight, step counter, nutrition macro tracking and water intake.",
    icon: "Dumbbell",
    emoji: "🏋️",
    accentColor: "#10b981",
    gradient: "from-emerald-900/30 via-teal-900/15 to-transparent",
    accentBadge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    themeStyle: {
      bgGradient: "radial-gradient(ellipse at top, rgba(16, 185, 129, 0.15), transparent 70%)",
      cardBorder: "rgba(16, 185, 129, 0.25)",
      accentGlow: "rgba(16, 185, 129, 0.35)",
      textAccent: "text-emerald-400",
    },
    subsections: [
      { id: "fitness_dashboard", label: "Fitness Dashboard" },
      { id: "weight_management", label: "Weight Management" },
      { id: "workout_management", label: "Workout Management" },
      { id: "walking_steps", label: "Walking & Steps" },
      { id: "food_tracker", label: "Food Tracker" },
      { id: "nutrition_management", label: "Nutrition (Macros)" },
      { id: "water_tracker", label: "Water Tracker" },
      { id: "body_measurements", label: "Body Measurements" },
      { id: "progress_tracking", label: "Progress Tracking" },
      { id: "fitness_goals", label: "Fitness Goals" },
      { id: "fitness_calendar", label: "Fitness Calendar" },
      { id: "fitness_reports", label: "Fitness Reports" },
    ],
    fields: [
      { key: "subcategory", label: "Subsection", type: "select", options: [
        "Fitness Dashboard", "Weight Management", "Workout Management", "Walking & Steps",
        "Food Tracker", "Nutrition (Macros)", "Water Tracker", "Body Measurements",
        "Progress Tracking", "Fitness Goals", "Fitness Calendar", "Fitness Reports"
      ] },
      { key: "weight_kg", label: "Weight (kg)", type: "number" },
      { key: "steps", label: "Daily Steps", type: "number" },
      { key: "calories", label: "Calories (kcal)", type: "number" },
      { key: "protein_g", label: "Protein (grams)", type: "number" },
      { key: "water_ml", label: "Water Intake (ml)", type: "number" },
      { key: "workout", label: "Workout / Exercise (Sets × Reps)", type: "text" },
      { key: "duration_minutes", label: "Duration (minutes)", type: "number" },
      { key: "notes", label: "Workout & Meal Notes", type: "textarea" },
    ],
  },

  skills: {
    appNumber: 4,
    title: "Technical Skills",
    shortTitle: "Skills",
    description: "Technologies, proficiency levels, roadmaps, learning hours and coding practice.",
    icon: "Code",
    emoji: "💻",
    accentColor: "#06b6d4",
    gradient: "from-cyan-900/30 via-blue-900/15 to-transparent",
    accentBadge: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
    themeStyle: {
      bgGradient: "radial-gradient(ellipse at top, rgba(6, 182, 212, 0.15), transparent 70%)",
      cardBorder: "rgba(6, 182, 212, 0.25)",
      accentGlow: "rgba(6, 182, 212, 0.35)",
      textAccent: "text-cyan-400",
    },
    subsections: [
      { id: "prog_languages", label: "Programming Languages" },
      { id: "frontend_dev", label: "Frontend Development" },
      { id: "backend_dev", label: "Backend Development" },
      { id: "databases", label: "Database Technologies" },
      { id: "cloud_devops", label: "Cloud & DevOps" },
      { id: "data_analytics", label: "Data Analytics & AI" },
      { id: "software_tools", label: "Software & Tools" },
      { id: "proficiency_levels", label: "Proficiency Levels" },
      { id: "learning_roadmaps", label: "Learning Roadmaps" },
      { id: "practice_activities", label: "Practice Activities" },
      { id: "learning_hours", label: "Learning Hours" },
      { id: "skill_analytics", label: "Skill Analytics" },
    ],
    fields: [
      { key: "subcategory", label: "Subsection", type: "select", options: [
        "Programming Languages", "Frontend Development", "Backend Development", "Database Technologies",
        "Cloud & DevOps", "Data Analytics & AI", "Software & Tools", "Proficiency Levels",
        "Learning Roadmaps", "Practice Activities", "Learning Hours", "Skill Analytics"
      ] },
      { key: "technology", label: "Technology / Skill", type: "text", required: true },
      { key: "level", label: "Current Level", type: "select", options: ["Beginner", "Intermediate", "Advanced", "Expert"] },
      { key: "progress", label: "Progress (%)", type: "number" },
      { key: "practice_hours", label: "Practice Hours Logged", type: "number" },
      { key: "next_step", label: "Next Roadmap Goal", type: "textarea" },
    ],
  },

  certifications: {
    appNumber: 5,
    title: "Certifications",
    shortTitle: "Certs",
    description: "Store professional achievements, issuing orgs, credential links and PDF certificates.",
    icon: "Award",
    emoji: "🏆",
    accentColor: "#eab308",
    gradient: "from-amber-900/30 via-yellow-900/15 to-transparent",
    accentBadge: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    themeStyle: {
      bgGradient: "radial-gradient(ellipse at top, rgba(234, 179, 8, 0.15), transparent 70%)",
      cardBorder: "rgba(234, 179, 8, 0.25)",
      accentGlow: "rgba(234, 179, 8, 0.35)",
      textAccent: "text-amber-400",
    },
    subsections: [
      { id: "cert_dashboard", label: "Certificate Dashboard" },
      { id: "upload_cert", label: "Upload Certificates" },
      { id: "cert_title", label: "Certificate Title" },
      { id: "issuing_org", label: "Issuing Organization" },
      { id: "issue_date", label: "Issue Date" },
      { id: "expiry_date", label: "Expiry Date" },
      { id: "cert_category", label: "Certificate Category" },
      { id: "skills_obtained", label: "Skills Obtained" },
      { id: "verification_link", label: "Verification Link" },
      { id: "cert_preview", label: "Certificate Preview" },
      { id: "search_filter", label: "Search & Filters" },
      { id: "achievement_stats", label: "Achievement Stats" },
    ],
    fields: [
      { key: "subcategory", label: "Subsection", type: "select", options: [
        "Certificate Dashboard", "Upload Certificates", "Certificate Title", "Issuing Organization",
        "Issue Date", "Expiry Date", "Certificate Category", "Skills Obtained",
        "Verification Link", "Certificate Preview", "Search & Filters", "Achievement Stats"
      ] },
      { key: "issuer", label: "Issuing Organization", type: "text" },
      { key: "issue_date", label: "Issue Date", type: "date" },
      { key: "expiry_date", label: "Expiry Date (if applicable)", type: "date" },
      { key: "credential_url", label: "Verification / Credential URL", type: "url" },
      { key: "category", label: "Category", type: "select", options: ["Cloud Computing", "AI & Data Science", "Web Development", "Cybersecurity", "Management", "Other"] },
      { key: "description", label: "Skills Obtained & Notes", type: "textarea" },
    ],
  },

  projects: {
    appNumber: 6,
    title: "Project Management",
    shortTitle: "Projects",
    description: "Personal and client projects, Kanban boards, milestones, tasks and GitHub repositories.",
    icon: "FolderKanban",
    emoji: "🚀",
    accentColor: "#f97316",
    gradient: "from-orange-900/30 via-amber-900/15 to-transparent",
    accentBadge: "bg-orange-500/15 text-orange-400 border-orange-500/30",
    themeStyle: {
      bgGradient: "radial-gradient(ellipse at top, rgba(249, 115, 22, 0.15), transparent 70%)",
      cardBorder: "rgba(249, 115, 22, 0.25)",
      accentGlow: "rgba(249, 115, 22, 0.35)",
      textAccent: "text-orange-400",
    },
    subsections: [
      { id: "project_dashboard", label: "Project Dashboard" },
      { id: "create_projects", label: "Create Projects" },
      { id: "descriptions", label: "Project Specs" },
      { id: "categories", label: "Project Categories" },
      { id: "deadlines", label: "Project Deadlines" },
      { id: "task_management", label: "Task Management" },
      { id: "kanban_board", label: "Kanban Board" },
      { id: "milestones", label: "Project Milestones" },
      { id: "github_links", label: "GitHub Repositories" },
      { id: "team_members", label: "Team Members" },
      { id: "project_status", label: "Project Status" },
      { id: "project_analytics", label: "Project Analytics" },
    ],
    fields: [
      { key: "subcategory", label: "Subsection", type: "select", options: [
        "Project Dashboard", "Create Projects", "Project Specs", "Project Categories",
        "Project Deadlines", "Task Management", "Kanban Board", "Project Milestones",
        "GitHub Repositories", "Team Members", "Project Status", "Project Analytics"
      ] },
      { key: "status", label: "Kanban Stage", type: "select", options: ["Backlog", "To Do", "In Progress", "In Review", "Completed"] },
      { key: "technologies", label: "Tech Stack", type: "text", placeholder: "Next.js, Supabase, Tailwind, Python" },
      { key: "github_url", label: "GitHub Repository URL", type: "url" },
      { key: "demo_url", label: "Live Production URL", type: "url" },
      { key: "deadline", label: "Target Deadline", type: "date" },
      { key: "notes", label: "Project Scope & Description", type: "textarea" },
    ],
  },

  journal: {
    appNumber: 7,
    title: "Daily Journal",
    shortTitle: "Journal",
    description: "Private digital diary, mood tracking, daily reflections, achievements and memories.",
    icon: "NotebookPen",
    emoji: "✍️",
    accentColor: "#f43f5e",
    gradient: "from-rose-900/30 via-pink-900/15 to-transparent",
    accentBadge: "bg-rose-500/15 text-rose-400 border-rose-500/30",
    themeStyle: {
      bgGradient: "radial-gradient(ellipse at top, rgba(244, 63, 94, 0.15), transparent 70%)",
      cardBorder: "rgba(244, 63, 94, 0.25)",
      accentGlow: "rgba(244, 63, 94, 0.35)",
      textAccent: "text-rose-400",
    },
    subsections: [
      { id: "today_journal", label: "Today's Journal" },
      { id: "create_entry", label: "Create Entry" },
      { id: "reflections", label: "Daily Reflections" },
      { id: "mood_tracking", label: "Mood Tracking" },
      { id: "memories", label: "Important Memories" },
      { id: "achievements", label: "Daily Achievements" },
      { id: "thoughts", label: "Personal Thoughts" },
      { id: "private_notes", label: "Private Notes" },
      { id: "search_journal", label: "Search Journal" },
      { id: "calendar_entries", label: "Calendar-based Entries" },
      { id: "favourite_entries", label: "Favourite Entries" },
      { id: "monthly_summary", label: "Monthly Summary" },
    ],
    fields: [
      { key: "subcategory", label: "Subsection", type: "select", options: [
        "Today's Journal", "Create Entry", "Daily Reflections", "Mood Tracking",
        "Important Memories", "Daily Achievements", "Personal Thoughts", "Private Notes",
        "Search Journal", "Calendar-based Entries", "Favourite Entries", "Monthly Summary"
      ] },
      { key: "mood", label: "Mood Rating", type: "select", options: ["⚡ Productive & Focused", "✨ Inspired & Happy", "😊 Calm & Satisfied", "😐 Neutral / Normal", "🌧️ Low / Stressed"] },
      { key: "highlights", label: "Today's Highlights", type: "textarea" },
      { key: "learning", label: "What I Learned Today", type: "textarea" },
      { key: "tomorrow", label: "Tomorrow's Core Priority", type: "textarea" },
    ],
  },

  expenses: {
    appNumber: 8,
    title: "Expense Tracker",
    shortTitle: "Expenses",
    description: "Personal money management, income, expenses, monthly budgets and spending charts.",
    icon: "Wallet",
    emoji: "💰",
    accentColor: "#10b981",
    gradient: "from-emerald-950/40 via-green-900/15 to-transparent",
    accentBadge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    themeStyle: {
      bgGradient: "radial-gradient(ellipse at top, rgba(16, 185, 129, 0.18), transparent 70%)",
      cardBorder: "rgba(16, 185, 129, 0.25)",
      accentGlow: "rgba(16, 185, 129, 0.35)",
      textAccent: "text-emerald-400",
    },
    subsections: [
      { id: "finance_dashboard", label: "Finance Dashboard" },
      { id: "income_tracking", label: "Income Tracking" },
      { id: "expense_tracking", label: "Expense Tracking" },
      { id: "transaction_history", label: "Transaction History" },
      { id: "expense_categories", label: "Expense Categories" },
      { id: "monthly_budget", label: "Monthly Budget" },
      { id: "savings_goals", label: "Savings Goals" },
      { id: "recurring_tx", label: "Recurring Subscriptions" },
      { id: "spending_charts", label: "Spending Charts" },
      { id: "monthly_comparison", label: "Monthly Comparison" },
      { id: "financial_reports", label: "Financial Reports" },
      { id: "export_reports", label: "Export Reports (CSV)" },
    ],
    fields: [
      { key: "subcategory", label: "Subsection", type: "select", options: [
        "Finance Dashboard", "Income Tracking", "Expense Tracking", "Transaction History",
        "Expense Categories", "Monthly Budget", "Savings Goals", "Recurring Subscriptions",
        "Spending Charts", "Monthly Comparison", "Financial Reports", "Export Reports (CSV)"
      ] },
      { key: "type", label: "Type", type: "select", options: ["Expense", "Income"] },
      { key: "amount", label: "Amount (INR ₹)", type: "number", required: true },
      { key: "category", label: "Category", type: "select", options: ["Food & Dining", "Travel & Fuel", "Education & Books", "Shopping", "Bills & Utilities", "Health & Fitness", "Software Subscriptions", "Entertainment", "Other"] },
      { key: "payment_method", label: "Payment Method", type: "select", options: ["UPI (GPay / PhonePe)", "Credit / Debit Card", "Net Banking", "Cash", "Other"] },
      { key: "notes", label: "Notes & Merchant", type: "textarea" },
    ],
  },

  goals: {
    appNumber: 9,
    title: "Goals and Habits",
    shortTitle: "Goals & Habits",
    description: "Daily habits, streak tracking, long-term milestones and achievement badges.",
    icon: "Target",
    emoji: "🎯",
    accentColor: "#d946ef",
    gradient: "from-fuchsia-900/30 via-purple-900/15 to-transparent",
    accentBadge: "bg-fuchsia-500/15 text-fuchsia-400 border-fuchsia-500/30",
    themeStyle: {
      bgGradient: "radial-gradient(ellipse at top, rgba(217, 70, 239, 0.15), transparent 70%)",
      cardBorder: "rgba(217, 70, 239, 0.25)",
      accentGlow: "rgba(217, 70, 239, 0.35)",
      textAccent: "text-fuchsia-400",
    },
    subsections: [
      { id: "goals_dashboard", label: "Goals Dashboard" },
      { id: "daily_habits", label: "Daily Habits" },
      { id: "weekly_habits", label: "Weekly Habits" },
      { id: "monthly_habits", label: "Monthly Habits" },
      { id: "habit_completion", label: "Habit Completion" },
      { id: "streak_tracking", label: "Streak Tracking" },
      { id: "goal_deadlines", label: "Goal Deadlines" },
      { id: "goal_milestones", label: "Goal Milestones" },
      { id: "progress_percentage", label: "Progress %" },
      { id: "habit_reminders", label: "Habit Reminders" },
      { id: "achievement_badges", label: "Achievement Badges" },
      { id: "habit_analytics", label: "Habit Analytics" },
    ],
    fields: [
      { key: "subcategory", label: "Subsection", type: "select", options: [
        "Goals Dashboard", "Daily Habits", "Weekly Habits", "Monthly Habits",
        "Habit Completion", "Streak Tracking", "Goal Deadlines", "Goal Milestones",
        "Progress %", "Habit Reminders", "Achievement Badges", "Habit Analytics"
      ] },
      { key: "category", label: "Category", type: "select", options: ["Career & Coding", "Education & Reading", "Fitness & Health", "Finance & Savings", "Personal Growth"] },
      { key: "frequency", label: "Frequency", type: "select", options: ["Daily", "Weekdays", "Weekly", "Monthly Target"] },
      { key: "target_date", label: "Target Date", type: "date" },
      { key: "progress", label: "Progress (%)", type: "number" },
      { key: "status", label: "Status", type: "select", options: ["In Progress", "Completed", "On Track", "Needs Attention"] },
      { key: "next_action", label: "Immediate Next Action", type: "textarea" },
    ],
  },

  habits: {
    appNumber: 9,
    title: "Habit Tracker",
    shortTitle: "Habits",
    description: "Daily habits, streak tracking, recurring routines and completion matrices.",
    icon: "Repeat",
    emoji: "⚡",
    accentColor: "#f59e0b",
    gradient: "from-amber-900/30 via-orange-900/15 to-transparent",
    accentBadge: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    themeStyle: {
      bgGradient: "radial-gradient(ellipse at top, rgba(245, 158, 11, 0.15), transparent 70%)",
      cardBorder: "rgba(245, 158, 11, 0.25)",
      accentGlow: "rgba(245, 158, 11, 0.35)",
      textAccent: "text-amber-400",
    },
    subsections: [
      { id: "goals_dashboard", label: "Goals Dashboard" },
      { id: "daily_habits", label: "Daily Habits" },
      { id: "weekly_habits", label: "Weekly Habits" },
      { id: "monthly_habits", label: "Monthly Habits" },
      { id: "habit_completion", label: "Habit Completion" },
      { id: "streak_tracking", label: "Streak Tracking" },
      { id: "goal_deadlines", label: "Goal Deadlines" },
      { id: "goal_milestones", label: "Goal Milestones" },
      { id: "progress_percentage", label: "Progress %" },
      { id: "habit_reminders", label: "Habit Reminders" },
      { id: "achievement_badges", label: "Achievement Badges" },
      { id: "habit_analytics", label: "Habit Analytics" },
    ],
    fields: [
      { key: "frequency", label: "Frequency", type: "select", options: ["Daily", "Weekdays", "Weekly"] },
      { key: "target", label: "Target (e.g. Read 20 pages)", type: "text" },
      { key: "completed", label: "Completed Today", type: "select", options: ["Yes", "No"] },
      { key: "streak_days", label: "Current Streak (Days)", type: "number" },
      { key: "notes", label: "Notes & Reflections", type: "textarea" },
    ],
  },

  tasks: {
    appNumber: 11,
    title: "Task Management",
    shortTitle: "Tasks",
    description: "Actionable to-dos, priorities, deadlines, reminders and status tracking.",
    icon: "ListTodo",
    emoji: "✅",
    accentColor: "#3b82f6",
    gradient: "from-blue-900/30 via-cyan-900/15 to-transparent",
    accentBadge: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    themeStyle: {
      bgGradient: "radial-gradient(ellipse at top, rgba(59, 130, 246, 0.15), transparent 70%)",
      cardBorder: "rgba(59, 130, 246, 0.25)",
      accentGlow: "rgba(59, 130, 246, 0.35)",
      textAccent: "text-blue-400",
    },
    subsections: [
      { id: "daily_calendar", label: "Daily Calendar" },
      { id: "weekly_calendar", label: "Weekly Calendar" },
      { id: "monthly_calendar", label: "Monthly Calendar" },
      { id: "create_tasks", label: "Create Tasks" },
      { id: "task_priorities", label: "Task Priorities" },
      { id: "due_dates", label: "Due Dates" },
      { id: "reminders", label: "Reminders" },
      { id: "important_events", label: "Important Events" },
      { id: "completed_tasks", label: "Completed Tasks" },
      { id: "pending_tasks", label: "Pending Tasks" },
      { id: "recurring_tasks", label: "Recurring Tasks" },
      { id: "calendar_analytics", label: "Calendar Analytics" },
    ],
    fields: [
      { key: "priority", label: "Priority", type: "select", options: ["High", "Medium", "Low"] },
      { key: "status", label: "Status", type: "select", options: ["To Do", "In Progress", "Completed"] },
      { key: "due_date", label: "Due Date", type: "date" },
      { key: "notes", label: "Task Details", type: "textarea" },
    ],
  },

  calendar: {
    appNumber: 11,
    title: "Calendar and Tasks",
    shortTitle: "Calendar & Tasks",
    description: "Daily, weekly and monthly schedules, deadlines, events, reminders and task priorities.",
    icon: "CalendarDays",
    emoji: "🗓️",
    accentColor: "#0ea5e9",
    gradient: "from-sky-900/30 via-indigo-900/15 to-transparent",
    accentBadge: "bg-sky-500/15 text-sky-400 border-sky-500/30",
    themeStyle: {
      bgGradient: "radial-gradient(ellipse at top, rgba(14, 165, 233, 0.15), transparent 70%)",
      cardBorder: "rgba(14, 165, 233, 0.25)",
      accentGlow: "rgba(14, 165, 233, 0.35)",
      textAccent: "text-sky-400",
    },
    subsections: [
      { id: "daily_calendar", label: "Daily Calendar" },
      { id: "weekly_calendar", label: "Weekly Calendar" },
      { id: "monthly_calendar", label: "Monthly Calendar" },
      { id: "create_tasks", label: "Create Tasks" },
      { id: "task_priorities", label: "Task Priorities" },
      { id: "due_dates", label: "Due Dates" },
      { id: "reminders", label: "Reminders" },
      { id: "important_events", label: "Important Events" },
      { id: "completed_tasks", label: "Completed Tasks" },
      { id: "pending_tasks", label: "Pending Tasks" },
      { id: "recurring_tasks", label: "Recurring Tasks" },
      { id: "calendar_analytics", label: "Calendar Analytics" },
    ],
    fields: [
      { key: "subcategory", label: "Subsection", type: "select", options: [
        "Daily Calendar", "Weekly Calendar", "Monthly Calendar", "Create Tasks",
        "Task Priorities", "Due Dates", "Reminders", "Important Events",
        "Completed Tasks", "Pending Tasks", "Recurring Tasks", "Calendar Analytics"
      ] },
      { key: "priority", label: "Priority", type: "select", options: ["High", "Medium", "Low"] },
      { key: "status", label: "Status", type: "select", options: ["To Do", "In Progress", "Completed"] },
      { key: "start_time", label: "Time / Schedule", type: "text", placeholder: "09:30 AM" },
      { key: "location", label: "Location / Video Call Link", type: "text" },
      { key: "notes", label: "Event / Task Notes", type: "textarea" },
    ],
  },
} satisfies Record<string, ModuleConfig>;

export type ModuleKey = keyof typeof MODULES;
export function isModuleKey(value: string): value is ModuleKey {
  return Object.prototype.hasOwnProperty.call(MODULES, value);
}

export type ApplicationCatalogItem = {
  appNumber: number;
  key: string;
  title: string;
  shortTitle: string;
  description: string;
  route: string;
  icon: string;
  emoji: string;
  gradient: string;
  accentBadge: string;
  subsectionsCount: number;
};

export const TWELVE_APPLICATIONS: ApplicationCatalogItem[] = [
  {
    appNumber: 1,
    key: "dashboard",
    title: "Personal Dashboard",
    shortTitle: "Dashboard",
    description: "Central command centre for the entire MyLife OS. Shows live information from all applications.",
    route: "/dashboard",
    icon: "Home",
    emoji: "⚡",
    gradient: "from-blue-900/35 via-indigo-950/20 to-transparent",
    accentBadge: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    subsectionsCount: 12,
  },
  {
    appNumber: 2,
    key: "study",
    title: "Study Management",
    shortTitle: "Study",
    description: "Academic syllabus, units, notes, assignments, exams, study hours and subject analytics.",
    route: "/dashboard/study",
    icon: "BookOpen",
    emoji: "📚",
    gradient: "from-indigo-900/35 via-violet-950/20 to-transparent",
    accentBadge: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
    subsectionsCount: 12,
  },
  {
    appNumber: 3,
    key: "fitness",
    title: "Fitness Tracker",
    shortTitle: "Fitness",
    description: "Complete fitness suite: weight logs, workout plans, steps, meal calories, protein & water.",
    route: "/dashboard/fitness",
    icon: "Dumbbell",
    emoji: "🏋️",
    gradient: "from-emerald-900/35 via-teal-950/20 to-transparent",
    accentBadge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    subsectionsCount: 12,
  },
  {
    appNumber: 4,
    key: "skills",
    title: "Technical Skills",
    shortTitle: "Skills",
    description: "Programming, frontend, backend, databases, cloud, learning roadmaps and practice hours.",
    route: "/dashboard/skills",
    icon: "Code",
    emoji: "💻",
    gradient: "from-cyan-900/35 via-blue-950/20 to-transparent",
    accentBadge: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
    subsectionsCount: 12,
  },
  {
    appNumber: 5,
    key: "certifications",
    title: "Certifications",
    shortTitle: "Certs",
    description: "Store professional certificates, issuing orgs, expiry dates, verification links and stats.",
    route: "/dashboard/certifications",
    icon: "Award",
    emoji: "🏆",
    gradient: "from-amber-900/35 via-yellow-950/20 to-transparent",
    accentBadge: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    subsectionsCount: 12,
  },
  {
    appNumber: 6,
    key: "projects",
    title: "Project Management",
    shortTitle: "Projects",
    description: "Personal and client projects, modern Kanban boards, milestones, GitHub repos and progress.",
    route: "/dashboard/projects",
    icon: "FolderKanban",
    emoji: "🚀",
    gradient: "from-orange-900/35 via-amber-950/20 to-transparent",
    accentBadge: "bg-orange-500/15 text-orange-400 border-orange-500/30",
    subsectionsCount: 12,
  },
  {
    appNumber: 7,
    key: "journal",
    title: "Daily Journal",
    shortTitle: "Journal",
    description: "Private digital diary, reflections, mood tracking, memories, daily wins and monthly summaries.",
    route: "/dashboard/journal",
    icon: "NotebookPen",
    emoji: "✍️",
    gradient: "from-rose-900/35 via-pink-950/20 to-transparent",
    accentBadge: "bg-rose-500/15 text-rose-400 border-rose-500/30",
    subsectionsCount: 12,
  },
  {
    appNumber: 8,
    key: "expenses",
    title: "Expense Tracker",
    shortTitle: "Expenses",
    description: "Income, spending, transaction logs, monthly budgets, savings goals and financial charts.",
    route: "/dashboard/expenses",
    icon: "Wallet",
    emoji: "💰",
    gradient: "from-emerald-950/45 via-green-900/20 to-transparent",
    accentBadge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    subsectionsCount: 12,
  },
  {
    appNumber: 9,
    key: "goals",
    title: "Goals and Habits",
    shortTitle: "Goals & Habits",
    description: "Daily habit matrix, streak counters, goal milestones, progress percentage and badge rewards.",
    route: "/dashboard/goals",
    icon: "Target",
    emoji: "🎯",
    gradient: "from-fuchsia-900/35 via-purple-950/20 to-transparent",
    accentBadge: "bg-fuchsia-500/15 text-fuchsia-400 border-fuchsia-500/30",
    subsectionsCount: 12,
  },
  {
    appNumber: 10,
    key: "files",
    title: "Personal File Manager",
    shortTitle: "Files",
    description: "Organize documents, PDFs, photos and private notes with secure cloud storage & download URLs.",
    route: "/dashboard/files",
    icon: "Files",
    emoji: "📁",
    gradient: "from-sky-950/40 via-cyan-900/20 to-transparent",
    accentBadge: "bg-sky-500/15 text-sky-400 border-sky-500/30",
    subsectionsCount: 12,
  },
  {
    appNumber: 11,
    key: "calendar",
    title: "Calendar and Tasks",
    shortTitle: "Calendar & Tasks",
    description: "Daily, weekly and monthly views, priority tasks, reminders, due dates and recurring events.",
    route: "/dashboard/calendar",
    icon: "CalendarDays",
    emoji: "🗓️",
    gradient: "from-blue-900/35 via-teal-950/20 to-transparent",
    accentBadge: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    subsectionsCount: 12,
  },
  {
    appNumber: 12,
    key: "analytics",
    title: "Personal Analytics",
    shortTitle: "Analytics",
    description: "Cross-application business intelligence, real database productivity stats and date-range graphs.",
    route: "/dashboard/analytics",
    icon: "Activity",
    emoji: "📊",
    gradient: "from-purple-950/45 via-violet-900/20 to-transparent",
    accentBadge: "bg-purple-500/15 text-purple-400 border-purple-500/30",
    subsectionsCount: 12,
  },
];
