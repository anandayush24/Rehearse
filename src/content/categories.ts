/** Top-level subjects shown in the top bar. A category lists the track folders (A1, B1, …) that belong to it. */
export interface Category {
  id: string;
  label: string;
  tracks: string[];
}

export const CATEGORIES: Category[] = [
  { id: "android", label: "Android", tracks: ["A1", "A2"] },
  { id: "backend", label: "Backend", tracks: ["B1"] },
  { id: "genai", label: "GenAI", tracks: ["C0", "C1", "C2", "C3", "C4", "C5", "C6", "C7", "C8"] },
  { id: "hld", label: "HLD", tracks: [] },
  { id: "lld", label: "LLD", tracks: [] },
  { id: "dsa", label: "DSA", tracks: [] },
  { id: "cicd", label: "CI/CD", tracks: [] },
  { id: "certifications", label: "Certifications", tracks: ["D1"] },
];

export const categoryById = (id: string) => CATEGORIES.find((c) => c.id === id);
export const categoryOfTrack = (track: string) => CATEGORIES.find((c) => c.tracks.includes(track));
