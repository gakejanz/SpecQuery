# SpecQuery + OpenAPI-TS Integration Guide

This guide shows how to integrate SpecQuery with OpenAPI-TS for a complete type-safe API development workflow.

## Overview

SpecQuery bridges the gap between OpenAPI schema generation and TanStack React Query by:

1. **Parsing OpenAPI specs** and extracting operation metadata
2. **Generating React Query hooks** with proper TypeScript types
3. **Integrating with OpenAPI-TS** for shared types and client configuration
4. **Providing enhanced error handling** and retry logic
5. **Supporting advanced query options** like caching, invalidation, and optimistic updates

## Quick Start

### 1. Install Dependencies

```bash
npm install @tanstack/react-query openapi-typescript
npm install -D spec-query
```

### 2. Generate OpenAPI-TS Types

First, generate your OpenAPI-TS types from your OpenAPI spec (supports both JSON and YAML):

```bash
# Generate OpenAPI-TS types from YAML spec
npx openapi-typescript petstore.yaml -o src/api/types.ts

# Or from JSON spec
npx openapi-typescript petstore.json -o src/api/types.ts

# Or from remote URL
npx openapi-typescript https://api.example.com/openapi.json -o src/api/types.ts
```

### 3. Generate SpecQuery Hooks

Then generate React Query hooks that integrate with the openapi-typescript types:

```bash
# Generate React Query hooks with openapi-typescript integration
npx spec-query \
  --schema petstore.yaml \
  --out src/hooks \
  --openapi-ts-config openapi-ts.config.json \
  --generate-types
```

### 4. Configure React Query

Set up your React Query client:

```typescript
// src/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000,   // 10 minutes
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 1,
    },
  },
});
```

## Configuration Files

### OpenAPI-TS Configuration

```json
// openapi-ts.config.json
{
  "typesPath": "./src/api/types.ts",
  "baseUrl": "https://api.example.com",
  "headers": {
    "Authorization": "Bearer {{token}}",
    "X-API-Version": "1.0"
  }
}
```

### SpecQuery Configuration

```json
// spec-query.config.json
{
  "schema": "petstore.yaml",
  "outDir": "src/hooks",
  "baseUrl": "https://api.example.com",
  "groupByTag": true,
  "generateTypes": true,
  "openApiTsConfig": "openapi-ts.config.json"
}
```

## Generated File Structure

```
src/
├── api/                    # OpenAPI-TS generated files
│   └── types.ts           # TypeScript types from openapi-typescript
├── hooks/                  # SpecQuery generated files
│   ├── client.ts          # HTTP client with error handling
│   ├── queryKeys.ts       # Query keys for cache management
│   ├── invalidate.ts      # Query invalidation utilities
│   ├── types.ts           # Additional SpecQuery types
│   └── hooks/             # React Query hooks by tag
│       └── Pets.generated.ts
└── components/            # Your React components
    └── PetList.tsx
```

## Usage Examples

### Basic Query Hook

```typescript
import { useGetPets } from '../hooks/hooks/Pets.generated';

function PetList() {
  const { data: pets, isLoading, error } = useGetPets({
    query: { status: ['available'], limit: 10 }
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

### Mutation Hook with Optimistic Updates

```typescript
import { useCreatePet } from '../hooks/hooks/Pets.generated';
import { queryKeys } from '../hooks/queryKeys';
import { useQueryClient } from '@tanstack/react-query';

function CreatePetForm() {
  const queryClient = useQueryClient();
  
  const createPet = useCreatePet({
    onMutate: async (newPet) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.pets.root });
      
      // Snapshot previous value
      const previousPets = queryClient.getQueryData(queryKeys.pets.root);
      
      // Optimistically update
      queryClient.setQueryData(queryKeys.pets.root, (old: any) => [
        ...(old || []),
        { ...newPet, id: 'temp-' + Date.now() }
      ]);
      
      return { previousPets };
    },
    onError: (err, newPet, context) => {
      // Rollback on error
      queryClient.setQueryData(queryKeys.pets.root, context?.previousPets);
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: queryKeys.pets.root });
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

### Advanced Query with Infinite Loading

```typescript
import { useInfiniteQuery } from '@tanstack/react-query';
import { createClient } from '../hooks/client';

function InfinitePetList() {
  const client = createClient();
  
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error
  } = useInfiniteQuery({
    queryKey: ['pets', 'infinite'],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await client.request('GET', `/pets?offset=${pageParam}&limit=10`);
      return response;
    },
    getNextPageParam: (lastPage, pages) => {
      return lastPage.length === 10 ? pages.length * 10 : undefined;
    },
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {data?.pages.map((page, i) => (
        <div key={i}>
          {page.map(pet => (
            <div key={pet.id}>{pet.name}</div>
          ))}
        </div>
      ))}
      
      <button 
        onClick={() => fetchNextPage()} 
        disabled={!hasNextPage || isFetchingNextPage}
      >
        {isFetchingNextPage ? 'Loading more...' : 'Load More'}
      </button>
    </div>
  );
}
```

## Error Handling

### Global Error Handling

```typescript
// src/errorHandling.ts
import { ApiError } from '../hooks/client';

export function handleApiError(error: ApiError) {
  switch (error.status) {
    case 401:
      // Redirect to login
      window.location.href = '/login';
      break;
    case 403:
      // Show forbidden message
      alert('You do not have permission to perform this action');
      break;
    case 404:
      // Show not found message
      alert('Resource not found');
      break;
    case 500:
      // Show server error message
      alert('Server error. Please try again later.');
      break;
    default:
      // Show generic error
      alert(`Error: ${error.message}`);
  }
}
```

### Component-Level Error Handling

```typescript
import { useGetPets } from '../hooks/hooks/Pets.generated';
import { handleApiError } from '../errorHandling';

function PetListWithErrorHandling() {
  const { data, error, isLoading } = useGetPets();

  if (error) {
    handleApiError(error);
    return <div>Error loading pets</div>;
  }

  // ... rest of component
}
```

## Advanced Features

### Custom Query Keys

```typescript
import { queryKeys } from '../hooks/queryKeys';

// Custom query key factory
export const customQueryKeys = {
  pets: {
    ...queryKeys.pets,
    byStatus: (status: string) => [...queryKeys.pets.root, 'byStatus', status],
    byOwner: (ownerId: string) => [...queryKeys.pets.root, 'byOwner', ownerId],
  }
};
```

### Prefetching

```typescript
import { useQueryClient } from '@tanstack/react-query';
import { useGetPetById } from '../hooks/hooks/Pets.generated';

function PetCard({ petId }: { petId: string }) {
  const queryClient = useQueryClient();
  
  const prefetchPet = () => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.pets.getPetById(),
      queryFn: () => useGetPetById({ path: { petId } }).queryFn()
    });
  };

  return (
    <div onMouseEnter={prefetchPet}>
      <h3>Pet {petId}</h3>
    </div>
  );
}
```

### Background Refetching

```typescript
import { useGetPets } from '../hooks/hooks/Pets.generated';

function PetListWithBackgroundRefetch() {
  const { data, isFetching } = useGetPets(
    { query: { status: ['available'] } },
    {
      refetchInterval: 30000, // Refetch every 30 seconds
      refetchIntervalInBackground: true, // Continue refetching when tab is not active
    }
  );

  return (
    <div>
      {isFetching && <div>Updating...</div>}
      {/* ... render pets */}
    </div>
  );
}
```

## Best Practices

### 1. Type Safety
- Always use the generated types for request/response data
- Leverage TypeScript's strict mode for better error catching
- Use the generated parameter types for path and query parameters

### 2. Caching Strategy
- Configure appropriate stale times based on data freshness requirements
- Use query invalidation after mutations
- Implement optimistic updates for better UX

### 3. Error Handling
- Implement global error boundaries
- Provide user-friendly error messages
- Handle network errors gracefully

### 4. Performance
- Use query prefetching for anticipated data needs
- Implement infinite queries for large datasets
- Configure appropriate retry strategies

### 5. Development Workflow
- Keep OpenAPI specs up to date
- Regenerate hooks when API changes
- Use TypeScript strict mode for better type checking

## Troubleshooting

### Common Issues

1. **Import Errors**: Ensure all generated files are in the correct relative paths
2. **Type Errors**: Run with `--generate-types` to get proper TypeScript types
3. **Network Errors**: Check base URL and CORS configuration
4. **Authentication**: Configure headers in the client or OpenAPI-TS config

### Debug Mode

Enable debug logging:

```bash
DEBUG=spec-query npx spec-query --schema petstore.yaml --out src/hooks
```

### Validation

Validate your OpenAPI spec:

```bash
npx swagger-codegen validate -i petstore.yaml
```

## Migration from Other Tools

### From Orval

```bash
# Remove orval
npm uninstall orval

# Install spec-query
npm install -D spec-query

# Update your generation script
npx spec-query --schema petstore.yaml --out src/hooks --generate-types
```

### From OpenAPI Generator

```bash
# Remove openapi-generator
npm uninstall @openapitools/openapi-generator-cli

# Install spec-query
npm install -D spec-query

# Update your generation script
npx spec-query --schema petstore.yaml --out src/hooks --generate-types
```

## Contributing

SpecQuery is open source and welcomes contributions:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## Support

- GitHub Issues: [Report bugs and request features](https://github.com/your-org/spec-query/issues)
- Documentation: [Read the full documentation](https://spec-query.dev)
- Community: [Join our Discord](https://discord.gg/spec-query)
