/* global Phaser, window */
import { cameraProfile } from "../../packages/game-engine/src/visual";
import {
  CharacterAtlasCache,
  CharacterVisual,
} from "../../apps/game/app/character-visual";
import { characterAssets } from "../../apps/game/app/character-assets";
/** Camera-only test staging. No room manifest, API, furniture or authority. */
class Stage extends Phaser.Scene {
  create() {
    this.profile = cameraProfile(
      this.scale.width,
      this.scale.height,
      false,
      "indoor-staging",
    );
    this.add.rectangle(360, 400, 720, 800, 0xe9dfc6);
    this.add.text(
      22,
      25,
      "INDOOR CAMERA STAGING\nSame production B renderer\nNo navigable room / no authority",
      { fontSize: "14px", color: "#314637" },
    );
    this.cacheB = new CharacterAtlasCache(this);
    this.player = new CharacterVisual(
      this,
      this.cacheB,
      360,
      400,
      characterAssets[0].appearance,
    );
    this.cameras.main
      .setBounds(0, 0, 720, 800)
      .setZoom(this.profile.defaultZoom)
      .startFollow(
        this.player.sprite,
        true,
        this.profile.follow,
        this.profile.follow,
      );
    this.events.once("shutdown", () => {
      this.player.dispose();
      this.cacheB.dispose();
    });
  }
  update(time) {
    this.player.update(360, 400, time, this.profile.spriteScale, false, false);
    if (this.player.entry)
      window.__cwM2stage = {
        ready: true,
        label: "INDOOR CAMERA TEST STAGING ONLY; not production/M4",
        profile: this.profile,
        canvas: { width: this.scale.width, height: this.scale.height },
        bodyPixels:
          this.player.entry.bodyHeight *
          this.profile.spriteScale *
          this.cameras.main.zoom,
        source:
          "exact approved B, production CharacterVisual/CharacterAtlasCache",
      };
  }
}
new Phaser.Game({
  type: Phaser.AUTO,
  parent: "stage",
  width: window.innerWidth,
  height: window.innerHeight - 48,
  scene: Stage,
  backgroundColor: "#e9dfc6",
  audio: { noAudio: true },
  fps: { target: 30 },
});
