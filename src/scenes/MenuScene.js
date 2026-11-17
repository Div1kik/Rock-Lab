    // Отрисовка шкафа-витрины с редкими минералами
    if (showcaseLvl > 0 || labLvl >= 2) {
      const shelfX = 20;
      const shelfY = 172;
      g.fillStyle(0x18181b, 0.95);
      g.fillRoundedRect(shelfX, shelfY, 68, 160, 6);
      g.lineStyle(2, tier.accent, 0.8);
      g.strokeRoundedRect(shelfX, shelfY, 68, 160, 6);

      const foundGems = Storage.getGems();
      for (let i = 0; i < 4; i++) {
        const sy = shelfY + 24 + i * 35;
        g.fillStyle(0x3f3f46, 1);
        g.fillRect(shelfX + 8, sy + 14, 52, 4);

        if (foundGems[i]) {
          g.fillStyle(foundGems[i].color, 1);
          g.fillCircle(shelfX + 34, sy + 4, 7);
          g.lineStyle(1.5, 0xffffff, 0.8);
          g.strokeCircle(shelfX + 34, sy + 4, 7);
        } else {
          g.fillStyle(0x27272a, 1);
          g.fillCircle(shelfX + 34, sy + 4, 4);
        }
      }
    }
