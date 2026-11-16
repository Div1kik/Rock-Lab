export const TOOL_UPGRADES = [
  {
    key: 'drill',
    name: 'Аккумуляторный шуруповёрт',
    desc: 'Ускоряет выкручивание болтов из керновых ящиков',
    baseCost: 120,
    costMult: 1.65,
    maxLevel: 6
  },
  {
    key: 'press',
    name: 'Сервоклапан гидропресса',
    desc: 'Замедляет стрелку и расширяет зелёную зону на стендах',
    baseCost: 160,
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

export const LAB_UPGRADES = [
  { level: 1, name: 'Гаражная геолаборатория', cost: 0, reqRep: 0 },
  { level: 2, name: 'Участковый пост контроля', cost: 350, reqRep: 18 },
  { level: 3, name: 'Инженерный центр грунтов', cost: 850, reqRep: 35 },
  { level: 4, name: 'Институт механики скал', cost: 1800, reqRep: 60 },
  { level: 5, name: 'Геотех-комплекс «Атлант»', cost: 3500, reqRep: 95 }
];

export function getToolCost(tool, currentLevel) {
  return Math.round(tool.baseCost * Math.pow(tool.costMult, currentLevel - 1));
}
