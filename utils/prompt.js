/**
 * Calculates the expiry date for a prompt.
 * Public prompts expire in 24 hours unless marked as permanent.
 */
export const calculateExpiry = (isPrivate, isPermanent) => {
  if (isPrivate || isPermanent) return null;
  return new Date(Date.now() + 24 * 60 * 60 * 1000);
};

/**
 * Returns a human-readable string representing the time remaining until expiry.
 */
export const getTimeUntilExpiry = (post, now = new Date()) => {
  if (post.isPrivate || !post.expiresAt) return null;
  
  const expiry = new Date(post.expiresAt);
  
  if (expiry < now) return "Expired";
  
  const diffInMs = expiry - now;
  const hoursLeft = Math.floor(diffInMs / (1000 * 60 * 60));
  const minutesLeft = Math.floor((diffInMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hoursLeft === 0) {
    return `Expires in ${minutesLeft}m`;
  }
  if (hoursLeft < 1) return "Expires soon";
  if (hoursLeft < 24) return `Expires in ${hoursLeft}h`;
  
  return null;
};
