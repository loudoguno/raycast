#!/bin/bash

# Build script for BalloonsApp
# This creates a simple macOS app bundle

set -e

echo "Building BalloonsApp..."

# Create app bundle structure
APP_NAME="BalloonsApp"
BUILD_DIR="build"
APP_BUNDLE="$BUILD_DIR/$APP_NAME.app"
CONTENTS_DIR="$APP_BUNDLE/Contents"
MACOS_DIR="$CONTENTS_DIR/MacOS"
RESOURCES_DIR="$CONTENTS_DIR/Resources"

# Clean and create directories
rm -rf "$BUILD_DIR"
mkdir -p "$MACOS_DIR"
mkdir -p "$RESOURCES_DIR"

# Compile Swift files
echo "Compiling Swift sources..."
swiftc \
    -o "$MACOS_DIR/$APP_NAME" \
    -framework SwiftUI \
    -framework AppKit \
    BalloonsApp.swift \
    BalloonsView.swift \
    FireworksView.swift \
    SnowView.swift \
    CupcakeView.swift \
    CampfireView.swift \
    FeatherView.swift \
    BeerView.swift \
    LeavesView.swift \
    RainbowView.swift \
    PixelsView.swift \
    GalaxyView.swift

# Copy Info.plist
cp Info.plist "$CONTENTS_DIR/Info.plist"

# Update Info.plist with correct bundle identifier
/usr/libexec/PlistBuddy -c "Set :CFBundleIdentifier com.loudog.balloonsapp" "$CONTENTS_DIR/Info.plist"
/usr/libexec/PlistBuddy -c "Set :CFBundleExecutable $APP_NAME" "$CONTENTS_DIR/Info.plist"

echo "✅ Build complete: $APP_BUNDLE"
echo ""
echo "To install the app:"
echo "  cp -r $APP_BUNDLE /Applications/"
echo ""
echo "To test the app:"
echo "  open $APP_BUNDLE"
