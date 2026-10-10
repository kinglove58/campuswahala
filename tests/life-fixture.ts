import { randomUUID } from "node:crypto";
import {
  createTerm,
  simulationCourses,
} from "../packages/domain/src/academics";
import { createCampusWorld } from "../packages/game-engine/src";
export function lifeTerm(campus: "futa" | "oau" | "unilag" = "futa") {
  const w = createCampusWorld(campus),
    venues = w.venues.map((v) => ({
      ...v,
      ...w.spawnPoints.find((s) => s.id === v.safeSpawnId)!,
      id: v.id,
    }));
  return createTerm({
    id: randomUUID(),
    sequence: 1,
    label: "CampusWahala simulation semester",
    track: "computing",
    programmeId: randomUUID(),
    structureId: randomUUID(),
    structureVersion: 1,
    stageId: randomUUID(),
    semesterId: randomUUID(),
    entryMode: "standard",
    activityTags: [],
    programmePlan: { stages: [], semesters: [] },
    campusId: w.campusId,
    worldVersion: w.version,
    venues,
    presenceVenueId: venues.find((v) => v.type === "hostel")!.id,
    studyVenueIds: venues
      .filter((v) => ["library", "hostel"].includes(v.type))
      .map((v) => v.id),
    templates: simulationCourses("computing", 0, 0),
  });
}
