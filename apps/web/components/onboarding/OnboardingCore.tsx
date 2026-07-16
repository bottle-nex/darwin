"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, MotionConfig } from "motion/react";
import AppLogo from "@/components/app/Applogo";
import { ADVANCE_TOTAL_MS, BACK_TOTAL_MS, type SpeedTarget } from "./choreography";
import type { BuddyPose } from "./CanvasBuddy";
import { EMPTY_DRAFT, TOUR_STEPS, type TourDraft } from "./steps";
import DoneScreen from "./DoneScreen";
import IntroScreen from "./IntroScreen";
import ProgressTrack from "./ProgressTrack";
import StepFrame from "./StepFrame";
import TourScene from "./TourScene";
import StepAgentsMd from "./steps/StepAgentsMd";
import StepBasics from "./steps/StepBasics";
import StepGithub from "./steps/StepGithub";
import StepTeam from "./steps/StepTeam";

type StepIndex = 1 | 2 | 3 | 4;
type Scene = "intro" | StepIndex | "done";

export default function OnboardingCore({
    initialDraft,
    repoFullName,
    completing,
    connecting,
    onComplete,
    onConnectGithub,
}: {
    initialDraft?: TourDraft;
    repoFullName?: string | null;
    completing?: boolean;
    connecting?: boolean;
    onComplete?: (draft: TourDraft) => void;
    onConnectGithub?: (draft: TourDraft) => void;
}) {
    const [scene, setScene] = useState<Scene>("intro");
    const [direction, setDirection] = useState(1);
    const [draft, setDraft] = useState<TourDraft>(initialDraft ?? EMPTY_DRAFT);
    const [jumpSignal, setJumpSignal] = useState(0);
    const [speedTarget, setSpeedTarget] = useState<SpeedTarget>("jog");
    const [transitioning, setTransitioning] = useState(false);
    const settleTimer = useRef<number>(undefined);

    useEffect(() => () => window.clearTimeout(settleTimer.current), []);

    const travel = (next: Scene, { jump = true, dir = 1 } = {}) => {
        if (transitioning) return;
        setTransitioning(true);
        setDirection(dir);
        if (jump) {
            setJumpSignal((n) => n + 1);
            setSpeedTarget("sprint");
        }
        setScene(next);
        window.clearTimeout(settleTimer.current);
        settleTimer.current = window.setTimeout(
            () => {
                setSpeedTarget("stop");
                setTransitioning(false);
            },
            jump ? ADVANCE_TOTAL_MS : BACK_TOTAL_MS,
        );
    };

    const start = () => travel(1);
    const advance = () => {
        if (typeof scene !== "number") return;
        travel(scene === 4 ? "done" : ((scene + 1) as StepIndex));
    };
    const back = () => {
        if (typeof scene !== "number" || scene === 1) return;
        travel((scene - 1) as StepIndex, { jump: false, dir: -1 });
    };
    const skipTour = () => travel("done");
    const finish = () => onComplete?.(draft);
    const patchDraft = (patch: Partial<TourDraft>) => setDraft((d) => ({ ...d, ...patch }));

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.metaKey || event.ctrlKey || event.altKey || event.isComposing) return;
            const target = event.target as HTMLElement | null;
            const editing =
                !!target &&
                (target.tagName === "INPUT" ||
                    target.tagName === "TEXTAREA" ||
                    target.isContentEditable);
            if (event.code === "Space") {
                if (scene === "intro") {
                    event.preventDefault();
                    start();
                } else if (typeof scene === "number" && !editing) {
                    event.preventDefault();
                    setJumpSignal((n) => n + 1);
                }
            }
            if (event.key === "Enter") {
                if (scene === "intro") start();
                else if (scene === "done") finish();
                else if (!editing || target?.tagName === "INPUT") advance();
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    });

    const pose: BuddyPose =
        scene === "done" ? "cheer" : scene === "intro" || transitioning ? "run" : "idle";

    return (
        <MotionConfig reducedMotion="user">
            <div
                data-lenis-prevent
                className="relative h-full overflow-hidden bg-[#0F0F10] font-sans"
            >
                <TourScene speedTarget={speedTarget} jumpSignal={jumpSignal} pose={pose} />
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.6, transition: { duration: 0.5 } }}
                    className="pointer-events-none absolute top-[12vh] left-[8vw]"
                >
                    <AppLogo iconOnly size={20} />
                </motion.div>
                {scene !== "intro" && (
                    <ProgressTrack activeStep={scene === "done" ? TOUR_STEPS.length + 1 : scene} />
                )}
                <AnimatePresence mode="wait" custom={direction}>
                    {scene === "intro" && <IntroScreen key="intro" onStart={start} />}
                    {typeof scene === "number" && (
                        <StepFrame
                            key={scene}
                            step={TOUR_STEPS[scene - 1]}
                            direction={direction}
                            transitioning={transitioning}
                            onNext={advance}
                            onBack={back}
                        >
                            {scene === 1 && <StepBasics draft={draft} onChange={patchDraft} />}
                            {scene === 2 && (
                                <StepGithub
                                    repoFullName={repoFullName}
                                    connecting={connecting}
                                    onConnect={() => onConnectGithub?.(draft)}
                                />
                            )}
                            {scene === 3 && <StepTeam draft={draft} onChange={patchDraft} />}
                            {scene === 4 && <StepAgentsMd />}
                        </StepFrame>
                    )}
                    {scene === "done" && (
                        <DoneScreen
                            key="done"
                            draft={draft}
                            loading={completing}
                            onFinish={finish}
                        />
                    )}
                </AnimatePresence>
                <AnimatePresence>
                    {typeof scene === "number" && (
                        <motion.button
                            key="skip"
                            type="button"
                            onClick={skipTour}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1, transition: { delay: 0.3, duration: 0.4 } }}
                            exit={{ opacity: 0, transition: { duration: 0.2 } }}
                            className="absolute top-6 right-7 cursor-pointer text-[13px] text-neutral-500 transition-colors hover:text-neutral-300"
                        >
                            Skip the tour
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>
        </MotionConfig>
    );
}
