"use client";

import React, { useState } from "react";
import { useLifeOS } from "@/context/LifeOSContext";
import {
  Utensils,
  Plus,
  Trash2,
  CheckCircle2,
  Search,
  Sparkles,
  Info,
  Clock,
} from "lucide-react";
import type { MealType, FoodItem, Meal, SugarReductionPreference } from "@/types";

export function NutritionView() {
  const {
    meals,
    todayDate,
    logMeal,
    deleteMeal,
    userProfile,
    updateUserProfile,
  } = useLifeOS();

  const [activeMealType, setActiveMealType] = useState<MealType>("breakfast");
  const [mealTime, setMealTime] = useState("08:30");
  const [foodName, setFoodName] = useState("");
  const [foodPortion, setFoodPortion] = useState("1 порция");
  const [foodCalories, setFoodCalories] = useState<number | undefined>();
  const [foodProtein, setFoodProtein] = useState<number | undefined>();
  const [notes, setNotes] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const mealTypeLabels: Record<MealType, string> = {
    breakfast: "Завтрак",
    lunch: "Обед",
    dinner: "Ужин",
    snack: "Перекус",
  };

  // Collect previous food names for autocomplete/quick-add
  const pastFoodItems = React.useMemo(() => {
    const map = new Map<string, FoodItem>();
    for (const m of meals) {
      for (const item of m.items) {
        if (item.name && !map.has(item.name.toLowerCase())) {
          map.set(item.name.toLowerCase(), item);
        }
      }
    }
    return Array.from(map.values());
  }, [meals]);

  const filteredPastFoods = pastFoodItems.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodName.trim()) return;

    const newItem: FoodItem = {
      id: "fi_" + Date.now(),
      name: foodName.trim(),
      portion: foodPortion.trim() || "1 порция",
      calories: foodCalories ? Number(foodCalories) : undefined,
      proteinGrams: foodProtein ? Number(foodProtein) : undefined,
    };

    await logMeal({
      date: todayDate,
      mealType: activeMealType,
      time: mealTime,
      items: [newItem],
      notes: notes.trim() || undefined,
    });

    setFoodName("");
    setFoodPortion("1 порция");
    setFoodCalories(undefined);
    setFoodProtein(undefined);
    setNotes("");
  };

  const todayMeals = meals.filter((m) => m.date === todayDate);

  // Sugar reduction habit preferences
  const sugarPref = userProfile.sugarSettings;
  const updateSugarGoal = async (goalType: SugarReductionPreference["goalType"]) => {
    await updateUserProfile({
      sugarSettings: {
        ...sugarPref,
        goalType,
      },
    });
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="pb-3 border-b border-surface-border">
        <h1 className="text-base sm:text-lg font-semibold text-zinc-100 flex items-center gap-2">
          <Utensils className="w-5 h-5 text-amber-400" />
          <span>Питание и пищевые привычки</span>
        </h1>
        <p className="text-xs text-zinc-400">
          Осознанное питание без стыда, строгих ограничений и моральных оценок еды.
        </p>
      </div>

      {/* Sugar Reduction Habit Section */}
      <section className="bg-surface-subtle border border-surface-border rounded-2xl p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <h2 className="text-xs sm:text-sm font-semibold text-zinc-100">
              Привычка: контроль добавленного сахара
            </h2>
          </div>
          <span className="text-[10px] text-zinc-500 font-mono">Без чувства вины</span>
        </div>

        <p className="text-xs text-zinc-400 leading-relaxed">
          Мы различаем добавленный рафинированный сахар и природные сахара (во фруктах и молочных продуктах). Выберите комфортную стратегию:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {[
            {
              id: "cut_sugary_drinks",
              title: "Меньше сладких напитков",
              desc: "Замена газировок и пакетированных соков на воду или чай",
            },
            {
              id: "limit_sweet_snacks",
              title: "Сократить сладкие перекусы",
              desc: "Фрукты, орехи и йогурты вместо печенья на бегу",
            },
            {
              id: "gradual_reduction",
              title: "Постепенное уменьшение",
              desc: "Меньше ложек сахара в кофе и чае шаг за шагом",
            },
            {
              id: "balanced_diet",
              title: "Разнообразный рацион",
              desc: "Фокус на сытной цельной пище, снижающей тягу к сладкому",
            },
          ].map((strat) => {
            const isSelected = sugarPref.goalType === strat.id;
            return (
              <button
                key={strat.id}
                type="button"
                onClick={() => updateSugarGoal(strat.id as any)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? "bg-primary/10 border-primary/40 text-zinc-100"
                    : "bg-surface-border/40 border-surface-border text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <div className="flex items-center justify-between font-semibold">
                  <span>{strat.title}</span>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-primary" />}
                </div>
                <p className="text-[11px] text-zinc-400 mt-1">{strat.desc}</p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Quick Meal Logging Form */}
      <section className="bg-[#121215] border border-surface-border rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
        <h2 className="text-sm font-semibold text-zinc-100">Быстрая запись приема пищи</h2>

        {/* Meal Type Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
          {(["breakfast", "lunch", "dinner", "snack"] as MealType[]).map((mt) => (
            <button
              key={mt}
              type="button"
              onClick={() => setActiveMealType(mt)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                activeMealType === mt
                  ? "bg-primary text-black border-primary font-semibold"
                  : "bg-surface-subtle text-zinc-400 border-surface-border hover:text-zinc-200"
              }`}
            >
              {mealTypeLabels[mt]}
            </button>
          ))}
        </div>

        <form onSubmit={handleAddMeal} className="space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-zinc-400 mb-1 font-medium">
                Блюдо / продукт <span className="text-primary">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Напр.: Овсянка с ягодами, яичница, гречка с индейкой"
                value={foodName}
                onChange={(e) => setFoodName(e.target.value)}
                className="w-full px-3 py-2 bg-surface-subtle border border-surface-border rounded-xl text-zinc-100 placeholder-zinc-500 text-xs focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-zinc-400 mb-1 font-medium">Время</label>
              <input
                type="time"
                value={mealTime}
                onChange={(e) => setMealTime(e.target.value)}
                className="w-full px-3 py-2 bg-surface-subtle border border-surface-border rounded-xl text-zinc-100 text-xs focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-zinc-400 mb-1 font-medium">Порция</label>
              <input
                type="text"
                value={foodPortion}
                onChange={(e) => setFoodPortion(e.target.value)}
                className="w-full px-3 py-2 bg-surface-subtle border border-surface-border rounded-xl text-zinc-100 text-xs focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-zinc-400 mb-1 font-medium">
                Ккал <span className="text-zinc-500">(необязательно)</span>
              </label>
              <input
                type="number"
                min="0"
                placeholder="Напр. 350"
                value={foodCalories ?? ""}
                onChange={(e) => setFoodCalories(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-3 py-2 bg-surface-subtle border border-surface-border rounded-xl text-zinc-100 text-xs focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-zinc-400 mb-1 font-medium">
                Белки (г) <span className="text-zinc-500">(опц.)</span>
              </label>
              <input
                type="number"
                min="0"
                placeholder="Напр. 25"
                value={foodProtein ?? ""}
                onChange={(e) => setFoodProtein(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-3 py-2 bg-surface-subtle border border-surface-border rounded-xl text-zinc-100 text-xs focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end">
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-black font-semibold text-xs shadow-md shadow-primary/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Записать прием пищи</span>
            </button>
          </div>
        </form>
      </section>

      {/* Today's Meals Timeline */}
      <section className="bg-surface-subtle border border-surface-border rounded-2xl p-5 space-y-3">
        <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-400" />
          <span>Записи питания за сегодня</span>
        </h2>

        {todayMeals.length === 0 ? (
          <p className="text-xs text-zinc-500 py-4 text-center">
            На сегодня приемы пищи еще не добавлены.
          </p>
        ) : (
          <div className="space-y-2">
            {todayMeals.map((meal) => (
              <div
                key={meal.id}
                className="flex items-center justify-between p-3 rounded-xl bg-surface-border/40 border border-surface-border text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-primary font-mono text-[11px]">
                      {meal.time}
                    </span>
                    <span className="font-semibold text-zinc-200">
                      {mealTypeLabels[meal.mealType]}
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-1">
                    {meal.items.map((it) => (
                      <span key={it.id} className="mr-2">
                        {it.name} ({it.portion})
                        {it.calories ? ` • ${it.calories} ккал` : ""}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => deleteMeal(meal.id)}
                  className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
