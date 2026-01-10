#!/bin/bash

# Cross-platform installer for Strelitzia
# Run on macOS or Linux

echo ""
echo "=================================================="
echo "  Strelitzia - Cross-Platform Setup"
echo "=================================================="
echo ""

# Check Node.js installation
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed"
    echo ""
    echo "Please install Node.js 18.17.0 or higher from:"
    echo "  https://nodejs.org/"
    echo ""
    echo "Or use a package manager:"
    echo "  macOS:  brew install node@18"
    echo "  Linux:  sudo apt-get install nodejs npm"
    echo ""
    exit 1
fi

# Check npm installation
if ! command -v npm &> /dev/null; then
    echo "[ERROR] npm is not installed"
    exit 1
fi

# Display versions
echo "[INFO] Checking prerequisites..."
node --version
npm --version
echo ""

# Run setup script
echo "[INFO] Running setup..."
npm run setup

if [ $? -ne 0 ]; then
    echo ""
    echo "[ERROR] Setup failed!"
    echo ""
    exit 1
fi

echo ""
echo "=================================================="
echo "  Setup completed successfully!"
echo "=================================================="
echo ""
echo "Next steps:"
echo "  1. Edit api/.env with your configuration"
echo "  2. Edit web/.env.local with your API URL"
echo "  3. Run: npm run dev"
echo ""
echo "Visit http://localhost:3000 in your browser"
echo ""
