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
    desc: 'Открывает шкаф-витрину в цехе (со 2-го ур. лабы) и даёт +35 ₽/заказ',
    baseCost: 550,
    costMult: 1.9,
    maxLevel: 4,
    reqLab: 2
  },
  {
    key: 'assistant',
    name: 'Стажёр-лаборант',
    desc: 'Ходит по цеху и автоматически выкручивает 1 болт в ящике (до 3)',
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

export const DECOR_ITEMS = [
  {
    key: 'cooler',
    name: 'Кулер с артезианской водой',
    desc: 'Устанавливается в зоне отдыха цеха у правой стены',
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
    icon: '🤖'
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
  return Math.round(item.baseCost * Math.pow(item.costMult, Math.max(0, currentLevel - 1)));
}

export function getPerkCost(item, currentLevel) {
  return Math.round(item.baseCost * Math.pow(item.costMult, currentLevel));
}
