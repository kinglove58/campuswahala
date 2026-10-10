import { registeredPacks } from "./registry";
import { previewPackSchema, type CampusPack } from "./schema";
export * from "./schema";
export * from "./publication";
export const campuses: CampusPack[] = registeredPacks.map((p) =>
  previewPackSchema.parse(p),
);
export const getCampus = (id: string) => campuses.find((p) => p.id === id);
export function validProgramme(campus: string, programme: string): boolean {
  return !!getCampus(campus)?.programmes.some((p) => p.id === programme);
}
export function validAcademicPosition(input: {
  campusId: string;
  programmeId: string;
  level: number;
}): boolean {
  return !!getCampus(input.campusId)
    ?.programmes.find((p) => p.id === input.programmeId)
    ?.structure.stages.some((s) => s.code === input.level);
}


export * from "./catalogue";
