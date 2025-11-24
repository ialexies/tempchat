#!/bin/sh

# Fix permissions for data directory
# This is needed when using volume mounts where host directory has different ownership
if [ -d "/app/data" ]; then
  echo "Fixing permissions for /app/data directory..."
  chown -R nextjs:nodejs /app/data 2>/dev/null || {
    echo "Warning: Could not change ownership of /app/data (may need to run container as root or fix host permissions)"
  }
  chmod -R 755 /app/data 2>/dev/null || true
fi

# Ensure data directory and subdirectories exist
mkdir -p /app/data/uploads || {
  echo "Warning: Could not create /app/data/uploads directory"
}
chown -R nextjs:nodejs /app/data 2>/dev/null || true
chmod -R 755 /app/data 2>/dev/null || true

# Switch to nextjs user and run the application
# Use exec to replace shell process with the application
exec su-exec nextjs "$@"

