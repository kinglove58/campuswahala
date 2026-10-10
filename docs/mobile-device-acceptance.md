# Physical Android acceptance — human gate

Status: **NOT TESTED ON PHYSICAL DEVICES**. Chromium CPU/network throttling and Pixel emulation do not substitute for this gate. No physical frame rate, RAM, thermal or connection result is claimed.

Test one lower-end Android (budget Tecno/Infinix/Redmi/Samsung class, ideally 2–4 GB RAM) and one mid-range Android (4–8 GB RAM). Use the current production build and record its commit/world versions. Do not enter production credentials into a local demo identity. Existing public-release security gates still apply.

| Record | Lower-end device | Mid-range device |
| --- | --- | --- |
| Actual model / Android version | Pending human test | Pending human test |
| RAM / free storage | Pending | Pending |
| Browser / version | Pending | Pending |
| Carrier, connection and latency | Pending | Pending |
| Commit / world revision | Pending | Pending |
| Cold game load / transfer | Pending | Pending |
| Warm game load / transfer | Pending | Pending |
| Touch responsiveness / tap destination | Pending | Pending |
| Pocket map, guide scroll, close / keyboard | Pending | Pending |
| Frame stability (clear / rain) | Pending | Pending |
| Reload, offline, reconnect / crashes | Pending | Pending |
| 20-minute memory / thermal observations | Pending | Pending |
| Result / tester / date / evidence | Not executed | Not executed |

1. Clear site data, then load marketing and enter FUTA on mobile data. Record cold shell/world boot and measured transferred bytes; no extrapolated FPS. Repeat OAU and UNILAG. Verify placeholder names are marked fictional when published evidence is absent.
2. Walk with taps for two minutes, cross zones and inspect detailed art loading. Verify player, entrances and navigation remain readable at 360×800 (or actual viewport). Switch rain, walk near NPC groups, take a shuttle and enter a study/lecture venue.
3. Open CW Pocket. Check safe-area fit, 44-pixel controls, map destination, guide pagination, readable sources, notices and profile. Check back/close, focus, Escape using a keyboard if available and reduced motion. Never require religion or infer it from a visit.
4. Warm reload and repeat measurements. If testing an authorized local/private account, confirm safe spawn/appearance resume and private no-store APIs. Test existing-account guest conflict: both options preserve the guest; guest exploration must not write account world state.
5. Disable connectivity while the world is open: movement and map should continue; account writes and live guide reads must fail safely. Reload offline: branded static fallback appears, with no cached account or guest identity. Reconnect and resume normally. No authoritative mutation should replay.
6. Keep walking/changing zones/using the phone for 20 minutes. Record crashes, jank, browser heap diagnostics where supported and warmth/battery observation (subjective unless measured). Repeat under weak/high-latency data. Do not confuse cosmetic Pocket battery with hardware battery.
7. Record every failed assertion and attach screenshots/measurement files. Acceptance requires no privacy leak, no crash/trapped player, usable touch/phone controls and stable play near the 30-FPS target. Report measured limitations; owner review decides whether a device/network shortfall blocks Phase 3.
