#!/bin/bash

echo "🧹 Cleaning up..."

rm -rf node_modules
rm -rf frontend/node_modules
rm -rf backend/node_modules
rm -rf frontend/dist

echo "✅ Done"