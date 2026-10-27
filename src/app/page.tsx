"use client";

import React, { useState, useEffect } from "react";
import { useLifeOS } from "@/context/LifeOSContext";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { NotificationCenter } from "@/components/layout/NotificationCenter";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { DailyCheckInModal } from "@/components/checkin/DailyCheckInModal";

import { DashboardView } from "@/components/dashboard/DashboardView";
import { TasksView } from "@/components/tasks/TasksView";
import { HabitsView } from "@/components/habits/HabitsView";
import { EducationView } from "@/components/education/EducationView";
import { FitnessView } from "@/components/fitness/FitnessView";
import { NutritionView } from "@/components/nutrition/NutritionView";
import { WaterView } from "@/components/water/WaterView";
import { DigitalDisciplineView } from "@/components/digital/DigitalDisciplineView";
import { RecoveryView } from "@/components/recovery/RecoveryView";
import { CalendarView } from "@/components/calendar/CalendarView";
import { AnalyticsView } from "@/components/analytics/AnalyticsView";
import { SettingsView } from "@/components/settings/SettingsView";

export default function HomePage() {
  const { isInitialized, userProfile, activeTab } = useLifeOS();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);

  // Register PWA Service Worker on load
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then(() => console.log("Service Worker registered successfully."))
        .catch((err) => console.log("Service Worker registration failed:", err));
    }
  }, []);

  if (!isInitialized) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-zinc-400 font-mono text-xs">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span>Инициализация LIFE OS...</span>
        </div>
      </div>
    );
  }

  // If user has not completed onboarding, show wizard
  if (!userProfile.onboardingCompleted) {
    return <OnboardingWizard />;
  }

  return (
    <div className="flex min-h-screen bg-background text-zinc-100">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          onOpenNotifications={() => setIsNotifOpen(true)}
          onOpenCheckIn={() => setIsCheckInOpen(true)}
        />

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-7xl w-full mx-auto pb-24 lg:pb-12">
          {activeTab === "dashboard" && <DashboardView />}
          {activeTab === "today" && <DashboardView />}
          {activeTab === "tasks" && <TasksView />}
          {activeTab === "habits" && <HabitsView />}
          {activeTab === "education" && <EducationView />}
          {activeTab === "fitness" && <FitnessView />}
          {activeTab === "nutrition" && <NutritionView />}
          {activeTab === "water" && <WaterView />}
          {activeTab === "digital" && <DigitalDisciplineView />}
          {activeTab === "recovery" && <RecoveryView />}
          {activeTab === "calendar" && <CalendarView />}
          {activeTab === "analytics" && <AnalyticsView />}
          {activeTab === "settings" && <SettingsView />}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav />

      {/* In-App Notification Center Drawer */}
      <NotificationCenter
        isOpen={isNotifOpen}
        onClose={() => setIsNotifOpen(false)}
      />

      {/* Daily Check-In Modal */}
      <DailyCheckInModal
        isOpen={isCheckInOpen}
        onClose={() => setIsCheckInOpen(false)}
      />
    </div>
  );
}
