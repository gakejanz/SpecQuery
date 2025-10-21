# SpecQuery Changelog

## v0.1.1 - Project cleanup & packaging
  - Added Gif for Npm Package Page

## v0.1.0 - Project cleanup & packaging

- Split the CLI into `src/cli.ts` and exposed the programmatic API from `src/index.ts`.
- Fixed hook generation bugs for non-tagged output and mutation payload serialization.
- Added query serialization helpers, improved parameter typing, and removed unused dependencies.
- Introduced a dedicated `tsup` build config, NPM package metadata, and MIT license.
- Added `.gitignore`, CONTRIBUTING guidelines, and refreshed documentation with the new workflow.
- Added CLI `--verbose` / `--dry-run` flags and colorised completion output.

## v0.2.0 - Enhanced OpenAPI-TS Integration & JSON Support

### 🎯 Major Changes

#### ✅ **Corrected OpenAPI-TS Integration**
- **Fixed package dependency**: Changed from incorrect `@hey-api/openapi-ts` to proper `openapi-typescript`
- **Corrected workflow**: Now properly generates types FROM OpenAPI specs (not the other way around)
- **Removed client generation**: openapi-typescript only generates types, not HTTP clients
- **Enhanced type integration**: Better integration with openapi-typescript generated types

#### ✅ **JSON OpenAPI Spec Support**
- **Added JSON support**: Now supports both JSON and YAML OpenAPI specifications
- **Updated CLI**: Enhanced help text to indicate JSON/YAML support
- **Enhanced examples**: Added JSON examples alongside YAML examples
- **Improved documentation**: Updated all docs to show both JSON and YAML usage

### 🔧 Technical Improvements

#### **Enhanced Type Safety**
- **Better parameter typing**: Improved TypeScript types for path, query, and header parameters
- **Generic type support**: Enhanced generic type support for response data
- **Error type integration**: Better integration with openapi-typescript error types

#### **Improved Parameter Handling**
- **Categorized parameters**: Better separation of path, query, header, and cookie parameters
- **Smart serialization**: Improved query parameter serialization with null/undefined handling
- **Path interpolation**: Enhanced path parameter interpolation with type checking

#### **Sophisticated Error Handling**
- **Enhanced ApiError class**: Added status codes, error codes, and body data
- **Retry logic**: Configurable retry with exponential backoff
- **Timeout handling**: Request timeout detection and handling
- **Network error detection**: Better network error handling and reporting

### 📚 Documentation Updates

#### **Comprehensive Examples**
- **JSON examples**: Added `petstore.json` example alongside YAML
- **Integration guide**: Updated to show correct openapi-typescript workflow
- **Usage examples**: Enhanced React component examples with proper typing
- **Configuration examples**: Updated config files to reflect correct integration

#### **Correct Workflow Documentation**
- **Step-by-step guide**: Clear workflow from OpenAPI spec → openapi-typescript → SpecQuery
- **Common pitfalls**: Documented what NOT to do and why
- **Best practices**: Added development workflow and maintenance guidelines

### 🚀 New Features

#### **Enhanced CLI Options**
```bash
npx spec-query \
  --schema petstore.yaml \           # Supports both JSON and YAML
  --out src/hooks \                   # Output directory
  --openapi-ts-config config.json \   # openapi-typescript integration
  --generate-types \                  # Generate additional types
  --base-url https://api.example.com # API base URL
  --group-by-tag                     # Group hooks by OpenAPI tags
```

#### **Improved Generated Code**
- **Type-safe hooks**: Full TypeScript support with generated interfaces
- **Better error handling**: Comprehensive error handling with retry logic
- **Query invalidation**: Enhanced cache management utilities
- **Optimistic updates**: Support for optimistic updates in mutations

### 🔄 Migration Guide

#### **From Previous Versions**
1. **Update dependencies**: Change `@hey-api/openapi-ts` to `openapi-typescript`
2. **Update workflow**: Generate types first, then hooks
3. **Update imports**: Use correct openapi-typescript type imports
4. **Update configuration**: Remove client path from openapi-ts config

#### **New Workflow**
```bash
# 1. Generate types with openapi-typescript
npx openapi-typescript petstore.yaml -o src/api/types.ts

# 2. Generate hooks with SpecQuery
npx spec-query --schema petstore.yaml --out src/hooks --openapi-ts-config config.json
```

### 🐛 Bug Fixes

- **Fixed package imports**: Corrected openapi-typescript package usage
- **Fixed type generation**: Proper TypeScript type generation from OpenAPI schemas
- **Fixed parameter handling**: Corrected path parameter interpolation in mutations
- **Fixed error handling**: Improved error type integration

### 📦 Dependencies

#### **Added**
- `openapi-typescript: ^7.10.1` - Correct OpenAPI-TS package
- `zod: ^3.23.8` - Schema validation support

#### **Removed**
- `@hey-api/openapi-ts` - Incorrect package

### 🎯 Breaking Changes

#### **Configuration Changes**
- **openapi-ts.config.json**: Removed `clientPath` field (not needed)
- **Type imports**: Changed from `@hey-api/openapi-ts` to `openapi-typescript`

#### **API Changes**
- **Client template**: Updated to use correct openapi-typescript imports
- **Integration**: Simplified integration to focus on type sharing

### 🚀 Performance Improvements

- **Faster generation**: Optimized OpenAPI spec parsing
- **Better caching**: Improved query key generation for better cache management
- **Reduced bundle size**: Removed unnecessary dependencies

### 🔮 Future Roadmap

- **Schema validation**: Add runtime schema validation with Zod
- **Advanced caching**: Implement more sophisticated caching strategies
- **Plugin system**: Add plugin system for custom transformations
- **GraphQL support**: Explore GraphQL schema support
- **Testing utilities**: Add testing utilities for generated hooks

### 📝 Examples

#### **Basic Usage**
```bash
# Generate from YAML
npx spec-query --schema petstore.yaml --out src/hooks

# Generate from JSON
npx spec-query --schema petstore.json --out src/hooks
```

#### **With openapi-typescript Integration**
```bash
# 1. Generate types
npx openapi-typescript petstore.yaml -o src/api/types.ts

# 2. Generate hooks
npx spec-query --schema petstore.yaml --out src/hooks --openapi-ts-config config.json
```

#### **Usage in React**
```typescript
import { useGetPets } from '../hooks/hooks/Pets.generated';
import type { paths } from '../api/types';

type Pet = paths['/pets']['get']['responses']['200']['content']['application/json'][0];

function PetList() {
  const { data: pets, isLoading, error } = useGetPets({
    query: { status: ['available'], limit: 10 }
  });

  // ... component logic
}
```

### 🙏 Acknowledgments

- **openapi-typescript team**: For the excellent type generation tool
- **TanStack Query team**: For the powerful React Query library
- **OpenAPI community**: For the comprehensive OpenAPI specification

---

**Full Changelog**: [v0.1.0...v0.2.0](https://github.com/your-org/spec-query/compare/v0.1.0...v0.2.0)
