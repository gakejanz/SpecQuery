# SpecQuery Examples

This directory contains examples of how to use SpecQuery with OpenAPI-TS integration.

## Basic Usage

### 1. Generate React Query hooks from OpenAPI spec

```bash
# Basic generation (supports both JSON and YAML)
npx spec-query --schema examples/petstore.yaml --out examples/out
npx spec-query --schema examples/petstore.json --out examples/out

# With custom base URL
npx spec-query --schema examples/petstore.yaml --out examples/out --base-url https://api.petstore.com

# Generate TypeScript types
npx spec-query --schema examples/petstore.yaml --out examples/out --generate-types

# With openapi-typescript integration
npx openapi-typescript examples/petstore.yaml -o examples/out/types.ts
npx openapi-typescript examples/petstore.json -o examples/out/types.ts
npx spec-query --schema examples/petstore.yaml --out examples/out --openapi-ts-config examples/openapi-ts.config.json
```

### 2. OpenAPI-TS Integration

```bash
# With OpenAPI-TS configuration
npx spec-query \
  --schema examples/petstore.yaml \
  --out examples/out \
  --openapi-ts-config examples/openapi-ts.config.json \
  --generate-types
```

## Generated Files Structure

```
examples/out/
├── client.ts              # HTTP client with error handling
├── queryKeys.ts           # TanStack Query keys
├── invalidate.ts          # Query invalidation utilities
├── types.ts               # TypeScript types (if --generate-types)
├── openapi-ts.config.ts  # OpenAPI-TS integration config
└── hooks/
    └── Pets.generated.ts  # React Query hooks by tag
```

## Usage in React Components

### Basic Query Hook

```typescript
import { useGetPets } from './hooks/Pets.generated';

function PetList() {
  const { data: pets, isLoading, error } = useGetPets({
    query: { status: 'available' }
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <ul>
      {pets?.map(pet => (
        <li key={pet.id}>{pet.name}</li>
      ))}
    </ul>
  );
}
```

### Mutation Hook

```typescript
import { useCreatePet } from './hooks/Pets.generated';

function CreatePetForm() {
  const createPet = useCreatePet({
    onSuccess: (data) => {
      console.log('Pet created:', data);
    },
    onError: (error) => {
      console.error('Failed to create pet:', error);
    }
  });

  const handleSubmit = (formData: FormData) => {
    createPet.mutate({
      name: formData.get('name') as string,
      status: 'available'
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" placeholder="Pet name" required />
      <button type="submit" disabled={createPet.isPending}>
        {createPet.isPending ? 'Creating...' : 'Create Pet'}
      </button>
    </form>
  );
}
```

### Advanced Query Options

```typescript
import { useGetPets } from './hooks/Pets.generated';

function PetListWithOptions() {
  const { data, isLoading, error, refetch } = useGetPets(
    { query: { status: 'available' } },
    {
      enabled: true,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000,    // 10 minutes
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      refetchOnReconnect: true
    }
  );

  return (
    <div>
      <button onClick={() => refetch()}>Refresh</button>
      {/* ... render pets */}
    </div>
  );
}
```

## OpenAPI-TS Integration

When using OpenAPI-TS integration, you can leverage the generated types and client:

```typescript
import { createOpenApiTsClient } from './client';
import type { Pet, CreatePetRequest } from './types';

// Use the OpenAPI-TS client directly
const client = createOpenApiTsClient({
  baseUrl: 'https://api.petstore.com',
  headers: {
    'Authorization': 'Bearer your-token'
  }
});

// Direct API calls with full type safety
const pets = await client.getPets({ status: 'available' });
const newPet = await client.createPet({ name: 'Fluffy', status: 'available' });
```

## Error Handling

The generated hooks include comprehensive error handling:

```typescript
import { useGetPets } from './hooks/Pets.generated';
import type { ApiError } from './client';

function PetListWithErrorHandling() {
  const { data, error, isLoading } = useGetPets();

  if (error) {
    // Type-safe error handling
    if (error.status === 404) {
      return <div>No pets found</div>;
    }
    if (error.status === 500) {
      return <div>Server error: {error.message}</div>;
    }
    return <div>Error: {error.message}</div>;
  }

  // ... rest of component
}
```

## Query Invalidation

Use the generated invalidation utilities for cache management:

```typescript
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';

function usePetMutations() {
  const queryClient = useQueryClient();

  const createPet = useCreatePet({
    onSuccess: () => {
      // Invalidate and refetch pets list
      queryClient.invalidateQueries({ queryKey: queryKeys.pets.root });
    }
  });

  return { createPet };
}
```

## Configuration Options

### CLI Options

- `--schema <path>`: OpenAPI schema file or URL (required)
- `--out <dir>`: Output directory (default: `examples/out`)
- `--base-url <url>`: Base URL for API calls (default: `/api`)
- `--group-by-tag` / `--no-group-by-tag`: Toggle grouping hooks by OpenAPI tags
- `--openapi-ts-config <path>`: Path to an `openapi-typescript` JSON config
- `--generate-types`: Generate the supplemental `types.ts` helper
- `--verbose`: Log each parsed endpoint while generating
- `--dry-run`: Show which files would be written without touching disk

### OpenAPI-TS Configuration

```json
{
  "typesPath": "./src/api/types.ts",
  "baseUrl": "https://api.example.com",
  "headers": {
    "Authorization": "Bearer {{token}}",
    "X-API-Version": "1.0"
  }
}
```

## Best Practices

1. **Type Safety**: Always use the generated types for request/response data
2. **Error Handling**: Implement proper error boundaries and user feedback
3. **Caching**: Configure appropriate stale times and cache times
4. **Retry Logic**: Use retry options for network resilience
5. **Query Keys**: Use the generated query keys for consistent cache management
6. **Invalidation**: Invalidate related queries after mutations

## Troubleshooting

### Common Issues

1. **Import Errors**: Ensure all generated files are in the correct relative paths
2. **Type Errors**: Run with `--generate-types` to get proper TypeScript types
3. **Network Errors**: Check base URL and CORS configuration
4. **Authentication**: Configure headers in the client or OpenAPI-TS config

### Debug Mode

Enable debug logging by setting the environment variable:

```bash
DEBUG=spec-query npx spec-query --schema examples/petstore.yaml --out examples/out
```
