import { Storage } from '../utils/Storage.js';

export const ROCK_TYPES = [
  {
    id: 'limestone',
    name: 'Известняк',
    trait: 'standard',
    traitLabel: 'Однородный карбонат',
    minMpa: 22,
    maxMpa: 45,
    color: 0xd6d3d1
  },
  {
    id: 'sandstone',
    name: 'Песчаник водонасыщенный',
    trait: 'wet',
    traitLabel: '💧 Влагонасыщен (размягчается)',
    minMpa: 32,
    maxMpa: 64,
    color: 0xd97706
  },
  {
    id: 'granite',
    name: 'Гранит трещиноватый',
    trait: 'brittle',
    traitLabel: '⚡ Хрупкий скол (узкий пик)',
    minMpa: 65,
    maxMpa: 115,
    color: 0x94a3b8
  },
  {
    id: 'basalt',
    name: 'Базальт монолитный',
    trait: 'dense',
    traitLabel: '🛡️ Сверхплотный массив',
    minMpa: 85,
    maxMpa: 145,
    color: 0x475569
  },
  {
    id: 'permafrost',
    name: 'Мёрзлый суглинок',
    trait: 'frozen',
    traitLabel: '❄️ Мерзлота (оттаивает на столе!)',
    minMpa: 14,
    maxMpa: 36,
    color: 0x38bdf8
  }
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
  water_sat: {
    id: 'water_sat',
    name: 'Водопоглощение и сушка',
    short: 'Водопоглощение',
    prepType: 'cylinder'
  },
  frost_test: {
    id: 'frost_test',
    name: 'Морозостойкость (Криокамера)',
    short: 'Морозостойкость',
    prepType: 'cylinder'
  },
  ultrasonic: {
    id: 'ultrasonic',
    name: 'Ультразвук (трещиноватость)',
    short: 'УЗК волна',
    prepType: 'cylinder'
  },
  shear_load: {
    id: 'shear_load',
    name: 'Сдвиг со сжатием (σ+τ)',
    short: 'Сдвиг+Р',
    prepType: 'two_discs'
  },
  triaxial: {
    id: 'triaxial',
    name: 'Трёхосная камера',
    short: 'Стабилометр',
    prepType: 'cylinder'
  }
};

export const RARE_INCLUSIONS = [
  { id: 'calcite', name: 'Щётка белого кальцита', rarity: 'Обычный', weight: 24, value: 110, color: 0xf1f5f9, icon: '🤍' },
  { id: 'pyrite', name: 'Друза золотистого пирита', rarity: 'Обычный', weight: 22, value: 150, color: 0xfacc15, icon: '🟡' },
  { id: 'agate', name: 'Срез полосчатого агата', rarity: 'Обычный', weight: 18, value: 190, color: 0xfb923c, icon: '🟠' },
  { id: 'quartz', name: 'Кристалл горного хрусталя', rarity: 'Редкий', weight: 13, value: 260, color: 0xbae6fd, icon: '💎' },
  { id: 'ammonite', name: 'Отпечаток древнего аммонита', rarity: 'Редкий', weight: 10, value: 340, color: 0xf59e0b, icon: '🐚' },
  { id: 'amethyst', name: 'Жеода уральского аметиста', rarity: 'Редкий', weight: 7, value: 450, color: 0xc084fc, icon: '🟣' },
  { id: 'malachite', name: 'Жилка уральского малахита', rarity: 'Эпический', weight: 3.5, value: 680, color: 0x34d399, icon: '🟢' },
  { id: 'native_gold', name: 'Самородок золота в кварце', rarity: 'Эпический', weight: 1.8, value: 980, color: 0xfbbf24, icon: '🪙' },
  { id: 'diamond_kimberlite', name: 'Алмаз в кимберлите', rarity: 'Легендарный', weight: 0.7, value: 1850, color: 0x38bdf8, icon: '✨' }
];

export const MEGA_PROJECTS = [
  {
    id: 'mega_bridge',
    title: 'Вантовый мост «Северный Пролив»',
    company: 'Госкорпорация «Автодор-Север»',
    siteType: 'bridge',
    icon: '🌉',
    reqLab: 3,
    reqStaff: 1,
    stageReward: 1600,
    finalBonus: 12500,
    finalRep: 35,
    desc: 'Грандиозный 3-километровый переход через морской пролив на скальных сваях.',
    stages: [
      { name: 'Этап 1/3: Береговые устои', reqMpa: 68, rockId: 'granite', tests: ['uniaxial', 'shear_load', 'ultrasonic'], boxes: 2 },
      { name: 'Этап 2/3: Русловые опоры', reqMpa: 76, rockId: 'basalt', tests: ['uniaxial', 'water_sat', 'shear_cut'], boxes: 2 },
      { name: 'Этап 3/3: Фундамент главного пилона', reqMpa: 84, rockId: 'granite', tests: ['uniaxial', 'triaxial', 'frost_test'], boxes: 3 }
    ]
  },
  {
    id: 'mega_metro',
    title: 'Кольцевое метро «Глубокий Горизонт»',
    company: 'МУП «Метрострой-Инжиниринг»',
    siteType: 'tunnel',
    icon: '🚇',
    reqLab: 3,
    reqStaff: 2,
    stageReward: 2200,
    finalBonus: 22000,
    finalRep: 55,
    desc: 'Проходка глубокого заложения (75 м) под историческим центром и рекой.',
    stages: [
      { name: 'Этап 1/4: Наклонный эскалаторный ход', reqMpa: 70, rockId: 'limestone', tests: ['uniaxial', 'shear_crack', 'water_sat'], boxes: 2 },
      { name: 'Этап 2/4: Перегонный тоннель №1', reqMpa: 78, rockId: 'sandstone', tests: ['uniaxial', 'triaxial', 'ultrasonic'], boxes: 2 },
      { name: 'Этап 3/4: Свод подземного вестибюля', reqMpa: 85, rockId: 'granite', tests: ['uniaxial', 'shear_load', 'triaxial'], boxes: 3 },
      { name: 'Этап 4/4: Вентиляционный ствол', reqMpa: 90, rockId: 'basalt', tests: ['uniaxial', 'frost_test', 'triaxial'], boxes: 3 }
    ]
  },
  {
    id: 'mega_tower',
    title: 'Небоскрёб «Башня Атлант» (85 этажей)',
    company: 'ГК «Высота-Девелопмент»',
    siteType: 'highrise',
    icon: '🏙️',
    reqLab: 4,
    reqStaff: 3,
    stageReward: 3100,
    finalBonus: 34000,
    finalRep: 80,
    desc: 'Сверхвысотный деловой центр с нагрузкой на плиту свыше 450 000 тонн.',
    stages: [
      { name: 'Этап 1/4: Глубокий котлован (-24 м)', reqMpa: 82, rockId: 'granite', tests: ['uniaxial', 'shear_load', 'ultrasonic'], boxes: 2 },
      { name: 'Этап 2/4: Баретты и свайное поле', reqMpa: 90, rockId: 'basalt', tests: ['uniaxial', 'triaxial', 'shear_cut'], boxes: 3 },
      { name: 'Этап 3/4: Ядро жёсткости башни', reqMpa: 98, rockId: 'basalt', tests: ['uniaxial', 'triaxial', 'ultrasonic'], boxes: 3 },
      { name: 'Этап 4/4: Стилобат и подземный паркинг', reqMpa: 88, rockId: 'limestone', tests: ['uniaxial', 'water_sat', 'shear_load'], boxes: 3 }
    ]
  },
  {
    id: 'mega_dam',
    title: 'Заполярная ГЭС «Ледяной Щит»',
    company: 'ПАО «РусГидро-Арктика»',
    siteType: 'dam',
    icon: '⚡',
    reqLab: 5,
    reqStaff: 4,
    stageReward: 4200,
    finalBonus: 52000,
    finalRep: 120,
    desc: 'Арочно-гравитационная плотина в зоне вечной мерзлоты и скальных каньонов.',
    stages: [
      { name: 'Этап 1/5: Левобережное примыкание', reqMpa: 92, rockId: 'granite', tests: ['uniaxial', 'frost_test', 'triaxial'], boxes: 3 },
      { name: 'Этап 2/5: Мерзлотная завеса основания', reqMpa: 28, rockId: 'permafrost', tests: ['uniaxial', 'frost_test', 'shear_load'], boxes: 3 },
      { name: 'Этап 3/5: Водосбросной тракт', reqMpa: 102, rockId: 'basalt', tests: ['uniaxial', 'water_sat', 'ultrasonic'], boxes: 3 },
      { name: 'Этап 4/5: Подземный машинный зал', reqMpa: 108, rockId: 'basalt', tests: ['uniaxial', 'triaxial', 'shear_crack'], boxes: 3 },
      { name: 'Этап 5/5: Гребень плотины (Финал)', reqMpa: 112, rockId: 'granite', tests: ['uniaxial', 'triaxial', 'frost_test', 'ultrasonic'], boxes: 3 }
    ]
  }
];

export function generateMegaStageContract(projectId, stageIndex) {
  const proj = MEGA_PROJECTS.find((p) => p.id === projectId);
  if (!proj) return null;
  const stage = proj.stages[stageIndex];
  if (!stage) return null;

  const rock = ROCK_TYPES.find((r) => r.id === stage.rockId) || ROCK_TYPES[0];
  const isLastStage = stageIndex === proj.stages.length - 1;
  const swing = randInt(-14, 22);
  const trueStrengthMpa = Math.max(12, Math.min(165, stage.reqMpa + swing));

  return {
    id: `mega_${proj.id}_st${stageIndex}_${Date.now()}`,
    company: proj.company,
    title: `${proj.icon} ${proj.title} · ${stage.name}`,
    siteType: proj.siteType,
    tier: proj.reqLab,
    isMegaProject: true,
    megaProjectId: proj.id,
    megaStageIndex: stageIndex,
    megaTotalStages: proj.stages.length,
    isLastMegaStage: isLastStage,
    isVip: true,
    isAudit: false,
    rock,
    reqMpa: stage.reqMpa,
    trueStrengthMpa,
    isActuallySafe: trueStrengthMpa >= stage.reqMpa,
    boxesCount: stage.boxes,
    tests: [...stage.tests],
    reward: isLastStage ? proj.stageReward + proj.finalBonus : proj.stageReward,
    repReward: isLastStage ? proj.finalRep : 12
  };
}

export function rollWeightedInclusion() {
  const totalWeight = RARE_INCLUSIONS.reduce((sum, item) => sum + item.weight, 0);
  let r = Math.random() * totalWeight;
  for (const item of RARE_INCLUSIONS) {
    r -= item.weight;
    if (r <= 0) return item;
  }
  return RARE_INCLUSIONS[0];
}

const COMPANIES = [
  'ООО «СтройФундамент»',
  'Трест «СеверГео»',
  'АО «МостИнжПроект»',
  'ГК «Горный Вектор»',
  'СМУ «УралНедра»',
  '«АрктикТрансСтрой»'
];

const SITES = [
  { tier: 1, siteType: 'cottage', title: 'Коттеджный посёлок «Сосны»', reqMpa: 25, boxes: 1, maxTests: 1 },
  { tier: 1, siteType: 'powerline', title: 'Опора ЛЭП №14', reqMpa: 32, boxes: 1, maxTests: 2 },
  { tier: 2, siteType: 'bridge', title: 'Мост через р. Каменка', reqMpa: 48, boxes: 1, maxTests: 2 },
  { tier: 2, siteType: 'highrise', title: 'ЖК «Высота» (24 этажа)', reqMpa: 55, boxes: 2, maxTests: 3 },
  { tier: 3, siteType: 'tunnel', title: 'Тоннель метро «Восточный»', reqMpa: 72, boxes: 2, maxTests: 3 },
  { tier: 3, siteType: 'bridge', title: 'Вантовый виадук «Северный»', reqMpa: 76, boxes: 2, maxTests: 3 },
  { tier: 4, siteType: 'quarry', title: 'Борт алмазного карьера', reqMpa: 85, boxes: 3, maxTests: 4 },
  { tier: 4, siteType: 'tunnel', title: 'Ж/д тоннель «Уральский хребет»', reqMpa: 88, boxes: 3, maxTests: 4 },
  { tier: 5, siteType: 'dam', title: 'Плотина Саянской ГЭС-2', reqMpa: 98, boxes: 3, maxTests: 4 }
];

const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export function generateAuditContract(labLevel = 1) {
  const unlocked = Storage.getUnlockedTests();
  const shuffled = [...unlocked].sort(() => Math.random() - 0.5);
  const selectedTests = shuffled.slice(0, Math.min(shuffled.length, 2));
  const rock = pick(ROCK_TYPES);
  const reqMpa = 35 + labLevel * 10;
  const swing = randInt(-14, 18);
  const trueStrengthMpa = Math.max(15, reqMpa + swing);

  return {
    id: `audit_${Date.now()}_${randInt(100, 999)}`,
    company: 'РосТехНадзор · Метрология',
    title: '🛡️ ПЛАНОВЫЙ АУДИТ АККРЕДИТАЦИИ',
    siteType: 'audit',
    tier: labLevel,
    isAudit: true,
    isVip: false,
    maxAllowedErrorPct: 9,
    rock,
    reqMpa,
    trueStrengthMpa,
    isActuallySafe: trueStrengthMpa >= reqMpa,
    boxesCount: 1,
    tests: selectedTests,
    reward: 160 + labLevel * 60,
    repReward: 6 + labLevel
  };
}

export function generateContract(labLevel = 1, completedCount = 0, forceVip = false, tenderMultiplier = 1) {
  const maxTier = Math.min(5, Math.max(1, labLevel + (completedCount >= 3 ? 1 : 0)));
  const pool = SITES.filter((s) => s.tier <= maxTier);
  const site = pick(pool);
  const rock = pick(ROCK_TYPES);
  const company = pick(COMPANIES);

  const unlocked = Storage.getUnlockedTests();
  const shuffled = [...unlocked].sort(() => Math.random() - 0.5);
  const testsCount = Math.min(shuffled.length, Math.max(1, site.maxTests));
  const selectedTests = shuffled.slice(0, testsCount);

  const swing = randInt(-18, 24);
  const trueStrengthMpa = Math.max(10, Math.min(160, site.reqMpa + swing));
  const isActuallySafe = trueStrengthMpa >= site.reqMpa;

  const isVip = forceVip || (completedCount >= 2 && Math.random() < 0.25);
  const auditBonusMult = Storage.getAuditBonus() > 0 ? 1.15 : 1;
  const vipMult = (isVip ? 1.75 : 1) * auditBonusMult * tenderMultiplier;

  const premiumCount = selectedTests.filter((t) =>
    ['shear_crack', 'water_sat', 'frost_test', 'ultrasonic', 'triaxial', 'shear_load'].includes(t)
  ).length;

  const triaxialBonus = selectedTests.includes('triaxial') ? 180 : 0;

  const baseReward = Math.round(
    (95 + site.tier * 65 + selectedTests.length * 35 + premiumCount * 45 + triaxialBonus) * vipMult
  );

  const prefix = tenderMultiplier > 1 ? '🔥 ГОСТЕНДЕР: ' : isVip ? '⚡ СРОЧНО: ' : '';

  return {
    id: `cnt_${Date.now()}_${randInt(100, 999)}`,
    company,
    title: `${prefix}${site.title}`,
    siteType: site.siteType,
    tier: site.tier,
    isVip,
    isTender: tenderMultiplier > 1,
    isAudit: false,
    rock,
    reqMpa: site.reqMpa,
    trueStrengthMpa,
    isActuallySafe,
    boxesCount: site.boxes,
    tests: selectedTests,
    reward: baseReward,
    repReward: Math.round((site.tier * 2 + selectedTests.length + premiumCount + (triaxialBonus > 0 ? 2 : 0)) * (isVip ? 1.5 : 1))
  };
}

export function generateContractBoard(labLevel = 1, completedCount = 0, count = 3) {
  const list = [];
  const spawnAudit = Storage.shouldTriggerAudit();

  for (let i = 0; i < count; i++) {
    if (i === 0 && spawnAudit) {
      list.push(generateAuditContract(labLevel));
    } else {
      list.push(generateContract(labLevel, completedCount, i === 1 && completedCount >= 2 && Math.random() < 0.32));
    }
  }
  return list;
}
