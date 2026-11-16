export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {}

  create() {
    this.generateCoreTexture();
    this.generateRockPatternTexture();
    this.generateBoltTexture();
    this.generateParticleTexture();

    this.scene.start('MenuScene');
  }

  generateCoreTexture() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    const w = 64;
    const h = 96;

    // Тело цилиндрического керна
    g.fillStyle(0xb8b2a8, 1);
    g.fillRoundedRect(4, 10, w - 8, h - 20, 6);

    // Светотень цилиндра
    g.fillStyle(0xffffff, 0.16);
    g.fillRect(10, 12, 12, h - 24);
    g.fillStyle(0x000000, 0.2);
    g.fillRect(w - 18, 12, 10, h - 24);

    // Верхний эллипс среза
    g.fillStyle(0xd6d1c9, 1);
    g.fillEllipse(w / 2, 12, w - 8, 16);
    g.lineStyle(2, 0x78716c, 1);
    g.strokeEllipse(w / 2, 12, w - 8, 16);

    // Минеральные прожилки и зернистость
    g.fillStyle(0x57534e, 0.75);
    for (let i = 0; i < 48; i++) {
      const rx = 8 + ((i * 19) % (w - 16));
      const ry = 20 + ((i * 29) % (h - 30));
      g.fillRect(rx, ry, 2 + (i % 3), 2);
    }
    g.lineStyle(1.5, 0x44403c, 0.65);
    g.lineBetween(10, 36, 48, 44);
    g.lineBetween(14, 64, 52, 58);

    g.generateTexture('rock_core', w, h);
    g.destroy();
  }

  // Текстура горной породы для заготовок на отрезном станке, шлифовке, штангенциркуле и сдвиге
  generateRockPatternTexture() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    const size = 64;

    g.fillStyle(0xffffff, 1);
    g.fillRect(0, 0, size, size);

    // Тёмные и светлые минеральные зёрна (кварц, слюда, полевой шпат)
    for (let i = 0; i < 95; i++) {
      const px = (i * 23 + (i % 7) * 5) % size;
      const py = (i * 37 + (i % 5) * 7) % size;
      const shade = i % 3 === 0 ? 0x000000 : i % 3 === 1 ? 0x334155 : 0xf8fafc;
      const alpha = i % 3 === 2 ? 0.24 : 0.22;
      g.fillStyle(shade, alpha);
      g.fillRect(px, py, 2 + (i % 3), 2 + ((i + 1) % 2));
    }

    // Тонкие геологические прожилки
    g.lineStyle(1.5, 0x0f172a, 0.22);
    g.beginPath();
    g.moveTo(0, 18);
    g.lineTo(24, 24);
    g.lineTo(48, 16);
    g.lineTo(64, 22);
    g.moveTo(0, 48);
    g.lineTo(30, 44);
    g.lineTo(64, 52);
    g.strokePath();

    g.generateTexture('rock_tex', size, size);
    g.destroy();
  }

  generateBoltTexture() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    const s = 32;
    g.fillStyle(0x94a3b8, 1);
    g.fillCircle(s / 2, s / 2, 13);
    g.lineStyle(2, 0x334155, 1);
    g.strokeCircle(s / 2, s / 2, 13);

    g.lineStyle(3, 0x1e293b, 1);
    g.lineBetween(s / 2 - 7, s / 2, s / 2 + 7, s / 2);
    g.lineBetween(s / 2, s / 2 - 7, s / 2, s / 2 + 7);

    g.generateTexture('bolt_head', s, s);
    g.destroy();
  }

  generateParticleTexture() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xe7e5e4, 1);
    g.fillRect(0, 0, 6, 6);
    g.generateTexture('dust_px', 6, 6);
    g.destroy();
  }
}
