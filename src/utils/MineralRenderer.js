/**
 * Процедурный рендерер деталей и псевдо-3D вращения минералов и руд
 */
export class MineralRenderer {
  /**
   * Создаёт интерактивный 3D-контейнер минерала, который можно вращать
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   * @param {string} gemId
   * @param {number} scale
   * @param {boolean} interactiveRotate
   */
  static createMineralDisplay(scene, x, y, gemId, scale = 1, interactiveRotate = false) {
    const container = scene.add.container(x, y);
    const baseG = scene.add.graphics();
    const facetG = scene.add.graphics();
    const glintG = scene.add.graphics();

    container.add([baseG, facetG, glintG]);
    container.setScale(scale);

    let rotAngle = 0; // радианы вращения вокруг своей оси
    let tiltY = 0;    // наклон по вертикали (-0.4 .. 0.4)
    let velX = interactiveRotate ? 0.6 : 0.9; // лёгкое автовращение
    let isDragging = false;
    let lastPtrX = 0;
    let lastPtrY = 0;

    const redraw = () => {
      baseG.clear();
      facetG.clear();
      glintG.clear();

      const cosA = Math.cos(rotAngle);
      const sinA = Math.sin(rotAngle);
      const shiftX = sinA * 10;
      const shiftY = tiltY * 12;

      switch (gemId) {
        case 'calcite':
          this.drawCalcite(baseG, facetG, glintG, shiftX, shiftY, cosA);
          break;
        case 'pyrite':
          this.drawPyrite(baseG, facetG, glintG, shiftX, shiftY, cosA, sinA);
          break;
        case 'agate':
          this.drawAgate(baseG, facetG, glintG, shiftX, shiftY, cosA);
          break;
        case 'quartz':
          this.drawQuartz(baseG, facetG, glintG, shiftX, shiftY, cosA, sinA);
          break;
        case 'ammonite':
          this.drawAmmonite(baseG, facetG, glintG, rotAngle, tiltY);
          break;
        case 'amethyst':
          this.drawAmethyst(baseG, facetG, glintG, shiftX, shiftY, cosA);
          break;
        case 'malachite':
          this.drawMalachite(baseG, facetG, glintG, shiftX, shiftY, cosA);
          break;
        case 'native_gold':
          this.drawNativeGold(baseG, facetG, glintG, shiftX, shiftY, cosA, sinA);
          break;
        case 'diamond_kimberlite':
          this.drawDiamondKimberlite(baseG, facetG, glintG, shiftX, shiftY, cosA, sinA);
          break;
        default:
          this.drawQuartz(baseG, facetG, glintG, shiftX, shiftY, cosA, sinA);
          break;
      }
    };

    redraw();

    // Обновление анимации вращения каждый кадр
    const onUpdate = (_time, delta) => {
      if (!container.active) {
        scene.events.off('update', onUpdate);
        return;
      }
      const dt = delta / 1000;
      if (!isDragging) {
        rotAngle += velX * dt;
        if (interactiveRotate) {
          // Плавное затухание ручной раскрутки до лёгкого демонстрационного вращения
          velX = Phaser.Math.Linear(velX, 0.35, dt * 1.8);
          tiltY = Phaser.Math.Linear(tiltY, 0, dt * 1.5);
        }
      }
      redraw();
    };
    scene.events.on('update', onUpdate);

    if (interactiveRotate) {
      const hitRadius = 86;
      const hitZone = scene.add.zone(0, 0, hitRadius * 2, hitRadius * 2)
        .setInteractive({ useHandCursor: true });

      hitZone.on('pointerdown', (ptr) => {
        isDragging = true;
        lastPtrX = ptr.x;
        lastPtrY = ptr.y;
        velX = 0;
      });

      const onPointerMove = (ptr) => {
        if (!isDragging || !container.active) return;
        const dx = ptr.x - lastPtrX;
        const dy = ptr.y - lastPtrY;
        lastPtrX = ptr.x;
        lastPtrY = ptr.y;

        rotAngle += dx * 0.024;
        tiltY = Phaser.Math.Clamp(tiltY + dy * 0.012, -0.45, 0.45);
        velX = dx * 0.28;
        redraw();
      };

      const onPointerUp = () => {
        isDragging = false;
      };

      scene.input.on('pointermove', onPointerMove);
      scene.input.on('pointerup', onPointerUp);

      container.once('destroy', () => {
        scene.events.off('update', onUpdate);
        scene.input.off('pointermove', onPointerMove);
        scene.input.off('pointerup', onPointerUp);
      });

      container.add(hitZone);
    } else {
      container.once('destroy', () => {
        scene.events.off('update', onUpdate);
      });
    }

    return container;
  }

  // 1. Щётка белого кальцита (острые ромбоэдрические кристаллы на породе)
  static drawCalcite(baseG, facetG, glintG, sx, sy, cosA) {
    // Порода-подложка
    baseG.fillStyle(0x57534e, 1);
    baseG.fillEllipse(0, 22 + sy * 0.3, 56, 20);
    baseG.lineStyle(2, 0x292524, 1);
    baseG.strokeEllipse(0, 22 + sy * 0.3, 56, 20);

    const spikes = [
      { x: -18, y: 14, h: 34, w: 11, lean: -0.25 },
      { x: -6, y: 16, h: 46, w: 13, lean: -0.08 },
      { x: 8, y: 15, h: 42, w: 12, lean: 0.12 },
      { x: 20, y: 16, h: 30, w: 10, lean: 0.28 }
    ];

    spikes.forEach((sp, idx) => {
      const px = sp.x + sx * (0.6 + idx * 0.1);
      const topX = px + sp.lean * 18 + sx * 0.4;
      const topY = sp.y - sp.h + sy * 0.5;

      // Левая теневая грань
      facetG.fillStyle(0xcbd5e1, 0.95);
      facetG.beginPath();
      facetG.moveTo(px - sp.w / 2, sp.y);
      facetG.lineTo(topX, topY);
      facetG.lineTo(px, sp.y);
      facetG.closePath();
      facetG.fillPath();

      // Правая световая грань
      facetG.fillStyle(0xf8fafc, 0.98);
      facetG.beginPath();
      facetG.moveTo(px, sp.y);
      facetG.lineTo(topX, topY);
      facetG.lineTo(px + sp.w / 2, sp.y);
      facetG.closePath();
      facetG.fillPath();

      facetG.lineStyle(1.2, 0x94a3b8, 0.85);
      facetG.strokeTriangle(px - sp.w / 2, sp.y, topX, topY, px + sp.w / 2, sp.y);
    });

    glintG.fillStyle(0xffffff, 0.7 + cosA * 0.25);
    glintG.fillCircle(-4 + sx * 0.5, -18 + sy * 0.4, 3);
  }

  // 2. Друза пирита (золотистые металлические кубы)
  static drawPyrite(baseG, facetG, glintG, sx, sy, cosA, sinA) {
    baseG.fillStyle(0x44403c, 1);
    baseG.fillRoundedRect(-28, 12 + sy * 0.2, 56, 16, 6);

    const drawCube = (cx, cy, size, shade) => {
      const ox = cx + sx * shade;
      const oy = cy + sy * 0.4;
      const hs = size / 2;
      const depth = size * 0.36;

      // Передняя грань
      facetG.fillStyle(0xfacc15, 1);
      facetG.fillRect(ox - hs, oy - hs, size, size);
      facetG.lineStyle(1.5, 0x854d0e, 1);
      facetG.strokeRect(ox - hs, oy - hs, size, size);

      // Верхняя грань
      facetG.fillStyle(0xfef08a, 1);
      facetG.beginPath();
      facetG.moveTo(ox - hs, oy - hs);
      facetG.lineTo(ox - hs + depth * 0.7, oy - hs - depth * 0.6);
      facetG.lineTo(ox + hs + depth * 0.7, oy - hs - depth * 0.6);
      facetG.lineTo(ox + hs, oy - hs);
      facetG.closePath();
      facetG.fillPath();
      facetG.strokePath();

      // Боковая грань
      facetG.fillStyle(0xca8a04, 1);
      facetG.beginPath();
      facetG.moveTo(ox + hs, oy - hs);
      facetG.lineTo(ox + hs + depth * 0.7, oy - hs - depth * 0.6);
      facetG.lineTo(ox + hs + depth * 0.7, oy + hs - depth * 0.6);
      facetG.lineTo(ox + hs, oy + hs);
      facetG.closePath();
      facetG.fillPath();
      facetG.strokePath();

      // Штриховка пирита
      glintG.lineStyle(1, 0xfef9c3, 0.75);
      glintG.lineBetween(ox - hs + 3, oy - 3, ox + hs - 3, oy - 3);
      glintG.lineBetween(ox - hs + 3, oy + 4, ox + hs - 3, oy + 4);
    };

    drawCube(-14, 4, 22, 0.5);
    drawCube(12, 6, 20, 0.7);
    drawCube(0, -10, 26, 1.0);

    if (sinA > -0.2) {
      glintG.fillStyle(0xffffff, 0.9);
      glintG.fillCircle(4 + sx, -16 + sy * 0.4, 3);
    }
  }

  // 3. Срез полосчатого агата (жеода с концентрическими слоями халцедона)
  static drawAgate(baseG, facetG, glintG, sx, sy) {
    // Внешняя серо-коричневая корка
    baseG.fillStyle(0x78350f, 1);
    baseG.fillEllipse(0, 0, 64, 54);
    baseG.lineStyle(2.5, 0x451a03, 1);
    baseG.strokeEllipse(0, 0, 64, 54);

    // Концентрические слои агата со смещением при повороте
    const layers = [
      { w: 54, h: 44, col: 0xd97706 },
      { w: 44, h: 36, col: 0xfef3c7 },
      { w: 34, h: 27, col: 0xea580c },
      { w: 24, h: 19, col: 0xfdba74 },
      { w: 14, h: 11, col: 0xf8fafc }
    ];

    layers.forEach((l, idx) => {
      const factor = (idx + 1) * 0.14;
      facetG.fillStyle(l.col, 0.96);
      facetG.fillEllipse(sx * factor, sy * factor, l.w, l.h);
      facetG.lineStyle(1, 0x9a3412, 0.45);
      facetG.strokeEllipse(sx * factor, sy * factor, l.w, l.h);
    });

    // Стеклянный полированный блик
    glintG.lineStyle(2.5, 0xffffff, 0.65);
    glintG.beginPath();
    glintG.arc(-4 + sx * 0.3, -4 + sy * 0.3, 18, Phaser.Math.DegToRad(200), Phaser.Math.DegToRad(290));
    glintG.strokePath();
  }

  // 4. Кристалл горного хрусталя (прозрачная шестигранная призма)
  static drawQuartz(baseG, facetG, glintG, sx, sy, cosA) {
    const topY = -36 + sy * 0.4;
    const shoulderY = -14 + sy * 0.2;
    const botY = 28;
    const w = 22;
    const ridgeX = sx * 0.85;

    // Задняя/боковая теневая грань
    baseG.fillStyle(0x7dd3fc, 0.72);
    baseG.beginPath();
    baseG.moveTo(-w, shoulderY);
    baseG.lineTo(0, topY);
    baseG.lineTo(w, shoulderY);
    baseG.lineTo(w - 2, botY);
    baseG.lineTo(-w + 2, botY);
    baseG.closePath();
    baseG.fillPath();

    // Левая грань призмы
    facetG.fillStyle(0xbae6fd, 0.88);
    facetG.beginPath();
    facetG.moveTo(-w, shoulderY);
    facetG.lineTo(0, topY);
    facetG.lineTo(ridgeX, shoulderY + 3);
    facetG.lineTo(ridgeX * 0.8, botY);
    facetG.lineTo(-w + 2, botY);
    facetG.closePath();
    facetG.fillPath();

    // Правая светлая грань призмы
    facetG.fillStyle(0xf0f9ff, 0.94);
    facetG.beginPath();
    facetG.moveTo(ridgeX, shoulderY + 3);
    facetG.lineTo(0, topY);
    facetG.lineTo(w, shoulderY);
    facetG.lineTo(w - 2, botY);
    facetG.lineTo(ridgeX * 0.8, botY);
    facetG.closePath();
    facetG.fillPath();

    // Контуры граней
    glintG.lineStyle(1.8, 0xffffff, 0.9);
    glintG.strokeRect(-w + 2, shoulderY, (w - 2) * 2, botY - shoulderY);
    glintG.lineBetween(-w, shoulderY, 0, topY);
    glintG.lineBetween(w, shoulderY, 0, topY);
    glintG.lineBetween(ridgeX, shoulderY + 3, 0, topY);
    glintG.lineBetween(ridgeX, shoulderY + 3, ridgeX * 0.8, botY);

    if (cosA > -0.3) {
      glintG.fillStyle(0xffffff, 0.95);
      glintG.fillCircle(ridgeX + 4, shoulderY - 4, 2.5);
    }
  }

  // 5. Отпечаток древнего аммонита (спиральная перламутровая раковина)
  static drawAmmonite(baseG, facetG, glintG, rotAngle, tiltY) {
    // Известняковая плитка с отпечатком
    baseG.fillStyle(0x78716c, 1);
    baseG.fillRoundedRect(-32, -30, 64, 60, 12);
    baseG.lineStyle(2, 0x44403c, 1);
    baseG.strokeRoundedRect(-32, -30, 64, 60, 12);

    const sy = tiltY * 8;
    // Золотисто-янтарная раковина
    facetG.fillStyle(0xd97706, 1);
    facetG.fillCircle(0, sy, 23);
    facetG.lineStyle(2, 0x78350f, 1);
    facetG.strokeCircle(0, sy, 23);

    // Спираль и перегородки (септы)
    glintG.lineStyle(2, 0xfef3c7, 0.95);
    glintG.beginPath();
    const turns = 2.6;
    const steps = 42;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const ang = rotAngle + t * Math.PI * 2 * turns;
      const rad = 2 + t * 20;
      const px = Math.cos(ang) * rad;
      const py = sy + Math.sin(ang) * rad;
      if (i === 0) glintG.moveTo(px, py);
      else glintG.lineTo(px, py);

      if (i % 4 === 0 && i > 6) {
        const innerRad = Math.max(1, rad - 6);
        glintG.lineBetween(
          px,
          py,
          Math.cos(ang - 0.25) * innerRad,
          sy + Math.sin(ang - 0.25) * innerRad
        );
      }
    }
    glintG.strokePath();
  }

  // 6. Жеода уральского аметиста (фиолетовые кристаллы внутри каменной полости)
  static drawAmethyst(baseG, facetG, glintG, sx, sy, cosA) {
    baseG.fillStyle(0x3f3f46, 1);
    baseG.fillEllipse(0, 0, 64, 56);
    baseG.lineStyle(2.5, 0x18181b, 1);
    baseG.strokeEllipse(0, 0, 64, 56);

    // Внутренняя тёмно-фиолетовая полость
    baseG.fillStyle(0x3b0764, 1);
    baseG.fillEllipse(sx * 0.25, sy * 0.25, 50, 42);

    const crystals = [
      { x: -12, y: -6, col: 0xa855f7 },
      { x: 8, y: -10, col: 0xc084fc },
      { x: -14, y: 10, col: 0x9333ea },
      { x: 10, y: 8, col: 0xd8b4fe },
      { x: 0, y: 0, col: 0xe879f9 }
    ];

    crystals.forEach((c) => {
      const cx = c.x + sx * 0.45;
      const cy = c.y + sy * 0.45;
      facetG.fillStyle(c.col, 0.95);
      facetG.beginPath();
      facetG.moveTo(cx, cy - 9);
      facetG.lineTo(cx + 8, cy);
      facetG.lineTo(cx, cy + 9);
      facetG.lineTo(cx - 8, cy);
      facetG.closePath();
      facetG.fillPath();
      facetG.lineStyle(1, 0xf3e8ff, 0.8);
      facetG.strokePath();
    });

    glintG.fillStyle(0xffffff, 0.75 + cosA * 0.2);
    glintG.fillCircle(sx * 0.5, -2 + sy * 0.5, 2.5);
  }

  // 7. Жилка уральского малахита (бархатистые изумрудные узоры)
  static drawMalachite(baseG, facetG, glintG, sx, sy) {
    baseG.fillStyle(0x064e3b, 1);
    baseG.fillRoundedRect(-30, -26, 60, 52, 16);
    baseG.lineStyle(2, 0x022c22, 1);
    baseG.strokeRoundedRect(-30, -26, 60, 52, 16);

    const rings = [
      { x: -10, y: -4, r: 18, c1: 0x059669, c2: 0x34d399 },
      { x: 12, y: 6, r: 16, c1: 0x10b981, c2: 0x6ee7b7 },
      { x: 4, y: -10, r: 12, c1: 0x047857, c2: 0xa7f3d0 }
    ];

    rings.forEach((rg) => {
      const rx = rg.x + sx * 0.4;
      const ry = rg.y + sy * 0.4;
      facetG.fillStyle(rg.c1, 0.95);
      facetG.fillCircle(rx, ry, rg.r);
      facetG.fillStyle(rg.c2, 0.95);
      facetG.fillCircle(rx, ry, rg.r * 0.62);
      facetG.fillStyle(0x065f46, 1);
      facetG.fillCircle(rx, ry, rg.r * 0.3);
    });

    glintG.lineStyle(2, 0xd1fae5, 0.55);
    glintG.lineBetween(-18 + sx * 0.2, -16 + sy * 0.2, 14 + sx * 0.2, -16 + sy * 0.2);
  }

  // 8. Самородок золота в кварце
  static drawNativeGold(baseG, facetG, glintG, sx, sy, cosA, sinA) {
    // Белый жильный кварц
    baseG.fillStyle(0xe2e8f0, 1);
    baseG.fillRoundedRect(-30, -24, 60, 48, 14);
    baseG.lineStyle(2, 0x94a3b8, 1);
    baseG.strokeRoundedRect(-30, -24, 60, 48, 14);

    // Массивные золотые прожилки и самородок
    const gx = sx * 0.5;
    const gy = sy * 0.4;
    facetG.fillStyle(0xfbbf24, 1);
    facetG.fillRoundedRect(-18 + gx, -12 + gy, 36, 24, 9);
    facetG.fillCircle(-12 + gx * 0.8, 8 + gy, 10);
    facetG.fillCircle(14 + gx * 1.1, -6 + gy, 11);

    facetG.lineStyle(2, 0xb45309, 0.9);
    facetG.strokeRoundedRect(-18 + gx, -12 + gy, 36, 24, 9);

    glintG.fillStyle(0xfef9c3, 0.95);
    glintG.fillCircle(-6 + gx, -4 + gy, 4);
    if (sinA > 0) {
      glintG.fillCircle(12 + gx, -6 + gy, 3);
    }
    if (cosA > 0) {
      glintG.fillCircle(2 + gx, 6 + gy, 2.5);
    }
  }

  // 9. Алмаз в кимберлите (голубой октаэдр в тёмной матрице)
  static drawDiamondKimberlite(baseG, facetG, glintG, sx, sy, cosA, sinA) {
    // Тёмно-синий кимберлит
    baseG.fillStyle(0x1e293b, 1);
    baseG.fillRoundedRect(-32, -26, 64, 52, 16);
    baseG.lineStyle(2.5, 0x0f172a, 1);
    baseG.strokeRoundedRect(-32, -26, 64, 52, 16);

    // Вкрапления оливина и пиропа
    baseG.fillStyle(0x15803d, 0.8);
    baseG.fillCircle(-20, 12, 4);
    baseG.fillStyle(0xb91c1c, 0.8);
    baseG.fillCircle(21, -11, 3.5);

    // Огранённый голубой алмаз в центре
    const dx = sx * 0.6;
    const dy = sy * 0.5;
    const topY = -22 + dy;
    const midY = -6 + dy;
    const botY = 22 + dy;

    // Корона алмаза
    facetG.fillStyle(0xe0f2fe, 0.98);
    facetG.beginPath();
    facetG.moveTo(-12 + dx, topY);
    facetG.lineTo(12 + dx, topY);
    facetG.lineTo(22 + dx, midY);
    facetG.lineTo(-22 + dx, midY);
    facetG.closePath();
    facetG.fillPath();

    // Павильон (нижний конус)
    facetG.fillStyle(0x38bdf8, 0.95);
    facetG.beginPath();
    facetG.moveTo(-22 + dx, midY);
    facetG.lineTo(22 + dx, midY);
    facetG.lineTo(dx, botY);
    facetG.closePath();
    facetG.fillPath();

    // Внутренние грани
    facetG.fillStyle(0x7dd3fc, 0.9);
    facetG.beginPath();
    facetG.moveTo(-8 + dx, topY);
    facetG.lineTo(8 + dx, topY);
    facetG.lineTo(10 + dx, midY);
    facetG.lineTo(dx, botY);
    facetG.lineTo(-10 + dx, midY);
    facetG.closePath();
    facetG.fillPath();

    glintG.lineStyle(1.5, 0xffffff, 0.95);
    glintG.strokeTriangle(-22 + dx, midY, 22 + dx, midY, dx, botY);
    glintG.lineBetween(-12 + dx, topY, 12 + dx, topY);
    glintG.lineBetween(-12 + dx, topY, -22 + dx, midY);
    glintG.lineBetween(12 + dx, topY, 22 + dx, midY);

    // Искры преломления
    if (cosA > 0 || sinA > 0) {
      glintG.lineStyle(2, 0xffffff, 0.95);
      const gx = -10 + dx;
      const gy = -12 + dy;
      glintG.lineBetween(gx - 6, gy, gx + 6, gy);
      glintG.lineBetween(gx, gy - 6, gx, gy + 6);
    }
  }
}
