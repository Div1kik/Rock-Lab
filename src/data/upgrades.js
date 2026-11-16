export const TOOL_UPGRADES = [
  {
    key: 'drill',
    name: 'Аккумуляторный шуруповёрт',
    desc: 'Быстрее крутит болты и орудует ломиком; меняет корпус',
    baseCost: 110,
    costMult: 1.6,
    maxLevel: 6
  },
  {
    key: 'saw',
    name: 'Камнерезный станок (Пила)',
    desc: 'Ускоряет каретку на рельсе; на Ур.3+ лазерный прицел',
    baseCost: 140,
    costMult: 1.65,
    maxLevel: 6
  },
  {
    key: 'grinder',
    name: 'Торцешлифовальный станок',
    desc: 'Открывает этап шлифовки торцов! Снижает перекос и погрешность',
    baseCost: 210,
    costMult: 1.75,
    maxLevel: 5,
    isPurchaseFirst: true
  },
  {
    key: 'caliper',
    name: 'Цифровой штангенциркуль',
    desc: 'Плавный ход губок для точного замера H и D',
    baseCost: 130,
    costMult: 1.6,
    maxLevel: 6
  },
  {
    key: 'press',
    name: 'Сервоклапан гидропресса',
    desc: 'Замедляет стрелку и расширяет зелёную зону на стендах',
    baseCost: 165,
    costMult: 1.7,
    maxLevel: 6
  },
  {
    key: 'sensors',
    name: 'Лазерные тензодатчики',
    desc: 'Снижает итоговую погрешность протокола (±%)',
    baseCost: 190,
    costMult: 1.75,
    maxLevel: 6
  },
  {
    key: 'loader',
    name: 'Калибратор стабилометра',
    desc: 'Повышает премию к гонорару за каждый контракт (+10%/ур.)',
    baseCost: 150,
    costMult: 1.65,
    maxLevel: 6
  }
];

export const PERK_UPGRADES = [
  {
    key: 'cryobox',
    name: 'Крио-термобокс для мерзлоты',
    desc: 'Удерживает холод: мёрзлый суглинок тает в 2 раза медленнее!',
    baseCost: 240,
    costMult: 1.85,
    maxLevel: 3
  },
  {
    key: 'coffee',
    name: 'Кофемашина на верстак',
    desc: 'Появляется в лаборатории! Даёт +15 ₽ бодрых чаевых за заказ',
    baseCost: 220,
    costMult: 1.8,
    maxLevel: 3
  },
  {
    key: 'showcase',
    name: 'Витрина редких минералов',
    desc: 'Украшает стену образцами породы и приносит +30 ₽/контракт',
    baseCost: 300,
    costMult: 1.85,
    maxLevel: 4
  },
  {
    key: 'assistant',
    name: 'Стажёр-лаборант',
    desc: 'Автоматически выкручивает 1 болт в каждом новом ящике (до 3)',
    baseCost: 420,
    costMult: 2.0,
    maxLevel: 3
  },
  {
    key: 'decor',
    name: 'LED-свет и вытяжка',
    desc: 'Преображает интерьер лабы и даёт +1 ★ репутации за контракт',
    baseCost: 260,
    costMult: 1.8,
    maxLevel: 3
  }
];

export const TEST_UPGRADES = [
  {
    key: 'shear_crack',
    name: 'Стенд среза по трещине (Скол)',
    desc: 'Раскол керна гидроклином и сдвиг по неровному сколу',
    cost: 280,
    reqLab: 1
  },
  {
    key: 'water_sat',
    name: 'Весы и сушильный шкаф (Водопоглощение)',
    desc: 'Взвешивание, пропитка и сушка образца для расчёта размягчения',
    cost: 360,
    reqLab: 1
  },
  {
    key: 'ultrasonic',
    name: 'Ультразвуковой дефектоскоп (УЗК)',
    desc: 'Прозвучивание породы волнами на скрытую трещиноватость',
    cost: 480,
    reqLab: 2
  },
  {
    key: 'frost_test',
    name: 'Криокамера морозостойкости (F200)',
    desc: 'Циклы глубокой заморозки керна до -20°C с контролем льда',
    cost: 620,
    reqLab: 2
  },
  {
    key: 'shear_load',
    name: 'Сдвиговый прибор с прижимом (σ+τ)',
    desc: 'Срез под вертикальной нагрузкой для мостов и высоток',
    cost: 760,
    reqLab: 2
  },
  {
    key: 'triaxial',
    name: 'Трёхосная камера (Стабилометр)',
    desc: 'Всесторонний обжим жидкостью под давлением для ГЭС и метро',
    cost: 1150,
    reqLab: 3
  }
];

export const LAB_UPGRADES = [
  { level: 1, name: 'Гаражная геолаборатория', cost: 0, reqRep: 0 },
  { level: 2, name: 'Участковый пост контроля', cost: 350, reqRep: 18 },
  { level: 3, name: 'Инженерный центр грунтов', cost: 850, reqRep: 35 },
  { level: 4, name: 'Институт механики скал', cost: 1800, reqRep: 60 },
  { level: 5, name: 'Геотех-комплекс «Атлант»', cost: 3500, reqRep: 95 }
];

export function getToolCost(item, currentLevel) {
  if (item.isPurchaseFirst && currentLevel === 0) return item.baseCost;
  const effLvl = item.isPurchaseFirst ? currentLevel : Math.max(0, currentLevel - 1);
  return Math.round(item.baseCost * Math.pow(item.costMult, effLvl));
}

export function getPerkCost(item, currentLevel) {
  return Math.round(item.baseCost * Math.pow(item.costMult, currentLevel));
}
