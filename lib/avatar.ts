/**
 * Generates a color for a user avatar based on their username
 * @param username - The username to generate a color for
 * @returns A hex color string
 */
export function getAvatarColor(username: string): string {
  // Balanced color palette - muted but vibrant enough to feel alive
  // Colors chosen for good contrast with white text and pleasant visual distinction
  const colors = [
    '#6366f1', // Indigo (primary brand color)
    '#8b5cf6', // Soft purple
    '#06b6d4', // Muted cyan
    '#10b981', // Muted green
    '#f59e0b', // Muted amber
    '#ef4444', // Muted red
    '#64748b', // Slate gray
    '#78716c', // Stone gray
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







