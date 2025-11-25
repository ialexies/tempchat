/**
 * Notification utilities for browser notifications and in-app indicators
 */

/**
 * Request notification permission from the user
 * @returns Promise resolving to 'granted', 'denied', or 'default'
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    return 'denied';
  }

  // Permission is 'default', request it
  const permission = await Notification.requestPermission();
  return permission;
}

/**
 * Check if notifications are supported and permitted
 * @returns true if notifications can be shown
 */
export function canShowNotifications(): boolean {
  return (
    'Notification' in window &&
    Notification.permission === 'granted'
  );
}

/**
 * Show a browser notification for a new message
 * @param username - The username who sent the message
 * @param message - The message content (will be truncated if too long)
 * @param onClick - Optional callback when notification is clicked
 */
export function showNotification(
  username: string,
  message: string,
  onClick?: () => void
): void {
  if (!canShowNotifications()) {
    return;
  }

  // Truncate message if too long
  const maxLength = 100;
  const truncatedMessage = message.length > maxLength
    ? `${message.substring(0, maxLength)}...`
    : message;

  const notification = new Notification(`New message from ${username}`, {
    body: truncatedMessage,
    icon: '/favicon.ico', // You can customize this
    tag: 'tempchat-message', // Group notifications
    requireInteraction: false,
  });

  // Focus window when notification is clicked
  notification.onclick = () => {
    window.focus();
    if (onClick) {
      onClick();
    }
    notification.close();
  };

  // Auto-close after 5 seconds
  setTimeout(() => {
    notification.close();
  }, 5000);
}

/**
 * Update the document title with unread count badge
 * @param unreadCount - Number of unread messages
 * @param baseTitle - Base title (default: "TempChat")
 */
export function updateDocumentTitle(
  unreadCount: number,
  baseTitle: string = 'TempChat'
): void {
  if (unreadCount > 0) {
    document.title = `(${unreadCount}) ${baseTitle}`;
  } else {
    document.title = baseTitle;
  }
}

/**
 * Check if the current tab is visible/focused
 * @returns true if tab is visible
 */
export function isTabVisible(): boolean {
  return document.visibilityState === 'visible';
}

