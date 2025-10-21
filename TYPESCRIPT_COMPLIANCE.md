# TypeScript Compliance & Hook Limitations

## 🎯 **TypeScript Compliance Status**

### ✅ **What Works Well**
- **Basic type safety** for parameters and responses
- **TanStack Query integration** with proper typing
- **Error handling** with typed ApiError
- **Generic type support** for custom response types
- **Path parameter interpolation** with type checking

### ❌ **Current TypeScript Issues**

#### **1. Strict TypeScript Compliance Issues**
```typescript
// Issue: exactOptionalPropertyTypes: true
// Current: T | undefined not assignable to T
// Fix: Use proper optional handling
```

#### **2. ESM Module Resolution**
```typescript
// Issue: Missing file extensions
import { createClient } from '../client';  // ❌
// Should be:
import { createClient } from '../client.js';  // ✅
```

#### **3. Undefined Access**
```typescript
// Issue: Possible undefined access
const path = `/pets/${params.path.petId}`;  // ❌
// Should be:
const path = `/pets/${params?.path?.petId}`;  // ✅
```

## 🚀 **What Our Hooks CAN Support**

### **✅ Fully Supported Features**

#### **1. Basic CRUD Operations**
```typescript
// GET requests
const { data, isLoading, error } = useGetPets({
  query: { status: ['available'], limit: 10 }
});

// POST requests
const createPet = useCreatePet({
  onSuccess: (data) => console.log('Created:', data)
});
createPet.mutate({ name: 'Fluffy', status: 'available' });
```

#### **2. Path Parameters**
```typescript
// Type-safe path parameters
const { data: pet } = useGetPetById({
  path: { petId: '123' }  // ✅ Type-safe
});
```

#### **3. Query Parameters**
```typescript
// Automatic query serialization
const { data } = useGetPets({
  query: { 
    status: ['available', 'pending'],  // ✅ Array support
    limit: 10,                         // ✅ Number support
    includeDeleted: false              // ✅ Boolean support
  }
});
```

#### **4. Error Handling**
```typescript
// Comprehensive error handling
const { data, error } = useGetPets();
if (error) {
  console.log(error.status);    // ✅ HTTP status
  console.log(error.message);   // ✅ Error message
  console.log(error.body);      // ✅ Response body
  console.log(error.code);      // ✅ Error code
}
```

#### **5. TanStack Query Features**
```typescript
// All standard TanStack Query options
const { data } = useGetPets(
  { query: { status: ['available'] } },
  {
    enabled: true,                    // ✅ Conditional fetching
    staleTime: 5 * 60 * 1000,        // ✅ Cache configuration
    gcTime: 10 * 60 * 1000,          // ✅ Garbage collection
    retry: 3,                         // ✅ Retry logic
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,      // ✅ Refetch behavior
    refetchOnMount: true,
    refetchOnReconnect: true
  }
);
```

#### **6. Cache Management**
```typescript
// Query invalidation
import { queryKeys } from '../queryKeys';
import { useQueryClient } from '@tanstack/react-query';

const queryClient = useQueryClient();

// Invalidate specific queries
queryClient.invalidateQueries({ 
  queryKey: queryKeys.pets.root 
});

// Invalidate all pet queries
queryClient.invalidateQueries({ 
  queryKey: queryKeys.pets.root 
});
```

### **⚠️ Partially Supported Features**

#### **1. Infinite Queries**
```typescript
// Manual implementation required
const {
  data,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage
} = useInfiniteQuery({
  queryKey: ['pets', 'infinite'],
  queryFn: async ({ pageParam = 0 }) => {
    const response = await client.request('GET', `/pets?offset=${pageParam}&limit=10`);
    return response;
  },
  getNextPageParam: (lastPage, pages) => {
    return lastPage.length === 10 ? pages.length * 10 : undefined;
  }
});
```

#### **2. Optimistic Updates**
```typescript
// Manual implementation required
const createPet = useCreatePet({
  onMutate: async (newPet) => {
    await queryClient.cancelQueries({ queryKey: queryKeys.pets.root });
    const previousPets = queryClient.getQueryData(queryKeys.pets.root);
    queryClient.setQueryData(queryKeys.pets.root, (old: any) => [
      ...(old || []),
      { ...newPet, id: 'temp-' + Date.now() }
    ]);
    return { previousPets };
  },
  onError: (err, newPet, context) => {
    queryClient.setQueryData(queryKeys.pets.root, context?.previousPets);
  }
});
```

## ❌ **What Our Hooks CANNOT Support**

### **🚫 Unsupported OpenAPI Features**

#### **1. File Uploads**
```yaml
# OpenAPI spec with file upload
requestBody:
  content:
    multipart/form-data:
      schema:
        type: object
        properties:
          file:
            type: string
            format: binary
```
**❌ Not supported** - Would need custom implementation

#### **2. WebSocket Connections**
```yaml
# OpenAPI spec with WebSocket
paths:
  /ws:
    get:
      summary: WebSocket connection
      # WebSocket-specific configuration
```
**❌ Not supported** - TanStack Query doesn't handle WebSockets

#### **3. Server-Sent Events**
```yaml
# OpenAPI spec with SSE
paths:
  /events:
    get:
      summary: Server-sent events
      responses:
        '200':
          content:
            text/event-stream:
```
**❌ Not supported** - Would need custom implementation

#### **4. Custom Authentication**
```yaml
# OpenAPI spec with OAuth
components:
  securitySchemes:
    oauth2:
      type: oauth2
      flows:
        authorizationCode:
          authorizationUrl: https://example.com/oauth/authorize
          tokenUrl: https://example.com/oauth/token
```
**❌ Not supported** - Would need custom client configuration

### **🚫 Advanced TanStack Query Features**

#### **1. Suspense Queries**
```typescript
// React Suspense integration
const data = useSuspenseQuery({
  queryKey: ['pets'],
  queryFn: () => fetchPets()
});
```
**❌ Not generated** - Would need manual implementation

#### **2. Background Refetching**
```typescript
// Advanced background refetching
const { data } = useQuery({
  queryKey: ['pets'],
  queryFn: fetchPets,
  refetchInterval: 30000,
  refetchIntervalInBackground: true,
  refetchOnWindowFocus: true,
  refetchOnMount: true,
  refetchOnReconnect: true
});
```
**⚠️ Partially supported** - Basic options available, advanced features need manual config

### **🚫 Complex Type Inference**

#### **1. Nested Schema References**
```yaml
# Complex nested schemas
components:
  schemas:
    User:
      type: object
      properties:
        profile:
          $ref: '#/components/schemas/Profile'
    Profile:
      type: object
      properties:
        address:
          $ref: '#/components/schemas/Address'
```
**⚠️ Limited support** - Basic nesting works, complex references may not

#### **2. Union Types**
```yaml
# Union types
components:
  schemas:
    Pet:
      oneOf:
        - $ref: '#/components/schemas/Dog'
        - $ref: '#/components/schemas/Cat'
```
**⚠️ Limited support** - May generate as `any` type

#### **3. Discriminated Unions**
```yaml
# Discriminated unions
components:
  schemas:
    Animal:
      type: object
      discriminator:
        propertyName: animalType
      oneOf:
        - $ref: '#/components/schemas/Dog'
        - $ref: '#/components/schemas/Cat'
```
**❌ Not supported** - Would need custom type generation

### **🚫 OpenAPI 3.1 Features**

#### **1. JSON Schema 2020-12**
```yaml
# OpenAPI 3.1 with JSON Schema 2020-12
openapi: 3.1.0
components:
  schemas:
    Pet:
      type: object
      properties:
        id:
          type: string
          format: uuid
        tags:
          type: array
          items:
            type: string
          minItems: 1
          maxItems: 10
```
**⚠️ Limited support** - Basic 3.1 features, advanced JSON Schema features may not work

#### **2. Webhooks**
```yaml
# OpenAPI 3.1 webhooks
webhooks:
  newPet:
    post:
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Pet'
```
**❌ Not supported** - Webhooks are not HTTP requests

#### **3. Callbacks**
```yaml
# OpenAPI callbacks
paths:
  /pets:
    post:
      callbacks:
        petCreated:
          '{$request.body#/callbackUrl}':
            post:
              requestBody:
                content:
                  application/json:
                    schema:
                      $ref: '#/components/schemas/Pet'
```
**❌ Not supported** - Callbacks are not standard HTTP requests

## 🔧 **Fixing TypeScript Compliance**

### **1. Fix Import Extensions**
```typescript
// Generated code should use .js extensions
import { createClient } from '../client.js';
import { queryKeys } from '../queryKeys.js';
import type { ApiError } from '../client.js';
```

### **2. Fix Undefined Access**
```typescript
// Generated code should handle undefined
const path = `/pets/${params?.path?.petId}`;
return client.request<TData>('GET', path, {
  headers: params?.headers ?? {}
});
```

### **3. Fix Generic Types**
```typescript
// Better generic handling
export const useGetPets = <TData = Pet[]>(
  params?: GetPetsParams,
  options?: UseQueryOptions<TData, ApiError>
) => useQuery<TData, ApiError>({...});
```

## 🎯 **Recommendations**

### **For TypeScript Compliance:**
1. **Fix import extensions** in generated code
2. **Handle undefined access** properly
3. **Improve generic type inference**
4. **Add proper type guards**

### **For Enhanced Support:**
1. **Add file upload support** with FormData
2. **Add WebSocket support** with custom hooks
3. **Improve schema type generation**
4. **Add OpenAPI 3.1 support**

### **For Production Use:**
1. **Use with strict TypeScript** (with fixes)
2. **Add runtime validation** with Zod
3. **Implement proper error boundaries**
4. **Add comprehensive testing**

## 📊 **Support Matrix**

| Feature | Support Level | Notes |
|---------|---------------|-------|
| Basic CRUD | ✅ Full | GET, POST, PUT, DELETE |
| Path Parameters | ✅ Full | Type-safe path interpolation |
| Query Parameters | ✅ Full | Automatic serialization |
| Request Bodies | ✅ Full | JSON serialization |
| Error Handling | ✅ Full | Comprehensive error types |
| Cache Management | ✅ Full | Query invalidation |
| Retry Logic | ✅ Full | Configurable retry |
| File Uploads | ❌ None | Would need custom implementation |
| WebSockets | ❌ None | Not supported by TanStack Query |
| SSE | ❌ None | Would need custom implementation |
| OAuth | ⚠️ Partial | Basic auth headers only |
| Complex Schemas | ⚠️ Partial | Basic nesting, limited unions |
| OpenAPI 3.1 | ⚠️ Partial | Basic features only |

---

**Conclusion**: Our hooks provide excellent support for standard REST API operations with TanStack Query, but have limitations with advanced OpenAPI features and complex type inference. The TypeScript compliance issues are fixable and don't affect core functionality.
