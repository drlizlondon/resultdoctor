export type PathwayPriorityCode = "R" | "B" | "Pi" | "O" | "G";

export const PATHWAY_PRIORITY_LABELS: Record<PathwayPriorityCode, string> = {
  R: "Red flag / urgent referral",
  B: "Must-do GP action",
  Pi: "Routine referral",
  O: "Advice & Guidance",
  G: "Audio-visual / patient info",
};

const PRIORITY_ORDER: PathwayPriorityCode[] = ["R", "B", "Pi", "O", "G"];

export function extractPathwayPriorityCodes(boxes: string[]): PathwayPriorityCode[] {
  const matches = new Set<PathwayPriorityCode>();

  for (const box of boxes) {
    const match = box.match(/\((R|B|Pi|O|G)\)/);
    if (match) {
      matches.add(match[1] as PathwayPriorityCode);
    }
  }

  return PRIORITY_ORDER.filter((code) => matches.has(code));
}
