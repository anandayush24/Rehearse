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
  { id: "master", label: "Master 0→1B", tracks: ["M1"] },
  { id: "hld", label: "HLD", tracks: ["H0", "H1", "H2", "H3", "H4", "H5", "H6"] },
  { id: "lld", label: "LLD", tracks: ["L1", "L2", "L3"] },
  { id: "os", label: "OS", tracks: ["O1"] },
  { id: "dbms", label: "DBMS", tracks: ["Q1"] },
  { id: "networks", label: "Networks", tracks: ["N1"] },
  { id: "oop", label: "OOP", tracks: ["P1"] },
  { id: "dsa", label: "DSA", tracks: [] },
  { id: "cicd", label: "CI/CD", tracks: ["I1"] },
  { id: "certifications", label: "Certifications", tracks: ["D1"] },
];

export const categoryById = (id: string) => CATEGORIES.find((c) => c.id === id);
export const categoryOfTrack = (track: string) => CATEGORIES.find((c) => c.tracks.includes(track));
