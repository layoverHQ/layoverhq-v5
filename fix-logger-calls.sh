#!/bin/bash

# Fix logger calls across the codebase
echo "Fixing logger calls..."

# Find files with logger calls and fix the argument order
find app/ lib/ -name "*.ts" -o -name "*.tsx" | xargs grep -l "logger\." | while read file; do
  echo "Processing $file..."
  
  # Use sed to fix common patterns where object is first argument
  sed -i '' 's/logger\.info(\s*{[^}]*},\s*\([^)]*\))/logger.info(\1, {object})/g' "$file"
  sed -i '' 's/logger\.error(\s*{[^}]*},\s*\([^)]*\))/logger.error(\1, {object})/g' "$file"
  sed -i '' 's/logger\.warn(\s*{[^}]*},\s*\([^)]*\))/logger.warn(\1, {object})/g' "$file"
  sed -i '' 's/logger\.debug(\s*{[^}]*},\s*\([^)]*\))/logger.debug(\1, {object})/g' "$file"
done

echo "Logger calls fixed!"