import { describe, it, expect } from "vitest";
import {
  generateDailyPlan,
  recalculateDay,
  timeToMinutes,
  minutesToTime,
  computeFreeIntervals,
  intervalsOverlap,
} from "../src/lib/engines/scheduler";
import {
  calculateTaskCompletionRate,
  calculateStudyCompletion,
  calculateHabitCompletionRate,
  calculateWaterStats,
  calculateStreaks,
  computeAnalyticsSummary,
} from "../src/lib/engines/analytics";
import {
  isWithinQuietHours,
  shouldDeliverNotification,
  createNotification,
} from "../src/lib/engines/notifications";
import type {
  UserScheduleRoutine,
  Task,
  Habit,
  HabitLog,
  StudySession,
  WorkoutSession,
  WaterLog,
  NotificationSettings,
} from "../src/types";

describe("1. Time & Interval Utilities", () => {
  it("converts HH:MM to minutes and back accurately", () => {
    expect(timeToMinutes("00:00")).toBe(0);
    expect(timeToMinutes("07:30")).toBe(450);
    expect(timeToMinutes("23:59")).toBe(1439);

    expect(minutesToTime(0)).toBe("00:00");
    expect(minutesToTime(450)).toBe("07:30");
    expect(minutesToTime(1439)).toBe("23:59");
  });

  it("detects interval overlaps correctly", () => {
    // 09:00 - 10:00 (540 - 600) vs 09:30 - 10:30 (570 - 630) -> overlap
    expect(intervalsOverlap(540, 600, 570, 630)).toBe(true);
    // Adjacent intervals: 09:00 - 10:00 vs 10:00 - 11:00 -> no overlap
    expect(intervalsOverlap(540, 600, 600, 660)).toBe(false);
    // Disjoint intervals
    expect(intervalsOverlap(540, 600, 700, 800)).toBe(false);
  });

  it("computes free intervals excluding sleep and fixed school", () => {
    const wake = 420; // 07:00
    const sleep = 1380; // 23:00
    const occupied = [{ startMinutes: 540, endMinutes: 900 }]; // 09:00 - 15:00

    const free = computeFreeIntervals(wake, sleep, occupied);
    expect(free).toHaveLength(2);
    expect(free[0]).toEqual({ startMinutes: 420, endMinutes: 540 }); // 07:00 - 09:00
    expect(free[1]).toEqual({ startMinutes: 900, endMinutes: 1380 }); // 15:00 - 23:00
  });
});

describe("2. Deterministic Smart Auto-Scheduler", () => {
  const routine: UserScheduleRoutine = {
    wakeTime: "07:00",
    sleepTime: "23:00",
    workOrSchoolStart: "09:00",
    workOrSchoolEnd: "15:00",
    commuteMinutes: 30,
    fixedStudyDays: [1, 2, 3, 4, 5],
    workoutDays: [1, 3, 5],
    restDays: [0, 6],
  };

  const habits: Habit[] = [
    {
      id: "h_teeth",
      title: "Чистка зубов",
      category: "self_care",
      measurementType: "boolean",
      targetValue: 1,
      frequency: "daily",
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      timeOfDay: "morning",
      preferredTime: "07:30",
      reminderEnabled: true,
      startDate: "2026-01-01",
      isActive: true,
      isArchived: false,
      createdAt: "2026-01-01T00:00:00Z",
    },
  ];

  const tasks: Task[] = [
    {
      id: "task_math",
      title: "Подготовка к экзамену по математике",
      category: "education",
      date: "2026-10-28", // Wednesday
      durationMinutes: 60,
      priority: "high",
      status: "scheduled",
      subtasks: [],
      createdAt: "2026-10-28T00:00:00Z",
      updatedAt: "2026-10-28T00:00:00Z",
    },
  ];

  it("generates a clean daily plan with school block and no overlaps", () => {
    const plan = generateDailyPlan({
      date: "2026-10-28",
      routine,
      tasks,
      habits,
      isWorkoutDay: true,
    });

    expect(plan.slots.length).toBeGreaterThanOrEqual(3);
    // Check school commitment presence
    const workSlot = plan.slots.find((s) => s.type === "fixed_commitment");
    expect(workSlot).toBeDefined();

    // Verify absolutely no slots overlap
    for (let i = 0; i < plan.slots.length - 1; i++) {
      const slotA = plan.slots[i];
      const slotB = plan.slots[i + 1];
      const endA = timeToMinutes(slotA.endTime);
      const startB = timeToMinutes(slotB.startTime);
      expect(startB).toBeGreaterThanOrEqual(endA);
    }
  });

  it("recalculates the day non-destructively: preserves completed slots and reschedules pending slots", () => {
    const initialPlan = generateDailyPlan({
      date: "2026-10-28",
      routine,
      tasks,
      habits,
      isWorkoutDay: true,
    });

    // Mark one slot completed
    initialPlan.slots[0].isCompleted = true;
    const completedSlotId = initialPlan.slots[0].id;

    // Recalculate at 16:00
    const recalculated = recalculateDay(initialPlan, "16:00", routine);

    // Completed slot must still exist
    const preserved = recalculated.slots.find((s) => s.id === completedSlotId);
    expect(preserved).toBeDefined();
    expect(preserved?.isCompleted).toBe(true);

    // No duplicate slot ids
    const slotIds = recalculated.slots.map((s) => s.id);
    const uniqueIds = new Set(slotIds);
    expect(uniqueIds.size).toBe(slotIds.length);
  });
});

describe("3. Analytics & Formulas", () => {
  const period = ["2026-10-26", "2026-10-27", "2026-10-28"];
  const today = "2026-10-28";

  it("calculates Task Completion Rate excluding future tasks and cancelled tasks", () => {
    const sampleTasks: Task[] = [
      {
        id: "t1",
        title: "T1",
        category: "other",
        date: "2026-10-27",
        durationMinutes: 30,
        priority: "medium",
        status: "completed",
        subtasks: [],
        createdAt: "",
        updatedAt: "",
      },
      {
        id: "t2",
        title: "T2",
        category: "other",
        date: "2026-10-27",
        durationMinutes: 30,
        priority: "medium",
        status: "scheduled",
        subtasks: [],
        createdAt: "",
        updatedAt: "",
      },
      {
        id: "t3_cancelled",
        title: "T3",
        category: "other",
        date: "2026-10-27",
        durationMinutes: 30,
        priority: "medium",
        status: "cancelled", // should NOT penalize completion rate
        subtasks: [],
        createdAt: "",
        updatedAt: "",
      },
      {
        id: "t4_future",
        title: "T4",
        category: "other",
        date: "2026-10-29", // future task!
        durationMinutes: 30,
        priority: "medium",
        status: "scheduled",
        subtasks: [],
        createdAt: "",
        updatedAt: "",
      },
    ];

    const stats = calculateTaskCompletionRate(sampleTasks, period, today);
    // Eligible: t1 and t2 (t3 cancelled excluded, t4 future excluded) => total = 2, completed = 1 => 50%
    expect(stats.total).toBe(2);
    expect(stats.completed).toBe(1);
    expect(stats.rate).toBe(50);
  });

  it("handles zero eligible tasks safely with null rate (no division by zero)", () => {
    const stats = calculateTaskCompletionRate([], period, today);
    expect(stats.total).toBe(0);
    expect(stats.rate).toBeNull();
  });

  it("calculates Study Completion Rate and clamps visual progress to 100% while keeping raw actual", () => {
    const studySessions: StudySession[] = [
      {
        id: "s1",
        subjectId: "sub_math",
        startTime: "2026-10-27T10:00:00Z",
        durationSeconds: 3600, // 60 min actual
        plannedDurationSeconds: 1800, // 30 min planned
        breakDurationSeconds: 300,
        completed: true,
        date: "2026-10-27",
      },
    ];

    const stats = calculateStudyCompletion(studySessions, period);
    expect(stats.plannedMinutes).toBe(30);
    expect(stats.actualMinutes).toBe(60);
    expect(stats.rate).toBe(200); // raw rate 200%
    expect(stats.displayRate).toBe(100); // clamped visual rate
  });

  it("calculates Habit Completion Rate excluding future dates", () => {
    const habits: Habit[] = [
      {
        id: "h1",
        title: "Daily Walk",
        category: "fitness",
        measurementType: "boolean",
        targetValue: 1,
        frequency: "daily",
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
        reminderEnabled: false,
        startDate: "2026-10-25",
        isActive: true,
        isArchived: false,
        createdAt: "",
      },
    ];

    const logs: HabitLog[] = [
      {
        id: "l1",
        habitId: "h1",
        date: "2026-10-26",
        value: 1,
        completed: true,
      },
    ];

    // Period: 3 days (Oct 26, 27, 28)
    const stats = calculateHabitCompletionRate(habits, logs, period, today);
    expect(stats.total).toBe(3);
    expect(stats.completed).toBe(1);
    expect(stats.rate).toBe(33.3);
  });

  it("calculates consecutive streaks without wiping best streak on a single skip", () => {
    const tasks: Task[] = [
      {
        id: "t1",
        title: "T1",
        category: "other",
        date: "2026-10-20",
        durationMinutes: 10,
        priority: "low",
        status: "completed",
        subtasks: [],
        createdAt: "",
        updatedAt: "",
      },
      {
        id: "t2",
        title: "T2",
        category: "other",
        date: "2026-10-21",
        durationMinutes: 10,
        priority: "low",
        status: "completed",
        subtasks: [],
        createdAt: "",
        updatedAt: "",
      },
      {
        id: "t3",
        title: "T3",
        category: "other",
        date: "2026-10-22",
        durationMinutes: 10,
        priority: "low",
        status: "completed",
        subtasks: [],
        createdAt: "",
        updatedAt: "",
      },
      // 2026-10-23 missed!
      {
        id: "t4",
        title: "T4",
        category: "other",
        date: "2026-10-24",
        durationMinutes: 10,
        priority: "low",
        status: "completed",
        subtasks: [],
        createdAt: "",
        updatedAt: "",
      },
    ];

    const streaks = calculateStreaks(tasks, [], [], "2026-10-24");
    expect(streaks.bestStreak).toBe(3); // 20, 21, 22
    expect(streaks.currentStreak).toBe(1); // 24
    expect(streaks.totalActiveDays).toBe(4);
  });

  it("computes Water logging progress based on user target", () => {
    const waterLogs: WaterLog[] = [
      { id: "w1", date: "2026-10-28", timestamp: "", volumeMl: 500 },
      { id: "w2", date: "2026-10-28", timestamp: "", volumeMl: 500 },
    ];
    const stats = calculateWaterStats(waterLogs, ["2026-10-28"], 2000);
    expect(stats.totalLoggedMl).toBe(1000);
    expect(stats.targetAttainmentRate).toBe(50);
  });
});

describe("4. Notifications & Quiet Hours", () => {
  it("respects quiet hours correctly across midnight", () => {
    // Quiet hours: 22:30 to 07:00
    expect(isWithinQuietHours("23:15", "22:30", "07:00")).toBe(true);
    expect(isWithinQuietHours("03:00", "22:30", "07:00")).toBe(true);
    expect(isWithinQuietHours("06:59", "22:30", "07:00")).toBe(true);
    expect(isWithinQuietHours("07:01", "22:30", "07:00")).toBe(false);
    expect(isWithinQuietHours("14:00", "22:30", "07:00")).toBe(false);
  });

  it("suppresses notifications during quiet hours", () => {
    const settings: NotificationSettings = {
      inAppEnabled: true,
      browserPushEnabled: true,
      quietHoursStart: "22:30",
      quietHoursEnd: "07:00",
      categories: {
        self_care: true,
        education: true,
        fitness: true,
        nutrition: true,
        hydration: true,
        digital_discipline: true,
        recovery: true,
        micro_habit: true,
        cold_shower: true,
        custom: true,
      },
    };

    expect(shouldDeliverNotification("education", settings, "23:00")).toBe(false);
    expect(shouldDeliverNotification("education", settings, "15:00")).toBe(true);
  });

  it("creates valid notification items", () => {
    const notif = createNotification({
      title: "Водный баланс",
      message: "Время выпить стакан чистой воды",
      category: "hydration",
    });
    expect(notif.id).toContain("notif_");
    expect(notif.read).toBe(false);
    expect(notif.delivered).toBe(false);
  });
});
