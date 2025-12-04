// Utility to manage guest doubt IDs in localStorage

const GUEST_DOUBTS_KEY = 'guestDoubtIds';

export function addGuestDoubt(doubtId: string): void {
  const existingIds = getGuestDoubtIds();
  if (!existingIds.includes(doubtId)) {
    existingIds.push(doubtId);
    localStorage.setItem(GUEST_DOUBTS_KEY, JSON.stringify(existingIds));
  }
}

export function getGuestDoubtIds(): string[] {
  try {
    const stored = localStorage.getItem(GUEST_DOUBTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function clearGuestDoubts(): void {
  localStorage.removeItem(GUEST_DOUBTS_KEY);
}

export function hasGuestDoubts(): boolean {
  return getGuestDoubtIds().length > 0;
}
