import assaultRifles from "../data/collections/weapons_assault_rifles.json";
import shotguns from "../data/collections/weapons_shotguns.json";
import minigun from "../data/collections/weapons_minigun.json";
import sniperRifles from "../data/collections/weapons_sniper_rifles.json";
import rocketLaunchers from "../data/collections/weapons_rocket_launchers.json";
import missileLaunchers from "../data/collections/weapons_missile_launchers.json";
import laserRifles from "../data/collections/weapons_laser_rifles.json";
import grenadeLaunchers from "../data/collections/weapons_grenade_launchers.json";
import swords from "../data/collections/weapons_swords.json";
import energyThrower from "../data/collections/weapons_energy_throwers.json";
import railgun from "../data/collections/weapons_railgun.json";
import laserCannon from "../data/collections/weapons_laser_cannon.json";
import specialAndHeavy from "../data/collections/weapons_special_and_heavy.json";
import orbital from "../data/collections/weapons_orbital.json";
import grenades from "../data/collections/items_granade.json";
import trapWeapons from "../data/collections/items_trap_weapons.json";
import vehicles from "../data/collections/items_vehicles.json";
import supportDevices from "../data/collections/items_support-devices.json";
import resurrectDevices from "../data/collections/items_resurrect_devices.json";
import fieldSupport from "../data/collections/items_field_support.json";
import recoveryDevices from "../data/collections/items_recovery_devices.json";
import acessory from "../data/collections/cosmetics_accessory.json";
import head from "../data/collections/cosmetics_head.json";
import lower from "../data/collections/cosmetics_lower.json";
import upper from "../data/collections/cosmetics_upper.json";

import type { CatalogEntry, Collection } from "./types";

export const COLLECTIONS: Collection[] = [
  assaultRifles,
  shotguns,
  sniperRifles,
  rocketLaunchers,
  missileLaunchers,
  laserRifles,
  grenadeLaunchers,
  swords,
  specialAndHeavy,
  orbital,
  minigun,
  energyThrower,
  railgun,
  laserCannon,
  grenades,
  trapWeapons,
  vehicles,
  supportDevices,
  resurrectDevices,
  fieldSupport,
  recoveryDevices,
  acessory,
  head,
  lower,
  upper
] as unknown as Collection[];

export const GAME_ID_ORDER: string[] = COLLECTIONS.flatMap((c) => c.items.map((it) => it.id));

const GAME_INDEX_BY_ID: Record<string, number> = {};
for (let i = 0; i < GAME_ID_ORDER.length; i++) {
  GAME_INDEX_BY_ID[GAME_ID_ORDER[i]] = i;
}

export const CATALOG: CatalogEntry[] = COLLECTIONS.flatMap((c) =>
  c.items.map((item) => ({
    ...item,
    collectionId: c.id,
    collectionLabel: c.label
  }))
).sort((a, b) => (GAME_INDEX_BY_ID[a.id] ?? 9_000_000_000) - (GAME_INDEX_BY_ID[b.id] ?? 9_000_000_000));

export const CATALOG_ID_ORDER: string[] = [...GAME_ID_ORDER];
