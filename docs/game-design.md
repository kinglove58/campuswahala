# Game design and authority

World first, minimal HUD, phone for complexity. Stylized top-down Phaser map is fictional fixture geometry with walkable paths, venues, trees, NPC decoration and avatar. Pointer/touch destination and arrow/WASD movement, bounded coordinates. Nearby venue reveals interaction. Opening the phone pauses movement; it provides map, fixture schedule, profile, inventory and notifications. No invented real timetable or real-money balance.

Palette: ink #162b24, forest #19583f, cream #f5f1e5, lime #d8ee89, clay #cb714f. Strong type hierarchy, rounded outlined surfaces, short restrained motion; reduced-motion respected in CSS. HUD exposes name/campus and guest scope. Phone uses fictional CW Pocket identity.

Player metrics (future): health, energy, mood, academic performance, social/campus/business reputation, skills/XP, virtual cash. Each metric has configurable bounds; only server commands change durable values. Academics use programme-specific activity templates, course-credit weighted CGPA and configured progression/carryover policies. Duration is individual and does not imply universally numbered levels.

Wahala templates contain id/version, eligibility DSL, weight, cooldown, choices, server effects and consequence references. Evaluate campus/programme/level/semester/money/energy/health/timetable/location/hostel/time/relations/items/history/reputation/weather/global events. Inject deterministic RNG and clock for tests; no client-selected reward. Avoid manipulative streak penalties. Transport costs/time/energy come from pack definitions, not university conditionals in code.

Housing/room decoration, hustles, quests, campus wars, graduation shirt and alumni replay are later slices. Real recruitment, commerce, gifts and virtual simulation must remain visibly distinct. No real GPS is required; physical location is future opt-in only.


Phase 4 implements only energy, satiety, mood and fictional wellbeing on the authoritative academic timeline. The future metric/context lists above are roadmap concepts, not current eligibility inputs. No money, real weather authority, sensitive identity traits, health diagnoses or social/viral systems are used. See ADR 014.
