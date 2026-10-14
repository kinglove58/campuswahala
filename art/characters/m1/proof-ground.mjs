/** Read-only adaptation of the EXISTING v2 CampusScene drawing in
 * apps/game/app/world.tsx at 12248aa. No new environment art or M3 design.
 * Same ground, roads, buildings and decorations; lab UI/NPCs remain separate.
 */
export function drawBaselineGround(scene, manifest, visible) {
  scene.add
    .rectangle(
      manifest.bounds.width / 2,
      manifest.bounds.height / 2,
      manifest.bounds.width,
      manifest.bounds.height,
      manifest.palette.ground,
    )
    .setDepth(-100);
  const roads = scene.add.graphics().setDepth(-90);
  for (const road of [...manifest.roads, ...manifest.paths]) {
    roads.lineStyle(road.width + 12, 0xe7dbc1, 1);
    roads.strokePoints(road.points);
    roads.lineStyle(
      road.width,
      road.id.includes("road") ? 0x7f8580 : 0xe7d6ac,
      1,
    );
    roads.beginPath();
    road.points.forEach((p, i) =>
      i ? roads.lineTo(p.x, p.y) : roads.moveTo(p.x, p.y),
    );
    roads.strokePath();
    if (road.id.includes("road")) {
      // Compressed virtual crossings, never physical road directions.
      const p = road.points[0];
      roads.fillStyle(0xf1ecda, 0.85);
      for (let j = 0; j < 6; j++)
        roads.fillRect(
          p.x + 100 + j * 13,
          p.y - road.width / 2 + 10,
          7,
          road.width - 20,
        );
      roads.lineStyle(2, 0xf7e9bf, 0.6);
      roads.strokePoints(road.points);
    }
  }

  const zoneBuildings = new Map(
    manifest.zones.map((z) => [
      z.id,
      manifest.buildings.filter((b) => b.zoneId === z.id),
    ]),
  );
  const zoneDecorations = new Map(
    manifest.zones.map((z) => [
      z.id,
      manifest.decorations.filter((d) => d.zoneId === z.id),
    ]),
  );
  for (const zone of visible) {
    const chunk = scene.add.container(0, 0).setDepth(1);
    const bundle = manifest.assetBundles.find((b) => b.id === zone.bundle);
    const g = scene.add.graphics();
    chunk.add(g);
    // Ground variation is deterministic, cosmetic and drawn once per chunk.
    for (let j = 0; j < 48; j++) {
      const x = zone.x + 32 + ((j * 131) % (zone.width - 64));
      const y = zone.y + 32 + ((j * 197) % (zone.height - 64));
      g.fillStyle(
        j % 2 ? 0xf3e6bc : manifest.palette.foliage,
        j % 2 ? 0.2 : 0.09,
      );
      g.fillEllipse(x, y, 25 + (j % 13), 12);
    }
    if (manifest.artDirection.waterfrontSocialZone && zone.type === "social") {
      g.fillStyle(manifest.palette.water, 0.8);
      g.fillRoundedRect(zone.x + 12, zone.y + 12, zone.width - 24, 125, 30);
      g.lineStyle(2, 0xd6eee3, 0.7);
      for (let j = 0; j < 10; j++)
        g.lineBetween(
          zone.x + 60 + j * 90,
          zone.y + 65,
          zone.x + 100 + j * 90,
          zone.y + 65,
        );
    }
    for (const b of zoneBuildings.get(zone.id) ?? []) {
      // Long projected shadow and visible wall base give roofs height.
      g.fillStyle(0x20342c, 0.2);
      g.fillRoundedRect(b.x + 12, b.y + 16, b.width, b.height, 5);
      g.fillStyle(0x8e7b62);
      g.fillRoundedRect(b.x + 4, b.y + 18, b.width, b.height, 5);
      g.fillStyle(manifest.palette.wall);
      g.fillRoundedRect(b.x, b.y, b.width, b.height, 5);
      g.fillStyle(manifest.palette.roof);
      g.fillRoundedRect(
        b.x - 8,
        b.y - 14,
        b.width + 16,
        b.silhouette === "tower" ? 48 : 38,
        4,
      );
      if (manifest.artDirection.roofStyle === "pitched") {
        g.fillStyle(0xb98060);
        g.fillTriangle(
          b.x - 8,
          b.y - 14,
          b.x + b.width / 2,
          b.y - 42,
          b.x + b.width + 8,
          b.y - 14,
        );
        g.lineStyle(1, 0x713f2d, 0.45);
        for (let j = 0; j < 8; j++)
          g.lineBetween(
            b.x + (j * b.width) / 8,
            b.y - 8,
            b.x + (j * b.width) / 8,
            b.y + 20,
          );
      } else if (manifest.artDirection.roofStyle === "brutalist") {
        g.fillStyle(0xb5aa8d);
        g.fillRect(b.x - 14, b.y - 26, b.width + 28, 16);
        g.fillStyle(0xe9dfc2);
        for (let j = 0; j < 8; j++)
          g.fillRect(b.x + (j * b.width) / 8, b.y - 32, 8, 32);
        g.fillStyle(0x725f4a, 0.25);
        g.fillRect(b.x - 8, b.y + 16, b.width + 16, 8);
      } else {
        g.fillStyle(0x39666f);
        g.fillRoundedRect(b.x - 6, b.y - 25, b.width + 12, 15, 4);
        g.fillStyle(0xf4efd9);
        for (let j = 0; j < 5; j++)
          g.fillRect(b.x + 15 + j * 40, b.y + 18, 6, b.height - 28);
      }
      if (b.silhouette === "hall") {
        g.fillStyle(0xf5ecd6);
        for (let i = 0; i < 5; i++)
          g.fillRect(b.x + 12 + i * 35, b.y + 34, 8, 85);
      }
      g.fillStyle(0x52747c);
      for (let i = 0; i < 4; i++) {
        g.fillRect(b.x + 15 + i * 42, b.y + 43, 22, 20);
        if (b.silhouette === "tower")
          g.fillRect(b.x + 15 + i * 42, b.y + 76, 22, 16);
      }
      g.lineStyle(2, 0xc6bea8);
      for (let j = 0; j < 4; j++)
        g.strokeRect(b.x + 15 + j * 42, b.y + 43, 22, 20);
      g.fillStyle(0x31513c);
      g.fillRoundedRect(b.x + b.width / 2 - 32, b.y + b.height - 50, 64, 15, 3);
      g.fillStyle(0xf0e0bb);
      g.fillRect(b.x + b.width / 2 - 15, b.y + b.height + 3, 30, 6);
      g.fillRect(b.x + b.width / 2 - 22, b.y + b.height + 10, 44, 6);
      g.fillStyle(0x694e37);
      g.fillRect(b.x + b.width / 2 - 12, b.y + b.height - 32, 24, 32);
      if (b.silhouette === "market") {
        g.fillStyle(0xd8a858);
        g.fillRect(b.x - 6, b.y + 55, b.width + 12, 24);
        g.fillStyle(0xf8e8bb);
        for (let i = 0; i < 7; i++) g.fillRect(b.x + i * 28, b.y + 55, 14, 24);
      }
      const venue = manifest.venues.find((v) => v.buildingId === b.id);
      const label = scene.add
        .text(b.x + b.width / 2, b.y + b.height + 48, venue.name, {
          fontFamily: "Arial",
          fontSize: "14px",
          color: "#263a2e",
          backgroundColor: "#f7edda",
          padding: { x: 8, y: 5 },
        })
        .setOrigin(0.5);
      chunk.add(label);
    }
    for (const d of zoneDecorations.get(zone.id) ?? []) {
      if (d.type === "tree" || d.type === "palm") {
        if (scene.textures.exists(bundle.id) && d.type === "tree") {
          chunk.add(scene.add.image(d.x, d.y, bundle.id).setOrigin(0.5, 1));
        } else {
          g.fillStyle(0x24372b, 0.13);
          g.fillEllipse(d.x + 7, d.y + 2, 50, 16);
          g.fillStyle(0x94704b);
          g.fillRect(d.x - 3, d.y - 22, 6, 25);
          g.fillStyle(manifest.palette.foliage);
          if (d.type === "palm") {
            for (let j = 0; j < 6; j++) {
              const a = (j * Math.PI) / 3;
              g.fillTriangle(
                d.x,
                d.y - 35,
                d.x + Math.cos(a) * 37,
                d.y - 35 + Math.sin(a) * 23,
                d.x + Math.cos(a + 0.5) * 18,
                d.y - 35 + Math.sin(a + 0.5) * 15,
              );
            }
          } else {
            g.fillCircle(d.x, d.y - 35, 26);
            g.fillStyle(0xa8b97a, 0.5);
            g.fillCircle(d.x - 9, d.y - 44, 14);
          }
        }
      }
      if (d.type === "bench") {
        g.fillStyle(0x2e4134, 0.15);
        g.fillEllipse(d.x + 4, d.y + 9, 48, 14);
        g.fillStyle(0x8d6845);
        g.fillRoundedRect(d.x - 24, d.y - 5, 48, 7, 2);
        g.fillRoundedRect(d.x - 24, d.y - 16, 48, 6, 2);
        g.fillStyle(0x3c493e);
        g.fillRect(d.x - 18, d.y + 1, 4, 10);
        g.fillRect(d.x + 14, d.y + 1, 4, 10);
      }
      if (d.type === "banner") {
        g.fillStyle(0x536149);
        g.fillRect(d.x - 2, d.y - 46, 4, 50);
        g.fillStyle(0xc87651);
        g.fillRoundedRect(d.x + 2, d.y - 46, 31, 37, 2);
        g.lineStyle(3, 0xf4d9a5);
        g.lineBetween(d.x + 9, d.y - 34, d.x + 25, d.y - 34);
      }
      if (d.type === "lamp") {
        g.fillStyle(0x5b6050);
        g.fillRect(d.x - 2, d.y - 44, 4, 46);
        g.fillStyle(0xf4d88b);
        g.fillCircle(d.x, d.y - 45, 7);
      }
      if (d.type === "notice") {
        g.fillStyle(0x72563e);
        g.fillRect(d.x - 22, d.y - 26, 44, 32);
        g.fillRect(d.x - 18, d.y + 6, 4, 18);
        g.fillRect(d.x + 14, d.y + 6, 4, 18);
        g.fillStyle(0xf2dfb9);
        g.fillRect(d.x - 17, d.y - 21, 34, 22);
        g.lineStyle(2, 0xb57550);
        g.lineBetween(d.x - 11, d.y - 14, d.x + 10, d.y - 14);
      }
      if (d.type === "shuttle") {
        g.fillStyle(0xdfb34e);
        g.fillRoundedRect(d.x - 32, d.y - 15, 64, 31, 7);
        g.fillStyle(0x456169);
        g.fillRoundedRect(d.x - 23, d.y - 12, 44, 11, 3);
        g.fillStyle(0x303932);
        g.fillCircle(d.x - 18, d.y + 16, 6);
        g.fillCircle(d.x + 18, d.y + 16, 6);
      }
    }
  }
}
