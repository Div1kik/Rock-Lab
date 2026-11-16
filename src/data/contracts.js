import { Storage } from '../utils/Storage.js';

export const ROCK_TYPES = [
  { id: 'limestone', name: 'Известняк', minMpa: 22, maxMpa: 45, color: 0xd6d3d1 },
  { id: 'sandstone', name: 'Песчаник', minMpa: 35, maxMpa: 68, color: 0xd97706 },
  { id: 'granite', name: 'Гранит', minMpa: 65, maxMpa: 115, color: 0x94a3b8 },
  { id: 'basalt', name: 'Базальт', minMpa: 85, maxMpa: 145, color: 0x475569 },
  { id: 'permafrost', name: 'Мёрзлый суглинок', minMpa: 14, maxMpa: 34, color: 0x38bdf8 }
];

export const TEST_CATALOG = {
  uniaxial: {
    id: 'uniaxial',
    name: 'Одноосное сжатие',
    short: 'Сжатие',
    prepType: 'cylinder'
  },
  shear_cut: {
    id: 'shear_cut',
    name: 'Срез по распилу (2 шайбы)',
    short: 'Срез (распил)',
    prepType: 'two_discs'
  },
  shear_crack: {
    id: 'shear_crack',
    name: 'Срез по трещине (скол)',
    short: 'Срез (трещина)',
    prepType: 'split_core'
  },
  shear_load: {
    id: 'shear_load',
    name: 'Сдвиг со сжатием (σ+τ)',
    short: 'Сдвиг+Р',
    prepType: 'two_discs'
  },
  ultrasonic: {
    id: 'ultrasonic',
    name: 'Ультразвук (трещиноватость)',
    short: 'УЗК волна',
    prepType: 'cylinder'
  },
  triaxial: {
    id: 'triaxial',
    name: 'Трёхосная камера',
    short: 'Стабилометр',
    prepType: 'cylinder'
  }
};

const COMPANIES = [
  'ООО «СтройФундамент»',
  'Трест «СеверГео»',
  'АО «МостИнжПроект»',
  'ГК «Горный Вектор»',
  'СМУ «УралНедра»',
  '«АрктикТрансСтрой»'
];

const SITES = [
  { tier: 1, title: 'Коттеджный посёлок «Сосны»', reqMpa: 25, boxes: 1, maxTests: 1 },
  { tier: 1, title: 'Опора ЛЭП №14', reqMpa: 32, boxes: 1, maxTests: 2 },
  { tier: 2, title: 'Мост через р. Каменка', reqMpa: 48, boxes: 1, maxTests: 2 },
  { tier: 2, title: 'ЖК «Высота» (24 этажа)', reqMpa: 55, boxes: 2, maxTests: 3 },
  { tier: 3, title: 'Тоннель метро «Восточный»', reqMpa: 72, boxes: 2, maxTests: 3 },
  { tier: 4, title: 'Борт алмазного карьера', reqMpa: 85, boxes: 3, maxTests: 4 },
  { tier: 5, title: 'Плотина Саянской ГЭС-2', reqMpa: 98, boxes: 3, maxTests: 4 }
];

const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export function generateContract(labLevel = 1, completedCount = 0) {
  const maxTier = Math.min(5, Math.max(1, labLevel + (completedCount >= 3 ? 1 : 0)));
  const pool = SITES.filter((s) => s.tier <= maxTier);
  const site = pick(pool);
  const rock = pick(ROCK_TYPES);
  const company = pick(COMPANIES);

  // Формируем список испытаний только из открытых игроком стендов
  const unlocked = Storage.getUnlockedTests();
  const shuffled = [...unlocked].sort(() => Math.random() - 0.5);
  const testsCount = Math.min(shuffled.length, Math.max(1, site.maxTests));
  const selectedTests = shuffled.slice(0, testsCount);

  const swing = randInt(-18, 24);
  const trueStrengthMpa = Math.max(10, Math.min(160, site.reqMpa + swing));
  const isActuallySafe = trueStrengthMpa >= site.reqMpa;

  // Бонус к гонорару за продвинутые испытания (трещина, УЗК, стабилометр)
  const premiumCount = selectedTests.filter((t) =>
    ['shear_crack', 'ultrasonic', 'triaxial', 'shear_load'].includes(t)
  ).length;

  const baseReward = 95 + site.tier * 65 + selectedTests.length * 35 + premiumCount * 45;

  return {
    id: `cnt_${Date.now()}_${randInt(100, 999)}`,
    company,
    title: site.title,
    tier: site.tier,
    rock,
    reqMpa: site.reqMpa,
    trueStrengthMpa,
    isActuallySafe,
    boxesCount: site.boxes,
    tests: selectedTests,
    reward: baseReward,
    repReward: site.tier * 2 + selectedTests.length + premiumCount
  };
}

export function generateContractBoard(labLevel = 1, completedCount = 0, count = 3) {
  const list = [];
  for (let i = 0; i < count; i++) {
    list.push(generateContract(labLevel, completedCount));
  }
  return list;
}
