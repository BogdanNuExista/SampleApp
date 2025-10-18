import { ImageSourcePropType } from 'react-native';

export type InventoryCatalogItem = {
  id: string;
  name: string;
  type: 'loot' | 'sword';
  image: ImageSourcePropType;
};

const lootCatalog: InventoryCatalogItem[] = [
  {
    id: 'loot-01',
    name: 'Crystal Cache',
    type: 'loot',
    image: require('../../assets/loot/PNG/without_shadow/1.png'),
  },
  {
    id: 'loot-02',
    name: 'Starlit Rune',
    type: 'loot',
    image: require('../../assets/loot/PNG/without_shadow/3.png'),
  },
  {
    id: 'loot-03',
    name: 'Neon Elixir',
    type: 'loot',
    image: require('../../assets/loot/PNG/without_shadow/5.png'),
  },
  {
    id: 'loot-04',
    name: 'Clockwork Relic',
    type: 'loot',
    image: require('../../assets/loot/PNG/without_shadow/8.png'),
  },
  {
    id: 'loot-05',
    name: 'Aurora Gem',
    type: 'loot',
    image: require('../../assets/loot/PNG/without_shadow/12.png'),
  },
  {
    id: 'loot-06',
    name: 'Synthwave Idol',
    type: 'loot',
    image: require('../../assets/loot/PNG/without_shadow/15.png'),
  },
  {
    id: 'loot-07',
    name: 'Glitch Totem',
    type: 'loot',
    image: require('../../assets/loot/PNG/without_shadow/18.png'),
  },
  {
    id: 'loot-08',
    name: 'Prism Flask',
    type: 'loot',
    image: require('../../assets/loot/PNG/without_shadow/21.png'),
  },
  {
    id: 'loot-09',
    name: 'Arcade Relic',
    type: 'loot',
    image: require('../../assets/loot/PNG/without_shadow/24.png'),
  },
  {
    id: 'loot-10',
    name: 'Chrono Core',
    type: 'loot',
    image: require('../../assets/loot/PNG/without_shadow/27.png'),
  },
  {
    id: 'loot-11',
    name: 'Starbound Sigil',
    type: 'loot',
    image: require('../../assets/loot/PNG/without_shadow/32.png'),
  },
  {
    id: 'loot-12',
    name: 'Mythic Battery',
    type: 'loot',
    image: require('../../assets/loot/PNG/without_shadow/36.png'),
  },
  {
    id: 'loot-13',
    name: 'Temporal Gear',
    type: 'loot',
    image: require('../../assets/loot/PNG/without_shadow/40.png'),
  },
  {
    id: 'loot-14',
    name: 'Nova Compass',
    type: 'loot',
    image: require('../../assets/loot/PNG/without_shadow/44.png'),
  },
];

const swordCatalog: InventoryCatalogItem[] = [
  {
    id: 'sword-01',
    name: 'Bronze Halberd',
    type: 'sword',
    image: require('../../assets/swords/Icons/icon_32_2_01.png'),
  },
  {
    id: 'sword-02',
    name: 'Frostbite Saber',
    type: 'sword',
    image: require('../../assets/swords/Icons/icon_32_2_03.png'),
  },
  {
    id: 'sword-03',
    name: 'Aurora Blade',
    type: 'sword',
    image: require('../../assets/swords/Icons/icon_32_2_05.png'),
  },
  {
    id: 'sword-04',
    name: 'Glitch Dagger',
    type: 'sword',
    image: require('../../assets/swords/Icons/icon_32_2_07.png'),
  },
  {
    id: 'sword-05',
    name: 'Quantum Claymore',
    type: 'sword',
    image: require('../../assets/swords/Icons/icon_32_2_09.png'),
  },
  {
    id: 'sword-06',
    name: 'Solar Katana',
    type: 'sword',
    image: require('../../assets/swords/Icons/icon_32_2_11.png'),
  },
  {
    id: 'sword-07',
    name: 'Nebula Spear',
    type: 'sword',
    image: require('../../assets/swords/Icons/icon_32_2_13.png'),
  },
  {
    id: 'sword-08',
    name: 'Vortex Cleaver',
    type: 'sword',
    image: require('../../assets/swords/Icons/icon_32_2_15.png'),
  },
  {
    id: 'sword-09',
    name: 'Circuit Rapier',
    type: 'sword',
    image: require('../../assets/swords/Icons/icon_32_2_17.png'),
  },
  {
    id: 'sword-10',
    name: 'Ion Lance',
    type: 'sword',
    image: require('../../assets/swords/Icons/icon_32_2_19.png'),
  },
  {
    id: 'sword-11',
    name: 'Stellar Glaive',
    type: 'sword',
    image: require('../../assets/swords/Icons/icon_32_2_23.png'),
  },
  {
    id: 'sword-12',
    name: 'Pulse Greatsword',
    type: 'sword',
    image: require('../../assets/swords/Icons/icon_32_2_27.png'),
  },
  {
    id: 'sword-13',
    name: 'Nova Edge',
    type: 'sword',
    image: require('../../assets/swords/Icons/icon_32_2_30.png'),
  },
];

const combinedCatalog: InventoryCatalogItem[] = [...lootCatalog, ...swordCatalog];

export function pickRandomInventoryItem(): InventoryCatalogItem {
  const index = Math.floor(Math.random() * combinedCatalog.length);
  return combinedCatalog[index];
}

export function getInventoryItemById(id: string): InventoryCatalogItem | undefined {
  return combinedCatalog.find(item => item.id === id);
}

export function listInventoryCatalog(): InventoryCatalogItem[] {
  return combinedCatalog.slice();
}
