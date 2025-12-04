#!/bin/bash

# Files to update
FILES=(
  "./client/src/_core/hooks/useAuth.ts"
  "./client/src/components/ManusDialog.tsx"
  "./docs/KAFKA_SETUP.md"
  "./package.json"
  "./server/_core/dataApi.ts"
  "./server/_core/llm.ts"
  "./server/_core/map.ts"
  "./server/_core/notification.ts"
  "./server/_core/sdk.ts"
  "./server/auth.logout.test.ts"
  "./server/storage.ts"
  "./vite.config.ts"
)

# Replacements
# Manus -> TuringDynamics (preserve case)
for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "Processing: $file"
    
    # Case-sensitive replacements
    sed -i 's/Manus/TuringDynamics/g' "$file"
    sed -i 's/manus/turingdynamics/g' "$file"
    sed -i 's/MANUS/TURINGDYNAMICS/g' "$file"
    
    # Special cases for specific patterns
    sed -i 's/vite-plugin-turingdynamics-runtime/vite-plugin-manus-runtime/g' "$file"
    sed -i 's/@turingdynamics\/runtime/@manus\/runtime/g' "$file"
  fi
done

echo "Replacement complete!"
