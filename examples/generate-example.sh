#!/bin/bash

# Example workflow for SpecQuery + openapi-typescript integration
# This demonstrates the correct order of operations

echo "🚀 SpecQuery + openapi-typescript Integration Example"
echo "=================================================="

# Step 1: Generate types with openapi-typescript
echo "📝 Step 1: Generating types with openapi-typescript..."
echo "   - From YAML spec..."
npx openapi-typescript examples/petstore.yaml -o examples/out/api-types-from-yaml.ts
echo "   - From JSON spec..."
npx openapi-typescript examples/petstore.json -o examples/out/api-types-from-json.ts

# Step 2: Generate React Query hooks with SpecQuery
echo "⚡ Step 2: Generating React Query hooks with SpecQuery..."
echo "   - From YAML spec..."
node ../dist/index.js \
  --schema examples/petstore.yaml \
  --out examples/out-yaml \
  --openapi-ts-config examples/openapi-ts.config.json \
  --generate-types \
  --base-url https://api.petstore.com

echo "   - From JSON spec..."
node ../dist/index.js \
  --schema examples/petstore.json \
  --out examples/out-json \
  --openapi-ts-config examples/openapi-ts.config.json \
  --generate-types \
  --base-url https://api.petstore.com

echo "✅ Generation complete!"
echo ""
echo "Generated files:"
echo "- examples/out/api-types-from-yaml.ts (from openapi-typescript YAML)"
echo "- examples/out/api-types-from-json.ts (from openapi-typescript JSON)"
echo "- examples/out-yaml/ (React Query hooks from YAML spec)"
echo "- examples/out-json/ (React Query hooks from JSON spec)"
echo ""
echo "Usage in your React components:"
echo "import { useGetPets } from './out-yaml/hooks/Pets.generated';"
echo "import type { paths } from './out/api-types-from-yaml';"
echo ""
echo "Both JSON and YAML OpenAPI specs are supported!"
