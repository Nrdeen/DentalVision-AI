/**
 * Panoramic indication follows cleared dental-AI practice (Pearl Second Opinion Panoramic):
 * the adult module is for patients 16 and older. Detections are not shown at 12 and under.
 * Ages 13–15 stay outside this panoramic module because its indication starts at 16.
 * A pediatric panoramic model is added later, and only for the child cohort.
 */

export const PANORAMIC_ADULT_MIN_AGE = 16;
export const PANORAMIC_CHILD_MAX_AGE = 12;

export type PanoramicCohort = "unset" | "adult" | "child" | "adolescent";

export function panoramicCohort(age: number | null | undefined): PanoramicCohort {
  if (age == null || !Number.isFinite(age)) return "unset";
  const years = Math.floor(age);
  if (years >= PANORAMIC_ADULT_MIN_AGE) return "adult";
  if (years <= PANORAMIC_CHILD_MAX_AGE) return "child";
  return "adolescent";
}

export function adultPanoramicAllowed(age: number | null | undefined): boolean {
  return panoramicCohort(age) === "adult";
}
