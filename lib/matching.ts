import type { CommunityNeed, Volunteer } from './types';

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function scoreVolunteer(volunteer: Volunteer, need: CommunityNeed): number {
  const distKm = haversineKm(volunteer.lat, volunteer.lng, need.lat, need.lng);
  const proximity = Math.max(0, 1 - distKm / 10);
  const skill = volunteer.skills.includes(need.need_type) ? 1 : 0;
  const availability = volunteer.available ? 1 : 0;
  return 0.5 * proximity + 0.3 * skill + 0.2 * availability;
}

export function getTopMatches(need: CommunityNeed, volunteers: Volunteer[], n = 3): Volunteer[] {
  return volunteers
    .filter(v => v.available)
    .map(v => ({ volunteer: v, score: scoreVolunteer(v, need) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
    .map(({ volunteer }) => volunteer);
}
