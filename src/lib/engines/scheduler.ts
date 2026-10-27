// LIFE OS — Deterministic Smart Auto-Scheduler Engine
import type {
  UserScheduleRoutine,
  Task,
  Habit,
  DailyPlan,
  ScheduledTimeSlot,
  DayOfWeek,
  Priority,
} from "@/types";

export interface SchedulerInput {
  date: string; // YYYY-MM-DD
  routine: UserScheduleRoutine;
  tasks: Task[];
  habits: Habit[];
  isWorkoutDay?: boolean;
  lightenLoadRequested?: boolean;
  existingPlan?: DailyPlan;
}

export interface TimeInterval {
  startMinutes: number; // minutes from 00:00
  endMinutes: number;
}

// Helper: "07:30" -> 450 minutes
export function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

// Helper: 450 -> "07:30"
export function minutesToTime(minutes: number): string {
  const total = Math.max(0, Math.min(1439, Math.floor(minutes)));
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// Helper: Check if slot A and slot B overlap
export function intervalsOverlap(
  startA: number,
  endA: number,
  startB: number,
  endB: number
): boolean {
  return Math.max(startA, startB) < Math.min(endA, endB);
}

// Build available awake intervals minus fixed school/work and commute
export function computeFreeIntervals(
  wakeMinutes: number,
  sleepMinutes: number,
  occupiedIntervals: TimeInterval[]
): TimeInterval[] {
  // Sort occupied by start
  const sortedOccupied = [...occupiedIntervals].sort(
    (a, b) => a.startMinutes - b.startMinutes
  );

  const free: TimeInterval[] = [];
  let currentStart = wakeMinutes;

  for (const block of sortedOccupied) {
    if (block.startMinutes > currentStart) {
      free.push({
        startMinutes: currentStart,
        endMinutes: Math.min(block.startMinutes, sleepMinutes),
      });
    }
    currentStart = Math.max(currentStart, block.endMinutes);
    if (currentStart >= sleepMinutes) break;
  }

  if (currentStart < sleepMinutes) {
    free.push({
      startMinutes: currentStart,
      endMinutes: sleepMinutes,
    });
  }

  // Filter out any blocks with length <= 5 min
  return free.filter((interval) => interval.endMinutes - interval.startMinutes >= 5);
}

// Find first available slot in free intervals that can fit duration
export function findAvailableSlot(
  freeIntervals: TimeInterval[],
  durationMinutes: number,
  preferredStartMinutes?: number
): { startMinutes: number; endMinutes: number; intervalIndex: number } | null {
  if (preferredStartMinutes !== undefined) {
    // Try to place at or near preferred time
    for (let i = 0; i < freeIntervals.length; i++) {
      const interval = freeIntervals[i];
      if (
        preferredStartMinutes >= interval.startMinutes &&
        preferredStartMinutes + durationMinutes <= interval.endMinutes
      ) {
        return {
          startMinutes: preferredStartMinutes,
          endMinutes: preferredStartMinutes + durationMinutes,
          intervalIndex: i,
        };
      }
    }
  }

  // Fallback: first interval with enough room
  for (let i = 0; i < freeIntervals.length; i++) {
    const interval = freeIntervals[i];
    const available = interval.endMinutes - interval.startMinutes;
    if (available >= durationMinutes) {
      return {
        startMinutes: interval.startMinutes,
        endMinutes: interval.startMinutes + durationMinutes,
        intervalIndex: i,
      };
    }
  }

  return null;
}

// Deduct occupied sub-interval from free intervals list
export function occupyInterval(
  freeIntervals: TimeInterval[],
  start: number,
  end: number
): TimeInterval[] {
  const result: TimeInterval[] = [];

  for (const block of freeIntervals) {
    if (end <= block.startMinutes || start >= block.endMinutes) {
      // No overlap
      result.push(block);
    } else {
      // Overlaps: slice before and after
      if (start > block.startMinutes) {
        result.push({
          startMinutes: block.startMinutes,
          endMinutes: start,
        });
      }
      if (end < block.endMinutes) {
        result.push({
          startMinutes: end,
          endMinutes: block.endMinutes,
        });
      }
    }
  }

  return result.filter((i) => i.endMinutes - i.startMinutes >= 5);
}

// Core deterministic daily plan generator
export function generateDailyPlan(input: SchedulerInput): DailyPlan {
  const { date, routine, tasks, habits, lightenLoadRequested, existingPlan } = input;
  const targetDateObj = new Date(date + "T00:00:00");
  const dayOfWeek = targetDateObj.getDay() as DayOfWeek;

  const wakeM = timeToMinutes(routine.wakeTime || "07:00");
  const sleepM = timeToMinutes(routine.sleepTime || "23:00");
  const workStartM = timeToMinutes(routine.workOrSchoolStart || "09:00");
  const workEndM = timeToMinutes(routine.workOrSchoolEnd || "15:00");
  const commute = routine.commuteMinutes || 30;

  const slots: ScheduledTimeSlot[] = [];
  const conflicts: string[] = [];

  // If there are already completed slots from an existing plan, PRESERVE THEM EXACTLY
  const completedSlotMap = new Map<string, ScheduledTimeSlot>();
  if (existingPlan?.slots) {
    for (const slot of existingPlan.slots) {
      if (slot.isCompleted) {
        completedSlotMap.set(slot.referenceId || slot.id, slot);
      }
    }
  }

  // 1. Fixed commitment (School/Work) on non-rest days
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const hasFixedCommitment = !isWeekend && workEndM > workStartM;

  const occupiedInitial: TimeInterval[] = [];

  if (hasFixedCommitment) {
    const schoolStartWithCommute = Math.max(wakeM, workStartM - commute);
    const schoolEndWithCommute = Math.min(sleepM, workEndM + commute);

    occupiedInitial.push({
      startMinutes: schoolStartWithCommute,
      endMinutes: schoolEndWithCommute,
    });

    slots.push({
      id: `slot_fixed_work_${date}`,
      type: "fixed_commitment",
      title: "Учеба / Работа (включая дорогу)",
      category: "work",
      startTime: minutesToTime(schoolStartWithCommute),
      endTime: minutesToTime(schoolEndWithCommute),
      durationMinutes: schoolEndWithCommute - schoolStartWithCommute,
      isFixed: true,
      isCompleted: false,
      isSkipped: false,
      priority: "high",
      notes: "Обязательное занятие",
    });
  }

  // Add already completed slots into occupied list
  for (const cSlot of completedSlotMap.values()) {
    const cStart = timeToMinutes(cSlot.startTime);
    const cEnd = timeToMinutes(cSlot.endTime);
    occupiedInitial.push({ startMinutes: cStart, endMinutes: cEnd });
    slots.push(cSlot);
  }

  let freeIntervals = computeFreeIntervals(wakeM, sleepM, occupiedInitial);

  // 2. Fixed Time Tasks (user explicitly specified a startTime)
  const scheduledTasks = tasks.filter((t) => t.date === date && t.status !== "cancelled");
  const fixedTasks = scheduledTasks.filter(
    (t) => t.startTime && !completedSlotMap.has(t.id)
  );

  for (const task of fixedTasks) {
    const startM = timeToMinutes(task.startTime!);
    const endM = startM + task.durationMinutes;

    // Check overlap with existing slots
    const hasCollision = slots.some((s) => {
      const sStart = timeToMinutes(s.startTime);
      const sEnd = timeToMinutes(s.endTime);
      return intervalsOverlap(startM, endM, sStart, sEnd);
    });

    if (hasCollision) {
      conflicts.push(`Конфликт времени: задача "${task.title}" в ${task.startTime} пересекается с другим блоком.`);
    }

    slots.push({
      id: `slot_task_${task.id}`,
      type: "task",
      referenceId: task.id,
      title: task.title,
      category: task.category,
      startTime: task.startTime!,
      endTime: minutesToTime(endM),
      durationMinutes: task.durationMinutes,
      isFixed: true,
      isCompleted: task.status === "completed",
      isSkipped: task.status === "skipped",
      priority: task.priority,
      notes: task.description,
    });

    freeIntervals = occupyInterval(freeIntervals, startM, endM);
  }

  // 3. Regular Habits (Active & scheduled for today)
  const todayHabits = habits.filter(
    (h) =>
      h.isActive &&
      !h.isArchived &&
      h.daysOfWeek.includes(dayOfWeek) &&
      !completedSlotMap.has(h.id)
  );

  // Sort habits: morning first, evening last
  todayHabits.sort((a, b) => {
    const order = { morning: 1, afternoon: 2, anytime: 3, evening: 4 };
    return (order[a.timeOfDay || "anytime"] || 3) - (order[b.timeOfDay || "anytime"] || 3);
  });

  for (const habit of todayHabits) {
    const duration = habit.measurementType === "duration" ? Math.max(5, habit.targetValue) : 10;
    let preferredStart: number | undefined;

    if (habit.preferredTime) {
      preferredStart = timeToMinutes(habit.preferredTime);
    } else if (habit.timeOfDay === "morning") {
      preferredStart = wakeM + 15;
    } else if (habit.timeOfDay === "evening") {
      preferredStart = Math.max(wakeM, sleepM - 45);
    }

    const slotFit = findAvailableSlot(freeIntervals, duration, preferredStart);
    if (slotFit) {
      slots.push({
        id: `slot_habit_${habit.id}`,
        type: "habit",
        referenceId: habit.id,
        title: habit.title,
        category: habit.category as any,
        startTime: minutesToTime(slotFit.startMinutes),
        endTime: minutesToTime(slotFit.endMinutes),
        durationMinutes: duration,
        isFixed: false,
        isCompleted: false,
        isSkipped: false,
        priority: "medium",
        notes: habit.description,
      });

      freeIntervals = occupyInterval(freeIntervals, slotFit.startMinutes, slotFit.endMinutes);
    }
  }

  // 4. Workout (if scheduled for today)
  const isWorkoutDay =
    input.isWorkoutDay !== undefined
      ? input.isWorkoutDay
      : routine.workoutDays.includes(dayOfWeek);

  if (isWorkoutDay && !slots.some((s) => s.type === "workout" || s.title.includes("Тренировка"))) {
    const workoutDuration = lightenLoadRequested ? 25 : 45;
    // Preferred time: late afternoon e.g. 17:30 or first available
    const preferredWorkoutStart = timeToMinutes("17:30");
    const fit = findAvailableSlot(freeIntervals, workoutDuration, preferredWorkoutStart);

    if (fit) {
      slots.push({
        id: `slot_workout_${date}`,
        type: "workout",
        title: "Физическая активность / Тренировка",
        category: "fitness",
        startTime: minutesToTime(fit.startMinutes),
        endTime: minutesToTime(fit.endMinutes),
        durationMinutes: workoutDuration,
        isFixed: false,
        isCompleted: false,
        isSkipped: false,
        priority: "high",
        notes: "Занятие с учетом прогресса и комфорта",
      });

      freeIntervals = occupyInterval(freeIntervals, fit.startMinutes, fit.endMinutes);
    }
  }

  // 5. Unscheduled Flexible Tasks (Priority sorted: urgent > high > medium > low)
  const priorityWeight: Record<Priority, number> = {
    urgent: 4,
    high: 3,
    medium: 2,
    low: 1,
  };

  const flexibleTasks = scheduledTasks
    .filter((t) => !t.startTime && !completedSlotMap.has(t.id) && t.status !== "completed")
    .sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority]);

  for (const task of flexibleTasks) {
    const duration = task.durationMinutes || 30;
    const fit = findAvailableSlot(freeIntervals, duration);

    if (fit) {
      slots.push({
        id: `slot_task_${task.id}`,
        type: task.category === "education" ? "study" : "task",
        referenceId: task.id,
        title: task.title,
        category: task.category,
        startTime: minutesToTime(fit.startMinutes),
        endTime: minutesToTime(fit.endMinutes),
        durationMinutes: duration,
        isFixed: false,
        isCompleted: false,
        isSkipped: false,
        priority: task.priority,
        notes: task.description,
      });

      freeIntervals = occupyInterval(freeIntervals, fit.startMinutes, fit.endMinutes);

      // Insert a 10-min buffer/break after long sessions >= 45 min
      if (duration >= 45 && fit.endMinutes + 10 <= sleepM) {
        freeIntervals = occupyInterval(freeIntervals, fit.endMinutes, fit.endMinutes + 10);
      }
    } else {
      conflicts.push(`Не хватило времени в расписании для задачи "${task.title}" (${duration} мин).`);
    }
  }

  // Sort all slots chronologically
  slots.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

  const totalScheduledMinutes = slots.reduce((acc, s) => acc + s.durationMinutes, 0);
  const totalAvailableMinutes = Math.max(0, sleepM - wakeM);

  return {
    id: `plan_${date}`,
    date,
    slots,
    generatedAt: new Date().toISOString(),
    isOverloaded: conflicts.length > 0,
    conflictDetails: conflicts,
    totalScheduledMinutes,
    availableMinutes: totalAvailableMinutes,
  };
}

// Non-destructive Recalculate Day:
// Recalculates remaining unfinished slots from currentTime onwards into remaining awake window
export function recalculateDay(
  currentPlan: DailyPlan,
  currentTimeStr: string,
  routine: UserScheduleRoutine
): DailyPlan {
  const currentMinutes = timeToMinutes(currentTimeStr);
  const sleepM = timeToMinutes(routine.sleepTime || "23:00");

  const preservedSlots: ScheduledTimeSlot[] = [];
  const pendingSlots: ScheduledTimeSlot[] = [];

  for (const slot of currentPlan.slots) {
    const slotStart = timeToMinutes(slot.startTime);

    // Keep completed, skipped, or fixed past slots
    if (slot.isCompleted || slot.isSkipped || slot.isFixed || slotStart < currentMinutes) {
      preservedSlots.push(slot);
    } else {
      pendingSlots.push(slot);
    }
  }

  // Build free intervals in the remaining time between currentMinutes and sleepM
  const occupiedRemaining: TimeInterval[] = [];
  for (const p of preservedSlots) {
    const pStart = timeToMinutes(p.startTime);
    const pEnd = timeToMinutes(p.endTime);
    if (pEnd > currentMinutes) {
      occupiedRemaining.push({
        startMinutes: Math.max(currentMinutes, pStart),
        endMinutes: Math.min(sleepM, pEnd),
      });
    }
  }

  let freeIntervals = computeFreeIntervals(currentMinutes, sleepM, occupiedRemaining);
  const rescheduledSlots: ScheduledTimeSlot[] = [...preservedSlots];
  const conflicts: string[] = [];

  // Sort pending by priority
  const priorityOrder: Record<Priority, number> = {
    urgent: 4,
    high: 3,
    medium: 2,
    low: 1,
  };
  pendingSlots.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);

  for (const slot of pendingSlots) {
    const fit = findAvailableSlot(freeIntervals, slot.durationMinutes);
    if (fit) {
      rescheduledSlots.push({
        ...slot,
        startTime: minutesToTime(fit.startMinutes),
        endTime: minutesToTime(fit.endMinutes),
      });
      freeIntervals = occupyInterval(freeIntervals, fit.startMinutes, fit.endMinutes);
    } else {
      conflicts.push(`После пересчета не помещается: "${slot.title}" (${slot.durationMinutes} мин).`);
    }
  }

  rescheduledSlots.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

  return {
    ...currentPlan,
    slots: rescheduledSlots,
    lastRecalculatedAt: new Date().toISOString(),
    isOverloaded: conflicts.length > 0,
    conflictDetails: conflicts,
    totalScheduledMinutes: rescheduledSlots.reduce((sum, s) => sum + s.durationMinutes, 0),
  };
}
