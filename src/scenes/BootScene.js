import { PlatformSDK } from '../utils/PlatformSDK.js';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create() {
    this.generateProceduralTextures();
    PlatformSDK.notifyLoadingReady();
    this.scene.start('MenuScene');
  }

  generateProceduralTextures() {
    const make = (key, w, h, drawFn) => {
      if (this.textures.exists(key)) return;
      const cvs = this.textures.createCanvas(key, w, h);
      const ctx = cvs.getContext();
      ctx.imageSmoothingEnabled = false; // чёткий пиксель-стайл
      drawFn(ctx, w, h);
      cvs.refresh();
    };

    // Пиксельный болт для ящика
    make('bolt_head', 32, 32, (ctx) => {
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.arc(16, 16, 13, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.arc(15, 15, 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#1e293b';
      ctx.fillRect(14, 8, 4, 16);
      ctx.fillRect(8, 14, 16, 4);
    });

    // Образец цилиндрического керна
    make('rock_core', 64, 96, (ctx) => {
      // Тень
      ctx.fillStyle = '#57534e';
      ctx.fillRect(10, 12, 44, 76);
      // Основной цилиндр породы
      ctx.fillStyle = '#a8a29e';
      ctx.fillRect(10, 10, 36, 74);
      // Верхний срез
      ctx.fillStyle = '#d6d3d1';
      ctx.fillRect(10, 8, 44, 10);
      // Вкрапления минералов
      ctx.fillStyle = '#44403c';
      ctx.fillRect(16, 26, 6, 4);
      ctx.fillRect(28, 44, 8, 6);
      ctx.fillRect(18, 62, 5, 5);
      ctx.fillStyle = '#e7e5e4';
      ctx.fillRect(34, 30, 4, 4);
      ctx.fillRect(22, 52, 6, 3);
    });

    // Частица пыли / стружки
    make('dust_px', 8, 8, (ctx) => {
      ctx.fillStyle = '#eab308';
      ctx.fillRect(2, 2, 4, 4);
    });
  }
}
