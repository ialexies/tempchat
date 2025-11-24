/**
 * Generates a color for a user avatar based on their username
 * @param username - The username to generate a color for
 * @returns A hex color string
 */
export function getAvatarColor(username: string): string {
  const colors = [
    '#6366f1', // indigo
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#f59e0b', // amber
    '#10b981', // emerald
    '#3b82f6', // blue
    '#f97316', // orange
    '#14b8a6', // teal
    '#a855f7', // purple
    '#ef4444', // red
  ];

  // Generate a consistent index from the username
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}

/**
 * Gets the initials from a username
 * @param username - The username to get initials from
 * @returns A string with 1-2 uppercase letters
 */
export function getInitials(username: string): string {
  if (!username) return '?';
  
  const parts = username.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return username.substring(0, 2).toUpperCase();
}

/**
 * Generates an avatar URL or returns initials
 * @param username - The username
 * @param size - The size of the avatar (default: 40)
 * @returns An object with color and initials
 */
export function getAvatarData(username: string, size: number = 40) {
  return {
    color: getAvatarColor(username),
    initials: getInitials(username),
    size,
  };
}
