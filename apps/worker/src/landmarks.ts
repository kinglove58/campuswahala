import type { FactCandidate } from "@campuswahala/campus-content";
/** Discovery hints, never published facts. Exact source pages must pass normal robots, safe-fetch, grounding and publication. */
export const landmarkResearch = [
  {
    campus: "futa",
    url: "https://lib.futa.edu.ng/",
    key: "library.name",
    name: "Albert Ilemobade Library",
    category: "building",
  },
  {
    campus: "futa",
    url: "https://healthcentre.futa.edu.ng/",
    key: "health-centre.name",
    name: "University Health Centre",
    category: "location",
  },
  {
    campus: "futa",
    url: "https://soc.futa.edu.ng/",
    key: "computing.name",
    name: "School of Computing",
    category: "faculty",
  },
  {
    campus: "futa",
    url: "https://sad.futa.edu.ng/",
    key: "student-affairs.name",
    name: "Student Affairs",
    category: "location",
  },
  {
    campus: "futa",
    url: "https://daa.futa.edu.ng/",
    key: "academic-affairs.name",
    name: "Directorate of Academic Affairs",
    category: "location",
  },
  {
    campus: "oau",
    url: "https://opac.oauife.edu.ng/",
    key: "library.name",
    name: "Hezekiah Oluwasanmi Library",
    category: "building",
  },
  {
    campus: "oau",
    url: "https://oauife.edu.ng/other-arms-and-units/",
    key: "library.name",
    name: "Hezekiah Oluwasanmi Library",
    category: "building",
  },
  {
    campus: "unilag",
    url: "https://library.unilag.edu.ng/",
    key: "library.name",
    name: "University of Lagos Library",
    category: "building",
  },
  {
    campus: "unilag",
    url: "https://unilag.edu.ng/explore-campus/",
    key: "senate.name",
    name: "Senate Building",
    category: "building",
  },
] as const;
export function extractLandmarks(page: {
  body: string;
  sourceUrl: string;
}): FactCandidate[] {
  const plain = page.body
    .replace(new RegExp("<!--[\\s\\S]*?-->", "g"), " ")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ");
  return landmarkResearch
    .filter((h) => h.url === page.sourceUrl)
    .flatMap((h) => {
      const match = new RegExp(h.name.split(" ").join("\\s+"), "i").exec(plain);
      if (!match) return [];
      return [
        {
          entityType: h.category,
          key: h.key,
          value: match[0],
          category: h.category,
          confidence: 0.9,
          locator: `visible-text:${h.key}`,
          excerpt: match[0],
        },
      ];
    });
}
