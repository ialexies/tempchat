#!/bin/bash

echo "=== Testing Docker Build Locally ==="
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "ERROR: Docker is not running. Please start Docker first."
    exit 1
fi

echo "1. Building Docker image..."
echo "   This may take a few minutes..."
echo ""

# Build with full output
docker build --no-cache --progress=plain -t tempchat-test . 2>&1 | tee build-output.log

BUILD_EXIT=${PIPESTATUS[0]}

echo ""
echo "=== Build Finished ==="

if [ $BUILD_EXIT -eq 0 ]; then
    echo "✓ Build successful!"
    echo ""
    echo "To test the container, run:"
    echo "  docker run -p 3000:3000 tempchat-test"
else
    echo "✗ Build failed with exit code: $BUILD_EXIT"
    echo ""
    echo "=== Last 100 lines of build output ==="
    tail -100 build-output.log
    echo ""
    echo "=== Full build log saved to: build-output.log ==="
    echo "View the full log with: cat build-output.log"
fi

exit $BUILD_EXIT










