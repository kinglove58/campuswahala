"use client";
import { useState } from "react";
import {
  academicClock,
  applyAcademicCommand,
  createTerm,
  simulationCourses,
  type AcademicTerm,
} from "@campuswahala/domain";
import type { WorldManifest } from "@campuswahala/game-engine";
/** In-memory guest tutorial only. Conversion never reads or imports this data. */
export function AcademicTutorial({ world }: { world: WorldManifest }) {
  const [term, setTerm] = useState<AcademicTerm | null>(null),
    [step, setStep] = useState(0);
  const begin = () => {
    const venues = world.venues.map((v) => ({
      ...world.spawnPoints.find((s) => s.id === v.safeSpawnId)!,
      id: v.id,
      name: v.name,
      type: v.type,
    }));
    const id = crypto.randomUUID();
    setTerm(
      createTerm({
        id,
        sequence: 1,
        label: "Ephemeral tutorial",
        track: "computing",
        programmeId: id,
        structureId: id,
        structureVersion: 1,
        stageId: id,
        semesterId: id,
        entryMode: "demo",
        activityTags: [],
        campusId: world.campusId,
        worldVersion: world.version,
        venues,
        presenceVenueId: venues.find((v) => v.type === "library")!.id,
        studyVenueIds: venues
          .filter((v) => v.type === "library")
          .map((v) => v.id),
        templates: simulationCourses("computing", 0, 0),
      }),
    );
    setStep(0);
  };
  const next = () => {
    if (!term) return;
    const copy = structuredClone(term),
      commandId = crypto.randomUUID(),
      termId = copy.id;
    if (step === 0)
      applyAcademicCommand(copy, {
        commandId,
        termId,
        type: "STUDY",
        courseId: copy.courses[0]!.id,
        minutes: 60,
      });
    if (step === 1)
      applyAcademicCommand(copy, {
        commandId,
        termId,
        type: "TRAVEL_TO_VENUE",
        venueId: copy.courses[0]!.lectures[0]!.venueId,
      });
    if (step === 2)
      applyAcademicCommand(copy, {
        commandId,
        termId,
        type: "WAIT_TO_NEXT_EVENT",
      });
    if (step === 3)
      applyAcademicCommand(copy, {
        commandId,
        termId,
        type: "WAIT_TO_NEXT_EVENT",
      });
    if (step === 4)
      applyAcademicCommand(copy, {
        commandId,
        termId,
        type: "ATTEND_LECTURE",
        lectureId: copy.courses[0]!.lectures[0]!.id,
      });
    setTerm(copy);
    setStep((s) => s + 1);
  };
  return (
    <section className="academic-panel">
      <p className="fixture">
        Guest academic tutorial · Demo only · Discarded on reload · No durable
        grades or GPA.
      </p>
      {!term ? (
        <button onClick={begin}>Try academic tutorial</button>
      ) : (
        <>
          <p>
            {academicClock(term.minute).day} {academicClock(term.minute).clock}{" "}
            · Demo mastery {(term.courses[0]!.mastery / 100).toFixed(0)}%
          </p>
          {step < 5 ? (
            <button onClick={next}>
              {
                [
                  "Demo: study for 60 minutes",
                  "Demo: travel to lecture hall",
                  "Demo: wait near lecture",
                  "Demo: wait until lecture starts",
                  "Demo: attend lecture",
                ][step]
              }
            </button>
          ) : (
            <p>
              Tutorial complete. Save your journey to begin your persistent
              semester.
            </p>
          )}
        </>
      )}
    </section>
  );
}
