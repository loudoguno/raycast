#!/bin/bash
# Build script for status-menu-helper
# Compiles a universal binary (arm64 + x86_64) for macOS

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BUILD_DIR="$SCRIPT_DIR/build"
BINARY_NAME="status-menu-helper"
ASSETS_DIR="$SCRIPT_DIR/../assets"

# Check for swiftc
if ! command -v swiftc &> /dev/null; then
    echo "Error: swiftc not found. Install Xcode Command Line Tools:"
    echo "  xcode-select --install"
    exit 1
fi

echo "Building $BINARY_NAME..."

# Clean
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"

# Compile for arm64
echo "  Compiling for arm64..."
swiftc \
    -O \
    -target arm64-apple-macosx12.0 \
    -framework Cocoa \
    -o "$BUILD_DIR/${BINARY_NAME}-arm64" \
    "$SCRIPT_DIR/main.swift"

# Compile for x86_64
echo "  Compiling for x86_64..."
swiftc \
    -O \
    -target x86_64-apple-macosx12.0 \
    -framework Cocoa \
    -o "$BUILD_DIR/${BINARY_NAME}-x86_64" \
    "$SCRIPT_DIR/main.swift"

# Create universal binary
echo "  Creating universal binary..."
lipo -create \
    "$BUILD_DIR/${BINARY_NAME}-arm64" \
    "$BUILD_DIR/${BINARY_NAME}-x86_64" \
    -output "$BUILD_DIR/$BINARY_NAME"

# Clean up arch-specific binaries
rm "$BUILD_DIR/${BINARY_NAME}-arm64" "$BUILD_DIR/${BINARY_NAME}-x86_64"

# Make executable
chmod +x "$BUILD_DIR/$BINARY_NAME"

# Copy to assets directory for Raycast bundling
mkdir -p "$ASSETS_DIR"
cp "$BUILD_DIR/$BINARY_NAME" "$ASSETS_DIR/$BINARY_NAME"
chmod +x "$ASSETS_DIR/$BINARY_NAME"

# Strip extended attributes that can interfere with execution
xattr -cr "$ASSETS_DIR/$BINARY_NAME" 2>/dev/null || true

# Ad-hoc codesign the final assets copy
echo "  Codesigning..."
codesign --force --sign - "$ASSETS_DIR/$BINARY_NAME"

echo "✅ Build complete: $BUILD_DIR/$BINARY_NAME"
echo "✅ Copied to assets: $ASSETS_DIR/$BINARY_NAME"
echo ""
echo "Binary info:"
file "$BUILD_DIR/$BINARY_NAME"
codesign -dv "$BUILD_DIR/$BINARY_NAME" 2>&1 | head -3
