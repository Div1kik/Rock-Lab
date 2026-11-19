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
    desc: 'Ускоряет шлифовку торцов и повышает плоскопараллельность',
    baseCost: 145,
    costMult: 1.65,
    maxLevel: 5
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
    key: 'caliper_auto',
    name: 'Авто-привод штангена (1-Клик)',
    desc: 'Добавляет переключатель замера H и D в один клик (можно вернуть ручной)',
    baseCost: 2400,
    costMult: 1,
    maxLevel: 1,
    isSingleModule: true
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
    name: 'Кофемашина на стойку',
    desc: 'Появляется в лаборатории! Даёт +15 ₽ бодрых чаевых за заказ',
    baseCost: 220,
    costMult: 1.8,
    maxLevel: 3
  },
  {
    key: 'showcase',
    name: 'Витрина редких минералов',
    desc: 'Открывает шкаф-витрину в цехе (со 2-го ур. лабы) и даёт +35 ₽/заказ',
    baseCost: 550,
    costMult: 1.9,
    maxLevel: 4,
    reqLab: 2
  },
  {
    key: 'assistant',
    name: 'Штат лаборантов (Стажёры)',
    desc: 'Скручивают болты, ходят по цеху (до 3 чел.); на Ур.6 сами проводят тесты!',
    baseCost: 850,
    costMult: 2.05,
    maxLevel: 6
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

export const RND_UPGRADES = [
  {
    key: 'rnd_ai',
    name: '🤖 НИОКР: ИИ-прогноз разрушения',
    desc: 'Нейросеть страхует замеры: снижает погрешность протокола на -3% и расширяет пик пресса',
    cost: 28000,
    reqLab: 3
  },
  {
    key: 'branch_norilsk',
    name: '🏔️ Филиал: Арктический пост (Норильск)',
    desc: 'Отображается на карте филиалов: приносит +800 ₽ пассивно за каждый контракт',
    cost: 35000,
    reqLab: 3
  },
  {
    key: 'rnd_license',
    name: '📜 Лицензия: Особо опасные объекты',
    desc: 'Госдопуск к АЭС, шахтам и мостам: множитель ×1.35 к гонорару за все заказы!',
    cost: 48000,
    reqLab: 4
  },
  {
    key: 'rnd_tomography',
    name: '🔬 НИОКР: Лазерная томография керна',
    desc: 'Повышает шанс найти редкий минерал в ящике с 9% до 25%!',
    cost: 75000,
    reqLab: 4
  },
  {
    key: 'branch_ural',
    name: '⛰️ Филиал: Уральский горный центр',
    desc: 'Второй филиал на карте сети: приносит +1 800 ₽ пассивно за каждый контракт',
    cost: 85000,
    reqLab: 4
  },
  {
    key: 'rnd_double_staff',
    name: '👥 Академия кадров: Двойной авто-тест',
    desc: 'При штате Ур.6 лаборанты сами проводят до 2 вспомогательных стендов в заказе!',
    cost: 110000,
    reqLab: 5
  },
  {
    key: 'branch_shelf',
    name: '🌊 Филиал: Сахалинский шельф-пост',
    desc: 'Морской филиал на карте сети: приносит +3 500 ₽ пассивно за каждый контракт',
    cost: 150000,
    reqLab: 5
  },
  {
    key: 'rnd_iso_center',
    name: '🏛️ Статус: Эталонный центр ISO/IEC 17025',
    desc: 'Высшая аккредитация страны: +1 500 ₽ гранта и +15 ★ за каждый контракт!',
    cost: 190000,
    reqLab: 5
  },
  {
    key: 'rnd_gold_press',
    name: '👑 Престиж: Золотой пресс «Титан-Аурум»',
    desc: 'Роскошный золотой гидропресс с платиновой короной в цехе и на стенде сжатия!',
    cost: 260000,
    reqLab: 5
  }
];

export const DECOR_ITEMS = [
  {
    key: 'cooler',
    name: 'Кулер с артезианской водой',
    desc: 'Устанавливается в зоне отдыха (при нажатии пускает пузырьки!)',
    cost: 1800,
    icon: '🚰'
  },
  {
    key: 'plants',
    name: 'Оранжерея: монстера и кадки',
    desc: 'Живые растения в напольных кадках оживляют интерьер цеха',
    cost: 2400,
    icon: '🪴'
  },
  {
    key: 'lounge_sofa',
    name: 'Мебель: Диванчик и столик отчётов',
    desc: 'Уютная зона отдыха инженеров в центральной части зала',
    cost: 3200,
    icon: '🛋️'
  },
  {
    key: 'archive_desk',
    name: 'Мебель: Архивная тумба ГОСТов',
    desc: 'Тумба с каталогами и чертежами в центре лаборатории',
    cost: 3800,
    icon: '🗄️'
  },
  {
    key: 'geomap',
    name: 'Светящаяся карта месторождений',
    desc: 'Панорамная карта разломов и карьеров с маячками на стене',
    cost: 4200,
    icon: '🗺️'
  },
  {
    key: 'neon',
    name: 'Неоновая подсветка потолка',
    desc: 'Яркий бирюзово-янтарный контур освещения по периметру цеха',
    cost: 4800,
    icon: '💡'
  },
  {
    key: 'theme_loft',
    name: 'Интерьер лабы: Индустриальный Лофт',
    desc: 'Тёплая кирпичная кладка, чёрный металл и янтарные прожекторы',
    cost: 7500,
    icon: '🧱',
    isLabTheme: true,
    themeId: 'loft'
  },
  {
    key: 'theme_arctic',
    name: 'Интерьер лабы: Арктическая Станция',
    desc: 'Ледяные сине-белые панели, морозный свет и полярный стиль',
    cost: 11000,
    icon: '❄️',
    isLabTheme: true,
    themeId: 'arctic'
  },
  {
    key: 'theme_cyber',
    name: 'Интерьер лабы: Кибер-НИИ 2099',
    desc: 'Тёмно-изумрудные стены, неоновая сетка и голографический свет',
    cost: 15000,
    icon: '🧬',
    isLabTheme: true,
    themeId: 'cyber'
  },
  {
    key: 'theme_gold',
    name: 'Интерьер лабы: Золотой Штаб Атлант',
    desc: 'Элитный обсидианово-золотой дизайн главного научного центра',
    cost: 22000,
    icon: '🏛️',
    isLabTheme: true,
    themeId: 'gold'
  },
  {
    key: 'skin_miner',
    name: 'Форма: Горный мастер (Оранж)',
    desc: 'Светоотражающий комбинезон и белая каска для команды',
    cost: 6000,
    icon: '🦺',
    isSkin: true,
    skinId: 'miner'
  },
  {
    key: 'skin_arctic',
    name: 'Форма: Арктическая экспедиция',
    desc: 'Тёмно-синий полярный костюм с меховым воротником и визором',
    cost: 9500,
    icon: '🧥',
    isSkin: true,
    skinId: 'arctic'
  },
  {
    key: 'skin_gold',
    name: 'Форма: Главный академик (Люкс)',
    desc: 'Элитный золотистый костюм руководителя геотех-комплекса',
    cost: 16000,
    icon: '👑',
    isSkin: true,
    skinId: 'gold'
  },
  {
    key: 'skin_robots',
    name: 'Скин команды: Киборги-дроиды',
    desc: 'Вся команда в кибер-броне: отвечают на цифровом языке Бип-Боп!',
    cost: 28000,
    icon: '🤖',
    isSkin: true,
    skinId: 'robots'
  },
  {
    key: 'skin_minions',
    name: 'Скин команды: Жёлтые Миньоны',
    desc: 'Весёлые помощники в джинсовых комбезах и очках: болтают на миньонском!',
    cost: 36000,
    icon: '🍌',
    isSkin: true,
    skinId: 'minions'
  },
  {
    key: 'skin_mario',
    name: 'Скин команды: Мини-человечки (8-Бит)',
    desc: 'Красные кепки и синие комбезы: при тапе прыгают как Марио с монеткой!',
    cost: 44000,
    icon: '🍄',
    isSkin: true,
    skinId: 'mario'
  },
  {
    key: 'skin_astronaut',
    name: 'Скин команды: Космо-геологи «Аполлон»',
    desc: 'Белые скафандры со шлемом и невесомым прыжком в цехе',
    cost: 55000,
    icon: '👨‍🚀',
    isSkin: true,
    skinId: 'astronaut'
  },
  {
    key: 'skin_ninja',
    name: 'Скин команды: Кибер-Ниндзя ГОСТа',
    desc: 'Тёмные ниндзя с алой повязкой: при тапе делают дымовой рывок!',
    cost: 0,
    reqAds: 4,
    icon: '🥷',
    isSkin: true,
    skinId: 'ninja'
  },
  {
    key: 'robo_arm',
    name: 'Робот: Стенд с робо-рукой (Старк-М1)',
    desc: 'Статичный манипулятор в центре зала: сканирует керны лазером',
    cost: 18500,
    icon: '🦾'
  },
  {
    key: 'robo_rover',
    name: 'Робот: Колёсный робот-доставщик',
    desc: 'Курсирует по цеху с проблесковым маячком и перевозит пробы',
    cost: 24000,
    icon: '🛸'
  },
  {
    key: 'robo_dog',
    name: 'Робот: Гео-робособака «Spot-Geo»',
    desc: 'Четвероногий дрон бегает по лаборатории и прыгает при тапе',
    cost: 32000,
    icon: '🐕'
  },
  {
    key: 'robo_humanoid',
    name: 'Робот: Гуманоид-андроид «Атлант-X»',
    desc: 'Автономный робот-инженер патрулирует центр лаборатории',
    cost: 45000,
    icon: '🦿'
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
    desc: 'Сложный обжим под давлением (требует минимум 1 стажёра в штате)',
    cost: 3200,
    reqLab: 3,
    reqStaff: 1
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
  if (item.isSingleModule) return item.baseCost;
  return Math.round(item.baseCost * Math.pow(item.costMult, Math.max(0, currentLevel - 1)));
}

export function getPerkCost(item, currentLevel) {
  return Math.round(item.baseCost * Math.pow(item.costMult, currentLevel));
}
