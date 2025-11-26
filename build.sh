#!/bin/sh
set -e

echo "=== Build Script Started ==="
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"
echo ""

echo "=== Running TypeScript Check ==="
npx tsc --noEmit || {
    echo "TypeScript check failed!"
    exit 1
}

echo ""
echo "=== Running Next.js Build ==="
npm run build || {
    echo ""
    echo "=== BUILD FAILED ==="
    exit 1
}

echo ""
echo "=== Build Successful ==="









