import Dexie, { type EntityTable } from "dexie";
import type {
  Task,
  Habit,
  HabitLog,
  Subject,
  StudyGoal,
  StudySession,
  WorkoutExercise,
  WorkoutSession,
  Meal,
  WaterLog,
  DigitalDisciplineLog,
  SleepLog,
  DailyCheckIn,
  UserProfile,
  DailyPlan,
  NotificationItem,
} from "@/types";

export class LifeOSDatabase extends Dexie {
  userProfile!: EntityTable<UserProfile, "id">;
  tasks!: EntityTable<Task, "id">;
  habits!: EntityTable<Habit, "id">;
  habitLogs!: EntityTable<HabitLog, "id">;
  subjects!: EntityTable<Subject, "id">;
  studyGoals!: EntityTable<StudyGoal, "id">;
  studySessions!: EntityTable<StudySession, "id">;
  workoutExercises!: EntityTable<WorkoutExercise, "id">;
  workoutSessions!: EntityTable<WorkoutSession, "id">;
  meals!: EntityTable<Meal, "id">;
  waterLogs!: EntityTable<WaterLog, "id">;
  digitalLogs!: EntityTable<DigitalDisciplineLog, "id">;
  sleepLogs!: EntityTable<SleepLog, "id">;
  dailyCheckins!: EntityTable<DailyCheckIn, "id">;
  dailyPlans!: EntityTable<DailyPlan, "id">;
  notifications!: EntityTable<NotificationItem, "id">;

  constructor() {
    super("LifeOSDatabase");
    this.version(1).stores({
      userProfile: "id",
      tasks: "id, date, status, priority, category, parentTemplateId",
      habits: "id, category, isActive, isArchived, frequency",
      habitLogs: "id, habitId, date, [habitId+date]",
      subjects: "id, priority",
      studyGoals: "id, subjectId, status",
      studySessions: "id, subjectId, date, completed",
      workoutExercises: "id, category",
      workoutSessions: "id, date, completed",
      meals: "id, date, mealType",
      waterLogs: "id, date, timestamp",
      digitalLogs: "id, date",
      sleepLogs: "id, date",
      dailyCheckins: "id, date",
      dailyPlans: "id, date",
      notifications: "id, scheduledTime, delivered, read, category",
    });
  }
}

// Single instance for client-side
let dbInstance: LifeOSDatabase | null = null;

export function getDb(): LifeOSDatabase {
  if (typeof window === "undefined") {
    // SSR guard
    return new LifeOSDatabase();
  }
  if (!dbInstance) {
    dbInstance = new LifeOSDatabase();
  }
  return dbInstance;
}
