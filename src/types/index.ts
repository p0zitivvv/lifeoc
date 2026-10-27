// LIFE OS — Comprehensive Domain Types & Interfaces

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday, 1 = Monday, ...

export type Priority = "low" | "medium" | "high" | "urgent";

export type TaskCategory =
  | "education"
  | "fitness"
  | "nutrition"
  | "self_care"
  | "work"
  | "chores"
  | "recovery"
  | "other";

export type TaskStatus =
  | "scheduled"
  | "in_progress"
  | "completed"
  | "skipped"
  | "cancelled";

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface RecurrenceRule {
  frequency: "daily" | "weekly" | "weekdays" | "weekends" | "custom";
  daysOfWeek?: DayOfWeek[]; // [1, 2, 3, 4, 5]
  interval?: number; // every N days/weeks
  endDate?: string; // ISO date
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  category: TaskCategory;
  date: string; // YYYY-MM-DD
  startTime?: string; // HH:MM (24-hour)
  durationMinutes: number;
  deadline?: string; // ISO string or YYYY-MM-DD HH:MM
  priority: Priority;
  status: TaskStatus;
  subtasks: SubTask[];
  recurrence?: RecurrenceRule;
  isRecurringTemplate?: boolean;
  parentTemplateId?: string;
  goalId?: string;
  subjectId?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  notes?: string;
}

// Habits
export type HabitCategory =
  | "self_care"
  | "education"
  | "fitness"
  | "nutrition"
  | "hydration"
  | "digital_discipline"
  | "recovery"
  | "micro_habit"
  | "cold_shower"
  | "custom";

export type HabitMeasurementType = "boolean" | "duration" | "count" | "volume";

export interface Habit {
  id: string;
  title: string;
  description?: string;
  category: HabitCategory;
  measurementType: HabitMeasurementType;
  targetValue: number; // e.g., 1 for boolean, 25 for 25 mins, 2000 for ml, 50 for reps
  unit?: string; // 'мин', 'раз', 'мл', 'стр'
  frequency: "daily" | "weekdays" | "weekends" | "specific_days";
  daysOfWeek: DayOfWeek[];
  preferredTime?: string; // HH:MM
  timeOfDay?: "morning" | "afternoon" | "evening" | "anytime";
  reminderEnabled: boolean;
  reminderTime?: string; // HH:MM
  startDate: string; // YYYY-MM-DD
  endDate?: string;
  isActive: boolean;
  isArchived: boolean;
  isOptional?: boolean; // e.g. cold shower
  sortOrder?: number;
  createdAt: string;
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string; // YYYY-MM-DD
  value: number; // actual logged value
  completed: boolean;
  completedAt?: string;
  notes?: string;
}

// Education
export interface Subject {
  id: string;
  name: string;
  color: string;
  priority: Priority;
  weeklyTargetHours: number;
  examDate?: string;
  topics: string[];
}

export interface StudyGoal {
  id: string;
  subjectId: string;
  title: string;
  targetHours: number;
  completedHours: number;
  deadline?: string;
  status: "active" | "completed" | "paused";
}

export interface StudySession {
  id: string;
  subjectId: string;
  taskId?: string;
  topic?: string;
  startTime: string; // ISO
  endTime?: string; // ISO
  durationSeconds: number; // actual duration in seconds
  plannedDurationSeconds: number;
  breakDurationSeconds: number;
  completed: boolean;
  notes?: string;
  date: string; // YYYY-MM-DD
}

export interface FocusTimerState {
  isRunning: boolean;
  isPaused: boolean;
  mode: "work" | "shortBreak" | "longBreak";
  workDurationMinutes: number; // default 25
  shortBreakMinutes: number; // default 5
  longBreakMinutes: number; // default 15
  cyclesBeforeLongBreak: number; // default 4
  currentCycle: number;
  selectedSubjectId?: string;
  selectedTaskId?: string;
  selectedTopic?: string;
  startTimestamp?: number; // Date.now() timestamp when interval started
  accumulatedSeconds: number;
  targetSeconds: number;
}

// Fitness
export type ExerciseType = "reps" | "duration" | "weight_reps";

export interface WorkoutExercise {
  id: string;
  name: string;
  type: ExerciseType;
  category: "pushups" | "pullups" | "dumbbells" | "squats" | "plank" | "custom";
  defaultSets: number;
  defaultReps?: number;
  defaultWeightKg?: number;
  defaultDurationSeconds?: number;
}

export interface WorkoutSet {
  setNumber: number;
  plannedReps?: number;
  actualReps?: number;
  plannedWeightKg?: number;
  actualWeightKg?: number;
  durationSeconds?: number;
  completed: boolean;
}

export interface WorkoutSessionExercise {
  exerciseId: string;
  exerciseName: string;
  type: ExerciseType;
  sets: WorkoutSet[];
  notes?: string;
}

export interface WorkoutSession {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  startTime: string;
  endTime?: string;
  exercises: WorkoutSessionExercise[];
  completed: boolean;
  feelingScore?: 1 | 2 | 3 | 4 | 5; // 1 = poor, 5 = great
  notes?: string;
  restTimerSeconds: number;
}

// Nutrition
export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export interface FoodItem {
  id: string;
  mealId?: string;
  name: string;
  portion: string; // e.g. "1 тарелка", "250 г"
  calories?: number;
  proteinGrams?: number;
  fatGrams?: number;
  carbsGrams?: number;
  notes?: string;
  isFrequent?: boolean;
}

export interface Meal {
  id: string;
  date: string; // YYYY-MM-DD
  mealType: MealType;
  time: string; // HH:MM
  items: FoodItem[];
  notes?: string;
}

export interface SugarReductionPreference {
  enabled: boolean;
  goalType:
    | "cut_sugary_drinks"
    | "limit_sweet_snacks"
    | "gradual_reduction"
    | "balanced_diet";
  dailyTargetChecks?: number; // e.g. 1 check per day
  notes?: string;
}

// Hydration
export interface WaterLog {
  id: string;
  date: string; // YYYY-MM-DD
  timestamp: string; // ISO
  volumeMl: number;
}

export interface WaterSettings {
  dailyTargetMl: number; // default e.g. 2000 ml (safe, non-excessive)
  cupSizesMl: number[]; // [200, 250, 350, 500]
  reminderIntervalHours: number;
  reminderStartTime: string; // e.g. "08:30"
  reminderEndTime: string; // e.g. "21:00"
}

// Digital Discipline
export interface DigitalDisciplineSettings {
  screenOffTime: string; // e.g. "22:00"
  reminderBeforeMinutes: number; // e.g. 30 min before
  detoxDayOfWeek: DayOfWeek; // e.g. 0 = Sunday
  allowEmergencyExceptions: boolean;
}

export interface DigitalDisciplineLog {
  id: string;
  date: string; // YYYY-MM-DD
  screenOffObserved: boolean;
  screenOffTimeActual?: string;
  isDetoxDay: boolean;
  detoxObserved: boolean;
  exceptionsNotes?: string;
  checklistCompleted: {
    workFinished: boolean;
    phonePutAway: boolean;
    readyForTomorrow: boolean;
    eveningCareDone: boolean;
  };
}

// Recovery & Sleep
export interface SleepSettings {
  targetBedtime: string; // e.g. "22:30"
  targetWakeTime: string; // e.g. "06:30"
  windDownReminderMinutes: number; // e.g. 45 min before
}

export interface SleepLog {
  id: string;
  date: string; // YYYY-MM-DD for the night/morning
  bedTime: string; // HH:MM
  wakeTime: string; // HH:MM
  totalSleepMinutes: number;
  qualityRating: 1 | 2 | 3 | 4 | 5; // 1-5 scale
  wakeFeeling: "refreshed" | "normal" | "tired" | "exhausted";
  notes?: string;
}

// Daily Check-In
export interface DailyCheckIn {
  id: string;
  date: string; // YYYY-MM-DD
  energyLevel: 1 | 2 | 3 | 4 | 5; // 1 = very low, 5 = energetic
  availableFreeHours: number;
  hasSpecialConstraints: boolean;
  constraintNotes?: string;
  lightenLoadRequested: boolean;
  timestamp: string;
}

// User Profile & Day Routine
export interface UserScheduleRoutine {
  wakeTime: string; // e.g. "07:00"
  sleepTime: string; // e.g. "23:00"
  workOrSchoolStart: string; // e.g. "09:00"
  workOrSchoolEnd: string; // e.g. "15:30"
  commuteMinutes: number; // e.g. 30
  fixedStudyDays: DayOfWeek[]; // e.g. [1, 2, 3, 4, 5]
  workoutDays: DayOfWeek[]; // e.g. [1, 3, 5]
  restDays: DayOfWeek[]; // e.g. [0, 6]
}

export interface UserProfile {
  id: string;
  name: string;
  onboardingCompleted: boolean;
  timezone: string;
  language: "ru";
  theme: "dark";
  routine: UserScheduleRoutine;
  waterSettings: WaterSettings;
  digitalSettings: DigitalDisciplineSettings;
  sleepSettings: SleepSettings;
  sugarSettings: SugarReductionPreference;
  minimumForTodayHabitIds: string[]; // key action IDs
  createdAt: string;
  updatedAt: string;
}

// Auto-Scheduler Models
export interface ScheduledTimeSlot {
  id: string;
  type: "fixed_commitment" | "habit" | "task" | "study" | "workout" | "break" | "recovery";
  referenceId?: string;
  title: string;
  category: TaskCategory;
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  durationMinutes: number;
  isFixed: boolean;
  isCompleted: boolean;
  isSkipped: boolean;
  priority: Priority;
  notes?: string;
}

export interface DailyPlan {
  id: string;
  date: string; // YYYY-MM-DD
  slots: ScheduledTimeSlot[];
  generatedAt: string;
  lastRecalculatedAt?: string;
  isOverloaded: boolean;
  conflictDetails?: string[];
  totalScheduledMinutes: number;
  availableMinutes: number;
}

// Notification System
export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  category: HabitCategory | "general";
  scheduledTime: string; // ISO
  delivered: boolean;
  read: boolean;
  actionUrl?: string;
  createdAt: string;
}

export interface NotificationSettings {
  inAppEnabled: boolean;
  browserPushEnabled: boolean;
  quietHoursStart: string; // "22:30"
  quietHoursEnd: string; // "07:00"
  categories: Record<HabitCategory, boolean>;
}

// Analytics Summary
export interface AnalyticsSummary {
  periodDays: 7 | 30 | 90;
  taskCompletionRate: number; // 0 to 100 or null if no eligible
  eligibleTaskCount: number;
  completedTaskCount: number;
  plannedStudyMinutes: number;
  actualStudyMinutes: number;
  studyCompletionRate: number; // 0 to 100 or null
  habitCompletionRate: number; // 0 to 100 or null
  totalHabitOccurrences: number;
  completedHabitOccurrences: number;
  totalLoggedWaterMl: number;
  avgDailyWaterMl: number;
  waterTargetAttainmentRate: number;
  totalWorkoutsCompleted: number;
  digitalDetoxSuccessDays: number;
  avgSleepMinutes: number;
  currentStreakDays: number;
  bestStreakDays: number;
  activeDaysCount: number;
}
