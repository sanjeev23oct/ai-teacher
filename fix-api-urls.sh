#!/bin/bash

# Script to replace all hardcoded localhost:3001 URLs with getApiUrl() calls

echo "Fixing API URLs in client code..."

# Find all TypeScript/TSX files and replace localhost:3001 URLs
find client/src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  -e "s|'http://localhost:3001/api/|getApiUrl('/api/|g" \
  -e "s|\"http://localhost:3001/api/|getApiUrl(\"/api/|g" \
  -e "s|\`http://localhost:3001/api/|getApiUrl(\`/api/|g" \
  -e "s|'http://localhost:3001\${|getApiUrl(\`\${|g" \
  -e "s|\`http://localhost:3001\${|getApiUrl(\`\${|g" \
  {} \;

echo "Done! Remember to add 'import { getApiUrl } from '../config';' to files that need it."
