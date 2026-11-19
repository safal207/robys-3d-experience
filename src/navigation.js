export const VIEWS = Object.freeze({
  exterior: { position: [12.4, 8.2, 27.5], target: [0, 2.7, 6.0], floor: 0, label: 'Фасад и терраса' },
  hall: { position: [-4.3, 2.5, 6.5], target: [1.8, 2.5, -3.8], floor: 0, label: 'Главный зал' },
  mezzanine: { position: [-3.2, 2.85, -7.2], target: [4.4, 4.2, -7.0], floor: 0, label: 'Антресоль' },
  upstairs: { position: [-4.7, 5.8, -11.3], target: [0.5, 5.4, -5.5], floor: 1, label: 'Второй этаж' }
});

export function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
export function horizontalDistance(a, b) { return Math.hypot(a.x - b.x, a.z - b.z); }
export function collisionAt(x, z, colliders, radius = 0.32, floor = 0) {
  return colliders.some(c => c.floor === floor && x >= c.x - c.w / 2 - radius && x <= c.x + c.w / 2 + radius && z >= c.z - c.d / 2 - radius && z <= c.z + c.d / 2 + radius);
}
export function constrainedMove(from, dx, dz, colliders, floor = 0) {
  const bounds = floor === 0 ? { xmin: -6.35, xmax: 6.35, zmin: -13.3, zmax: 19.5 } : { xmin: -6.25, xmax: 6.25, zmin: -13.25, zmax: -3.3 };
  const x = clamp(from.x + dx, bounds.xmin, bounds.xmax);
  const z = clamp(from.z + dz, bounds.zmin, bounds.zmax);
  const next = { x: from.x, z: from.z };
  if (!collisionAt(x, from.z, colliders, 0.3, floor)) next.x = x;
  if (!collisionAt(next.x, z, colliders, 0.3, floor)) next.z = z;
  return next;
}