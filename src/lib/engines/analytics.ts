// LIFE OS — Analytics Engine with Strict Formulations
import type {
  Task,
  Habit,
  HabitLog,
  StudySession,
  WaterLog,
  WorkoutSession,
  DigitalDisciplineLog,
  SleepLog,
  AnalyticsSummary,
} from "@/types";

export interface AnalyticsInput {
  periodDays: 7 | 30 | 90;
  todayDate: string; // YYYY-MM-DD
  tasks: Task[];
  habits: Habit[];
  habitLogs: HabitLog[];
  studySessions: StudySession[];
  waterLogs: WaterLog[];
  workoutSessions: WorkoutSession[];
  digitalLogs: DigitalDisciplineLog[];
  sleepLogs: SleepLog[];
  waterDailyTargetMl: number;
}

// Generate array of YYYY-MM-DD dates for period ending on todayDate
export function getPeriodDates(todayDate: string, days: number): string[] {
  const result: string[] = [];
  const end = new Date(todayDate + "T12:00:00");
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(end);
    d.setDate(end.getDate() - i);
    result.push(d.toISOString().split("T")[0]);
  }
  return result;
}

// 1. Task Completion Rate
// completed eligible tasks / total eligible tasks * 100
// Excludes future tasks; excludes cancelled tasks from denominator
export function calculateTaskCompletionRate(
  tasks: Task[],
  periodDates: string[],
  todayDate: string
): { rate: number | null; completed: number; total: number } {
  const periodSet = new Set(periodDates);

  const eligibleTasks = tasks.filter((t) => {
    if (!periodSet.has(t.date)) return false;
    // Exclude future tasks
    if (t.date > todayDate) return false;
    // Exclude cancelled tasks from penalizing completion rate
    if (t.status === "cancelled") return false;
    return true;
  });

  const total = eligibleTasks.length;
  if (total === 0) {
    return { rate: null, completed: 0, total: 0 };
  }

  const completed = eligibleTasks.filter((t) => t.status === "completed").length;
  const rate = Math.round((completed / total) * 1000) / 10; // 1 decimal place

  return { rate, completed, total };
}

// 2. Study Completion Rate
// actual study duration / planned study duration * 100
export function calculateStudyCompletion(
  studySessions: StudySession[],
  periodDates: string[]
): {
  plannedMinutes: number;
  actualMinutes: number;
  rate: number | null;
  displayRate: number | null;
} {
  const periodSet = new Set(periodDates);
  const eligible = studySessions.filter((s) => periodSet.has(s.date));

  if (eligible.length === 0) {
    return { plannedMinutes: 0, actualMinutes: 0, rate: null, displayRate: null };
  }

  const plannedSeconds = eligible.reduce((acc, s) => acc + s.plannedDurationSeconds, 0);
  const actualSeconds = eligible.reduce((acc, s) => acc + s.durationSeconds, 0);

  const plannedMinutes = Math.round(plannedSeconds / 60);
  const actualMinutes = Math.round(actualSeconds / 60);

  if (plannedSeconds <= 0) {
    return { plannedMinutes, actualMinutes, rate: null, displayRate: null };
  }

  const rawRate = Math.round((actualSeconds / plannedSeconds) * 1000) / 10;
  const displayRate = Math.min(100, rawRate);

  return { plannedMinutes, actualMinutes, rate: rawRate, displayRate };
}

// 3. Habit Completion Rate
// completed scheduled occurrences / eligible scheduled occurrences * 100
export function calculateHabitCompletionRate(
  habits: Habit[],
  habitLogs: HabitLog[],
  periodDates: string[],
  todayDate: string
): { rate: number | null; completed: number; total: number } {
  let eligibleOccurrences = 0;
  let completedOccurrences = 0;

  const logMap = new Map<string, HabitLog>();
  for (const log of habitLogs) {
    logMap.set(`${log.habitId}_${log.date}`, log);
  }

  for (const dateStr of periodDates) {
    if (dateStr > todayDate) continue; // never count future occurrences
    const d = new Date(dateStr + "T12:00:00");
    const dayOfWeek = d.getDay();

    for (const habit of habits) {
      if (habit.isArchived || !habit.isActive) continue;
      if (habit.startDate && habit.startDate > dateStr) continue;
      if (habit.endDate && habit.endDate < dateStr) continue;

      // Check if scheduled on this day of week
      if (habit.daysOfWeek.includes(dayOfWeek as any)) {
        eligibleOccurrences++;
        const log = logMap.get(`${habit.id}_${dateStr}`);
        if (log && log.completed) {
          completedOccurrences++;
        }
      }
    }
  }

  if (eligibleOccurrences === 0) {
    return { rate: null, completed: 0, total: 0 };
  }

  const rate = Math.round((completedOccurrences / eligibleOccurrences) * 1000) / 10;
  return { rate, completed: completedOccurrences, total: eligibleOccurrences };
}

// 4. Water Logging Progress
export function calculateWaterStats(
  waterLogs: WaterLog[],
  periodDates: string[],
  dailyTargetMl: number
): {
  totalLoggedMl: number;
  avgDailyMl: number;
  targetAttainmentRate: number;
} {
  const periodSet = new Set(periodDates);
  const eligible = waterLogs.filter((w) => periodSet.has(w.date));
  const totalLoggedMl = eligible.reduce((sum, w) => sum + w.volumeMl, 0);

  const numDays = Math.max(1, periodDates.length);
  const avgDailyMl = Math.round(totalLoggedMl / numDays);

  const targetTotal = dailyTargetMl * numDays;
  const targetAttainmentRate =
    targetTotal > 0 ? Math.round((totalLoggedMl / targetTotal) * 1000) / 10 : 0;

  return { totalLoggedMl, avgDailyMl, targetAttainmentRate };
}

// 5. Streaks (Continuous consecutive active days)
export function calculateStreaks(
  tasks: Task[],
  habitLogs: HabitLog[],
  workoutSessions: WorkoutSession[],
  todayDate: string
): { currentStreak: number; bestStreak: number; totalActiveDays: number } {
  // An active day is a date where at least 1 habit was completed, 1 task was completed, or 1 workout was completed
  const activeDatesSet = new Set<string>();

  for (const t of tasks) {
    if (t.status === "completed" && t.date) {
      activeDatesSet.add(t.date);
    }
  }
  for (const h of habitLogs) {
    if (h.completed && h.date) {
      activeDatesSet.add(h.date);
    }
  }
  for (const w of workoutSessions) {
    if (w.completed && w.date) {
      activeDatesSet.add(w.date);
    }
  }

  const totalActiveDays = activeDatesSet.size;
  if (totalActiveDays === 0) {
    return { currentStreak: 0, bestStreak: 0, totalActiveDays: 0 };
  }

  // Sort dates chronologically
  const sortedDates = Array.from(activeDatesSet).sort();

  // Compute best streak historically
  let bestStreak = 0;
  let runningStreak = 0;
  let prevDate: Date | null = null;

  for (const dStr of sortedDates) {
    const current = new Date(dStr + "T12:00:00");
    if (!prevDate) {
      runningStreak = 1;
    } else {
      const diffMs = current.getTime() - prevDate.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        runningStreak++;
      } else {
        runningStreak = 1;
      }
    }
    if (runningStreak > bestStreak) {
      bestStreak = runningStreak;
    }
    prevDate = current;
  }

  // Compute current streak ending today or yesterday (grace period)
  let currentStreak = 0;
  const today = new Date(todayDate + "T12:00:00");
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  let checkDate = activeDatesSet.has(todayDate) ? today : activeDatesSet.has(yesterdayStr) ? yesterday : null;

  if (checkDate) {
    let walker = new Date(checkDate);
    while (true) {
      const wStr = walker.toISOString().split("T")[0];
      if (activeDatesSet.has(wStr)) {
        currentStreak++;
        walker.setDate(walker.getDate() - 1);
      } else {
        break;
      }
    }
  }

  return {
    currentStreak,
    bestStreak: Math.max(bestStreak, currentStreak),
    totalActiveDays,
  };
}

// Full Analytics Summary computation
export function computeAnalyticsSummary(input: AnalyticsInput): AnalyticsSummary {
  const periodDates = getPeriodDates(input.todayDate, input.periodDays);

  const taskStats = calculateTaskCompletionRate(input.tasks, periodDates, input.todayDate);
  const studyStats = calculateStudyCompletion(input.studySessions, periodDates);
  const habitStats = calculateHabitCompletionRate(
    input.habits,
    input.habitLogs,
    periodDates,
    input.todayDate
  );
  const waterStats = calculateWaterStats(
    input.waterLogs,
    periodDates,
    input.waterDailyTargetMl
  );
  const streakStats = calculateStreaks(
    input.tasks,
    input.habitLogs,
    input.workoutSessions,
    input.todayDate
  );

  const periodSet = new Set(periodDates);
  const totalWorkouts = input.workoutSessions.filter(
    (w) => w.completed && periodSet.has(w.date)
  ).length;

  const detoxSuccess = input.digitalLogs.filter(
    (d) => d.detoxObserved && periodSet.has(d.date)
  ).length;

  const sleepEligible = input.sleepLogs.filter((s) => periodSet.has(s.date));
  const avgSleepMinutes =
    sleepEligible.length > 0
      ? Math.round(
          sleepEligible.reduce((sum, s) => sum + s.totalSleepMinutes, 0) /
            sleepEligible.length
        )
      : 0;

  return {
    periodDays: input.periodDays,
    taskCompletionRate: taskStats.rate ?? 0,
    eligibleTaskCount: taskStats.total,
    completedTaskCount: taskStats.completed,
    plannedStudyMinutes: studyStats.plannedMinutes,
    actualStudyMinutes: studyStats.actualMinutes,
    studyCompletionRate: studyStats.displayRate ?? 0,
    habitCompletionRate: habitStats.rate ?? 0,
    totalHabitOccurrences: habitStats.total,
    completedHabitOccurrences: habitStats.completed,
    totalLoggedWaterMl: waterStats.totalLoggedMl,
    avgDailyWaterMl: waterStats.avgDailyMl,
    waterTargetAttainmentRate: waterStats.targetAttainmentRate,
    totalWorkoutsCompleted: totalWorkouts,
    digitalDetoxSuccessDays: detoxSuccess,
    avgSleepMinutes,
    currentStreakDays: streakStats.currentStreak,
    bestStreakDays: streakStats.bestStreak,
    activeDaysCount: streakStats.totalActiveDays,
  };
}
