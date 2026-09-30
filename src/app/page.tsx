"use client";

import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import DemoToolbar from "@/components/DemoToolbar";
import ProgressBar from "@/components/ProgressBar";
import ScenarioCard from "@/components/ScenarioCard";
import EtiquetteStep from "@/components/steps/EtiquetteStep";
import ExpressiveStep from "@/components/steps/ExpressiveStep";
import ReceptiveStep from "@/components/steps/ReceptiveStep";
import VariantStep from "@/components/steps/VariantStep";
import ActionStep from "@/components/steps/ActionStep";
import { SCENARIOS } from "@/data/scenarios";
import { Scenario } from "@/types";

const STEP_LABELS = ["Etiquette", "Expressive", "Receptive", "Variant", "Action"];

export default function Home() {
  const [activeScenario, setActiveScenario] = useState<Scenario | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [demoMode, setDemoMode] = useState<boolean>(true);
  const [autoSolveSignal, setAutoSolveSignal] = useState<number>(0);

  const handleSelectScenario = (scenario: Scenario) => {
    setActiveScenario(scenario);
    setCurrentStepIndex(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleScenarioIdJump = (id: string) => {
    const found = SCENARIOS.find((s) => s.id === id);
    if (found) {
      setActiveScenario(found);
      setCurrentStepIndex(0);
    }
  };

  const handleStepJump = (index: number) => {
    if (index >= 0 && index < 5) {
      setCurrentStepIndex(index);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleNextStep = () => {
    if (currentStepIndex < 4) {
      setCurrentStepIndex((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleNextScenario = () => {
    if (!activeScenario) return;
    const currentIndex = SCENARIOS.findIndex((s) => s.id === activeScenario.id);
    const nextIndex = (currentIndex + 1) % SCENARIOS.length;
    setActiveScenario(SCENARIOS[nextIndex]);
    setCurrentStepIndex(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleAutoSolve = () => {
    setAutoSolveSignal((prev) => prev + 1);
    if (currentStepIndex !== 2) {
      handleNextStep();
    }
  };

  const renderActiveStep = () => {
    if (!activeScenario) return null;
    const stepData = activeScenario.steps[currentStepIndex];

    switch (stepData.type) {
      case "etiquette":
        return <EtiquetteStep data={stepData} onNext={handleNextStep} />;
      case "expressive":
        return <ExpressiveStep data={stepData} onNext={handleNextStep} />;
      case "receptive":
        return (
          <ReceptiveStep
            data={stepData}
            onNext={handleNextStep}
            autoSolveTrigger={autoSolveSignal > 0}
          />
        );
      case "variant":
        return <VariantStep data={stepData} onNext={handleNextStep} />;
      case "action":
        return (
          <ActionStep
            data={stepData}
            scenarioTitle={activeScenario.title}
            onRestart={() => setCurrentStepIndex(0)}
            onHome={() => setActiveScenario(null)}
            onNextScenario={handleNextScenario}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#f7fcf5] text-slate-800 flex flex-col font-sans">
      {/* Sleek Demo Toolbar */}
      <DemoToolbar
        demoMode={demoMode}
        onToggleDemoMode={() => setDemoMode(!demoMode)}
        currentScenarioId={activeScenario ? activeScenario.id : "coffee-run"}
        onSelectScenario={handleScenarioIdJump}
        currentStepIndex={currentStepIndex}
        onSelectStep={handleStepJump}
        onAutoSolve={handleAutoSolve}
      />

      {/* Clean Navbar */}
      <Navbar
        onHomeClick={() => setActiveScenario(null)}
        activeScenarioTitle={activeScenario?.title}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8">
        {!activeScenario ? (
          /* MINIMALIST HOME VIEW */
          <div className="flex flex-col gap-8 animate-fade-in">
            {/* Direct Clean Headline */}
            <div className="flex flex-col gap-1.5 text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                SgSL Workplace Bridge
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-xl">
                60-second micro-preparation for hearing employees before spontaneous conversations with Deaf colleagues.
              </p>
            </div>

            {/* Scenario Tracks */}
            <div className="flex flex-col gap-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Select Interaction
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {SCENARIOS.map((scenario) => (
                  <ScenarioCard
                    key={scenario.id}
                    scenario={scenario}
                    onSelect={handleSelectScenario}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* SCENARIO RUNNER VIEW */
          <div className="flex flex-col gap-4">
            <ProgressBar
              currentStep={currentStepIndex + 1}
              totalSteps={5}
              onExit={() => setActiveScenario(null)}
              stepLabels={STEP_LABELS}
            />

            {renderActiveStep()}
          </div>
        )}
      </main>
    </div>
  );
}
