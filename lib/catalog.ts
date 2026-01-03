import assaultRifles from "../data/collections/weapons_assault_rifles.json";
import shotguns from "../data/collections/weapons_shotguns.json";
import minigun from "../data/collections/weapons_minigun.json";
import sniperRifles from "../data/collections/weapons_sniper_rifles.json";
import rocketLaunchers from "../data/collections/weapons_rocket_launchers.json";
import missileLaunchers from "../data/collections/weapons_missile_launchers.json";
import laserRifles from "../data/collections/weapons_laser_rifles.json";
import grenadeLaunchers from "../data/collections/weapons_grenade_launchers.json";
import swords from "../data/collections/weapons_swords.json";
import laserCannon from "../data/collections/weapons_laser_cannon.json";
import specialAndHeavy from "../data/collections/weapons_special_and_heavy.json";
import orbital from "../data/collections/weapons_orbital.json";
import revivalAndVehicles from "../data/collections/items_revival_and_vehicles.json";
import supportHealCosmetics from "../data/collections/items_support_heal_cosmetics.json";

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
  laserCannon,
  revivalAndVehicles,
  supportHealCosmetics
] as unknown as Collection[];

export const CATALOG: CatalogEntry[] = COLLECTIONS.flatMap((c) =>
  c.items.map((item) => ({
    ...item,
    collectionId: c.id,
    collectionLabel: c.label
  }))
).sort((a, b) => a.id.localeCompare(b.id));

export const CATALOG_ID_ORDER: string[] = CATALOG.map((i) => i.id);
