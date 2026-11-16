export const ROCK_TYPES = [
  { id: 'limestone', name: 'Известняк', minMpa: 22, maxMpa: 45, color: 0xd6d3d1 },
  { id: 'sandstone', name: 'Песчаник', minMpa: 35, maxMpa: 68, color: 0xd97706 },
  { id: 'granite', name: 'Гранит', minMpa: 65, maxMpa: 115, color: 0x94a3b8 },
  { id: 'basalt', name: 'Базальт', minMpa: 85, maxMpa: 145, color: 0x475569 },
  { id: 'permafrost', name: 'Мёрзлый суглинок', minMpa: 14, maxMpa: 34, color: 0x38bdf8 }
];

export const TEST_CATALOG = {
  uniaxial: { id: 'uniaxial', name: 'Одноосное сжатие', short: 'Сжатие' },
  shear: { id: 'shear', name: 'Прямой сдвиг', short: 'Сдвиг' },
  shear_load: { id: 'shear_load', name: 'Сдвиг со сжатием', short: 'Сдвиг+Р' },
  triaxial: { id: 'triaxial', name: 'Трёхосная камера', short: 'Стабилометр' }
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
  { tier: 1, title: 'Коттеджный посёлок «Сосны»', reqMpa: 25, boxes: 1, tests: ['uniaxial'] },
  { tier: 1, title: 'Опора ЛЭП №14', reqMpa: 32, boxes: 1, tests: ['uniaxial', 'shear'] },
  { tier: 2, title: 'Мост через р. Каменка', reqMpa: 48, boxes: 1, tests: ['uniaxial', 'shear_load'] },
  { tier: 2, title: 'ЖК «Высота» (24 этажа)', reqMpa: 55, boxes: 2, tests: ['uniaxial', 'shear', 'shear_load'] },
  { tier: 3, title: 'Тоннель метро «Восточный»', reqMpa: 72, boxes: 2, tests: ['uniaxial', 'shear_load', 'triaxial'] },
  { tier: 4, title: 'Борт алмазного карьера', reqMpa: 85, boxes: 3, tests: ['uniaxial', 'shear', 'shear_load', 'triaxial'] },
  { tier: 5, title: 'Плотина Саянской ГЭС-2', reqMpa: 98, boxes: 3, tests: ['uniaxial', 'shear', 'shear_load', 'triaxial'] }
];

const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export function generateContract(labLevel = 1, completedCount = 0) {
  const maxTier = Math.min(5, Math.max(1, labLevel + (completedCount >= 3 ? 1 : 0)));
  const pool = SITES.filter((s) => s.tier <= maxTier);
  const site = pick(pool);
  const rock = pick(ROCK_TYPES);
  const company = pick(COMPANIES);

  // Реальная прочность образца (может оказаться как выше, так и ниже порога объекта)
  const swing = randInt(-18, 24);
  const trueStrengthMpa = Math.max(10, Math.min(160, site.reqMpa + swing));
  const isActuallySafe = trueStrengthMpa >= site.reqMpa;

  const baseReward = 90 + site.tier * 65 + site.tests.length * 35;

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
    tests: [...site.tests],
    reward: baseReward,
    repReward: site.tier * 2 + site.tests.length
  };
}

export function generateContractBoard(labLevel = 1, completedCount = 0, count = 3) {
  const list = [];
  for (let i = 0; i < count; i++) {
    list.push(generateContract(labLevel, completedCount));
  }
  return list;
}
