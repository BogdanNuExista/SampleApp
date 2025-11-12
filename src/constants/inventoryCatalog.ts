import { ImageSourcePropType } from 'react-native';

export type InventoryCatalogItem = {
  id: string;
  name: string;
  type: 'loot' | 'sword';
  image: ImageSourcePropType;
};

const lootCatalog: InventoryCatalogItem[] = [
  { id: 'loot-01', name: 'Crystal Cache', type: 'loot', image: require('../../assets/loot/PNG/without_shadow/1.png') },
  { id: 'loot-02', name: 'Mystic Pouch', type: 'loot', image: require('../../assets/loot/PNG/without_shadow/2.png') },
  { id: 'loot-03', name: 'Starlit Rune', type: 'loot', image: require('../../assets/loot/PNG/without_shadow/3.png') },
  { id: 'loot-04', name: 'Ancient Scroll', type: 'loot', image: require('../../assets/loot/PNG/without_shadow/4.png') },
  { id: 'loot-05', name: 'Neon Elixir', type: 'loot', image: require('../../assets/loot/PNG/without_shadow/5.png') },
  { id: 'loot-06', name: 'Dragon Scale', type: 'loot', image: require('../../assets/loot/PNG/without_shadow/6.png') },
  { id: 'loot-07', name: 'Phoenix Feather', type: 'loot', image: require('../../assets/loot/PNG/without_shadow/7.png') },
  { id: 'loot-08', name: 'Clockwork Relic', type: 'loot', image: require('../../assets/loot/PNG/without_shadow/8.png') },
  { id: 'loot-09', name: 'Soul Crystal', type: 'loot', image: require('../../assets/loot/PNG/without_shadow/9.png') },
  { id: 'loot-10', name: 'Enchanted Ring', type: 'loot', image: require('../../assets/loot/PNG/without_shadow/10.png') },
  { id: 'loot-11', name: 'Void Stone', type: 'loot', image: require('../../assets/loot/PNG/without_shadow/11.png') },
  { id: 'loot-12', name: 'Aurora Gem', type: 'loot', image: require('../../assets/loot/PNG/without_shadow/12.png') },
  { id: 'loot-13', name: 'Lunar Pendant', type: 'loot', image: require('../../assets/loot/PNG/without_shadow/13.png') },
  { id: 'loot-14', name: 'Thunder Orb', type: 'loot', image: require('../../assets/loot/PNG/without_shadow/14.png') },
  { id: 'loot-15', name: 'Synthwave Idol', type: 'loot', image: require('../../assets/loot/PNG/without_shadow/15.png') },
  { id: 'loot-16', name: 'Frost Shard', type: 'loot', image: require('../../assets/loot/PNG/without_shadow/16.png') },
  { id: 'loot-17', name: 'Shadow Essence', type: 'loot', image: require('../../assets/loot/PNG/without_shadow/17.png') },
  { id: 'loot-18', name: 'Glitch Totem', type: 'loot', image: require('../../assets/loot/PNG/without_shadow/18.png') },
  { id: 'loot-19', name: 'Cosmic Dust', type: 'loot', image: require('../../assets/loot/PNG/without_shadow/19.png') },
  { id: 'loot-20', name: 'Ember Core', type: 'loot', image: require('../../assets/loot/PNG/without_shadow/20.png') },
  { id: 'loot-21', name: 'Prism Flask', type: 'loot', image: require('../../assets/loot/PNG/without_shadow/21.png') },
  { id: 'loot-22', name: 'Stardust Vial', type: 'loot', image: require('../../assets/loot/PNG/without_shadow/22.png') },
  { id: 'loot-23', name: 'Plasma Cell', type: 'loot', image: require('../../assets/loot/PNG/without_shadow/23.png') },
  { id: 'loot-24', name: 'Arcade Relic', type: 'loot', image: require('../../assets/loot/PNG/without_shadow/24.png') },
  { id: 'loot-25', name: 'Neon Sigil', type: 'loot', image: require('../../assets/loot/PNG/without_shadow/25.png') },
  { id: 'loot-26', name: 'Cyber Fragment', type: 'loot', image: require('../../assets/loot/PNG/without_shadow/26.png') },
  { id: 'loot-27', name: 'Chrono Core', type: 'loot', image: require('../../assets/loot/PNG/without_shadow/27.png') },
  { id: 'loot-28', name: 'Void Essence', type: 'loot', image: require('../../assets/loot/PNG/without_shadow/28.png') },
  { id: 'loot-29', name: 'Astral Gem', type: 'loot', image: require('../../assets/loot/PNG/without_shadow/29.png') },
  { id: 'loot-30', name: 'Digital Shard', type: 'loot', image: require('../../assets/loot/PNG/without_shadow/30.png') },
  { id: 'loot-31', name: 'Quantum Cube', type: 'loot', image: require('../../assets/loot/PNG/without_shadow/31.png') },
  { id: 'loot-32', name: 'Starbound Sigil', type: 'loot', image: require('../../assets/loot/PNG/without_shadow/32.png') },
  { id: 'loot-33', name: 'Ether Bottle', type: 'loot', image: require('../../assets/loot/PNG/without_shadow/33.png') },
  { id: 'loot-34', name: 'Rune Tablet', type: 'loot', image: require('../../assets/loot/PNG/without_shadow/34.png') },
  { id: 'loot-35', name: 'Spirit Stone', type: 'loot', image: require('../../assets/loot/PNG/without_shadow/35.png') },
  { id: 'loot-36', name: 'Mythic Battery', type: 'loot', image: require('../../assets/loot/PNG/without_shadow/36.png') },
  { id: 'loot-37', name: 'Eclipse Pearl', type: 'loot', image: require('../../assets/loot/PNG/without_shadow/37.png') },
  { id: 'loot-38', name: 'Titan Relic', type: 'loot', image: require('../../assets/loot/PNG/without_shadow/38.png') },
  { id: 'loot-39', name: 'Nebula Fragment', type: 'loot', image: require('../../assets/loot/PNG/without_shadow/39.png') },
  { id: 'loot-40', name: 'Temporal Gear', type: 'loot', image: require('../../assets/loot/PNG/without_shadow/40.png') },
  { id: 'loot-41', name: 'Chaos Orb', type: 'loot', image: require('../../assets/loot/PNG/without_shadow/41.png') },
  { id: 'loot-42', name: 'Infinity Crystal', type: 'loot', image: require('../../assets/loot/PNG/without_shadow/42.png') },
  { id: 'loot-43', name: 'Arcane Codex', type: 'loot', image: require('../../assets/loot/PNG/without_shadow/43.png') },
  { id: 'loot-44', name: 'Nova Compass', type: 'loot', image: require('../../assets/loot/PNG/without_shadow/44.png') },
  { id: 'loot-45', name: 'Flux Capacitor', type: 'loot', image: require('../../assets/loot/PNG/without_shadow/45.png') },
  { id: 'loot-46', name: 'Gravity Well', type: 'loot', image: require('../../assets/loot/PNG/without_shadow/46.png') },
  { id: 'loot-47', name: 'Photon Sphere', type: 'loot', image: require('../../assets/loot/PNG/without_shadow/47.png') },
  { id: 'loot-48', name: 'Celestial Key', type: 'loot', image: require('../../assets/loot/PNG/without_shadow/48.png') },
];

const swordCatalog: InventoryCatalogItem[] = [
  { id: 'sword-01', name: 'Bronze Halberd', type: 'sword', image: require('../../assets/swords/Icons/icon_32_2_01.png') },
  { id: 'sword-02', name: 'Iron Cleaver', type: 'sword', image: require('../../assets/swords/Icons/icon_32_2_02.png') },
  { id: 'sword-03', name: 'Frostbite Saber', type: 'sword', image: require('../../assets/swords/Icons/icon_32_2_03.png') },
  { id: 'sword-04', name: 'Shadow Dagger', type: 'sword', image: require('../../assets/swords/Icons/icon_32_2_04.png') },
  { id: 'sword-05', name: 'Aurora Blade', type: 'sword', image: require('../../assets/swords/Icons/icon_32_2_05.png') },
  { id: 'sword-06', name: 'Thunder Lance', type: 'sword', image: require('../../assets/swords/Icons/icon_32_2_06.png') },
  { id: 'sword-07', name: 'Glitch Dagger', type: 'sword', image: require('../../assets/swords/Icons/icon_32_2_07.png') },
  { id: 'sword-08', name: 'Crimson Edge', type: 'sword', image: require('../../assets/swords/Icons/icon_32_2_08.png') },
  { id: 'sword-09', name: 'Quantum Claymore', type: 'sword', image: require('../../assets/swords/Icons/icon_32_2_09.png') },
  { id: 'sword-10', name: 'Void Scythe', type: 'sword', image: require('../../assets/swords/Icons/icon_32_2_10.png') },
  { id: 'sword-11', name: 'Solar Katana', type: 'sword', image: require('../../assets/swords/Icons/icon_32_2_11.png') },
  { id: 'sword-12', name: 'Lunar Sickle', type: 'sword', image: require('../../assets/swords/Icons/icon_32_2_12.png') },
  { id: 'sword-13', name: 'Nebula Spear', type: 'sword', image: require('../../assets/swords/Icons/icon_32_2_13.png') },
  { id: 'sword-14', name: 'Plasma Axe', type: 'sword', image: require('../../assets/swords/Icons/icon_32_2_14.png') },
  { id: 'sword-15', name: 'Vortex Cleaver', type: 'sword', image: require('../../assets/swords/Icons/icon_32_2_15.png') },
  { id: 'sword-16', name: 'Storm Blade', type: 'sword', image: require('../../assets/swords/Icons/icon_32_2_16.png') },
  { id: 'sword-17', name: 'Circuit Rapier', type: 'sword', image: require('../../assets/swords/Icons/icon_32_2_17.png') },
  { id: 'sword-18', name: 'Inferno Sword', type: 'sword', image: require('../../assets/swords/Icons/icon_32_2_18.png') },
  { id: 'sword-19', name: 'Ion Lance', type: 'sword', image: require('../../assets/swords/Icons/icon_32_2_19.png') },
  { id: 'sword-20', name: 'Dragon Fang', type: 'sword', image: require('../../assets/swords/Icons/icon_32_2_20.png') },
  { id: 'sword-21', name: 'Cyber Halberd', type: 'sword', image: require('../../assets/swords/Icons/icon_32_2_21.png') },
  { id: 'sword-22', name: 'Frost Reaper', type: 'sword', image: require('../../assets/swords/Icons/icon_32_2_22.png') },
  { id: 'sword-23', name: 'Stellar Glaive', type: 'sword', image: require('../../assets/swords/Icons/icon_32_2_23.png') },
  { id: 'sword-24', name: 'Demon Cleaver', type: 'sword', image: require('../../assets/swords/Icons/icon_32_2_24.png') },
  { id: 'sword-25', name: 'Photon Blade', type: 'sword', image: require('../../assets/swords/Icons/icon_32_2_25.png') },
  { id: 'sword-26', name: 'Titan Hammer', type: 'sword', image: require('../../assets/swords/Icons/icon_32_2_26.png') },
  { id: 'sword-27', name: 'Pulse Greatsword', type: 'sword', image: require('../../assets/swords/Icons/icon_32_2_27.png') },
  { id: 'sword-28', name: 'Shadow Reaver', type: 'sword', image: require('../../assets/swords/Icons/icon_32_2_28.png') },
  { id: 'sword-29', name: 'Cosmic Blade', type: 'sword', image: require('../../assets/swords/Icons/icon_32_2_29.png') },
  { id: 'sword-30', name: 'Nova Edge', type: 'sword', image: require('../../assets/swords/Icons/icon_32_2_30.png') },
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
