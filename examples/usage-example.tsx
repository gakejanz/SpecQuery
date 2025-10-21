// Example React component showing how to use the generated hooks
import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useGetPets, useCreatePet, useUpdatePet, useDeletePet, useGetPetById } from './out/hooks/Pets.generated';
import { queryKeys } from './out/queryKeys';
import type { ApiError } from './out/client';

// Example component using the generated hooks
export function PetList() {
  const [status, setStatus] = useState<'available' | 'pending' | 'sold' | undefined>();
  const [limit, setLimit] = useState(10);

  // Query hook with proper typing
  const { 
    data: pets, 
    isLoading, 
    error, 
    refetch 
  } = useGetPets(
    { 
      query: { 
        status: status ? [status] : undefined, 
        limit 
      } 
    },
    {
      enabled: true,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000,    // 10 minutes
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
    }
  );

  if (isLoading) return <div>Loading pets...</div>;
  
  if (error) {
    return (
      <div>
        <h2>Error loading pets</h2>
        <p>Status: {error.status}</p>
        <p>Message: {error.message}</p>
        <button onClick={() => refetch()}>Retry</button>
      </div>
    );
  }

  return (
    <div>
      <h1>Pets</h1>
      
      {/* Filters */}
      <div>
        <label>
          Status:
          <select value={status || ''} onChange={(e) => setStatus(e.target.value as any || undefined)}>
            <option value="">All</option>
            <option value="available">Available</option>
            <option value="pending">Pending</option>
            <option value="sold">Sold</option>
          </select>
        </label>
        
        <label>
          Limit:
          <input 
            type="number" 
            value={limit} 
            onChange={(e) => setLimit(Number(e.target.value))}
            min="1" 
            max="100" 
          />
        </label>
      </div>

      {/* Pet list */}
      <ul>
        {pets?.map(pet => (
          <li key={pet.id}>
            <strong>{pet.name}</strong> - {pet.status}
            <PetActions petId={pet.id} />
          </li>
        ))}
      </ul>
    </div>
  );
}

// Component for individual pet actions
function PetActions({ petId }: { petId: string }) {
  const queryClient = useQueryClient();
  
  // Get individual pet
  const { data: pet, isLoading } = useGetPetById(
    { path: { petId } },
    { enabled: !!petId }
  );

  // Create pet mutation
  const createPet = useCreatePet({
    onSuccess: (data) => {
      console.log('Pet created:', data);
      // Invalidate and refetch pets list
      queryClient.invalidateQueries({ queryKey: queryKeys.pets.root });
    },
    onError: (error: ApiError) => {
      console.error('Failed to create pet:', error);
    }
  });

  // Update pet mutation
  const updatePet = useUpdatePet({
    onSuccess: (data) => {
      console.log('Pet updated:', data);
      // Invalidate specific pet and pets list
      queryClient.invalidateQueries({ queryKey: queryKeys.pets.getPetById() });
      queryClient.invalidateQueries({ queryKey: queryKeys.pets.root });
    },
    onError: (error: ApiError) => {
      console.error('Failed to update pet:', error);
    }
  });

  // Delete pet mutation
  const deletePet = useDeletePet({
    onSuccess: () => {
      console.log('Pet deleted');
      // Invalidate pets list
      queryClient.invalidateQueries({ queryKey: queryKeys.pets.root });
    },
    onError: (error: ApiError) => {
      console.error('Failed to delete pet:', error);
    }
  });

  const handleCreate = () => {
    createPet.mutate({
      name: 'New Pet',
      status: 'available'
    });
  };

  const handleUpdate = () => {
    if (!pet) return;
    
    updatePet.mutate({
      path: { petId },
      name: pet.name + ' (Updated)',
      status: pet.status
    });
  };

  const handleDelete = () => {
    deletePet.mutate({
      path: { petId }
    });
  };

  if (isLoading) return <span>Loading...</span>;

  return (
    <div>
      <button onClick={handleCreate} disabled={createPet.isPending}>
        {createPet.isPending ? 'Creating...' : 'Create Pet'}
      </button>
      
      <button onClick={handleUpdate} disabled={updatePet.isPending}>
        {updatePet.isPending ? 'Updating...' : 'Update'}
      </button>
      
      <button onClick={handleDelete} disabled={deletePet.isPending}>
        {deletePet.isPending ? 'Deleting...' : 'Delete'}
      </button>
    </div>
  );
}

// Example of using openapi-typescript types directly
import type { paths } from '../api/types';

// Use the generated types from openapi-typescript
type Pet = paths['/pets']['get']['responses']['200']['content']['application/json'][0];
type CreatePetRequest = paths['/pets']['post']['requestBody']['content']['application/json'];

export async function directApiExample() {
  const { createClient } = await import('./out/client');
  
  const client = createClient({
    baseUrl: 'https://api.petstore.com',
    headers: {
      'Authorization': 'Bearer your-token'
    }
  });

  try {
    // Direct API calls with full type safety using openapi-typescript types
    const pets: Pet[] = await client.request('GET', '/pets', {
      headers: { 'Accept': 'application/json' }
    });
    
    const newPet: Pet = await client.request('POST', '/pets', {
      body: JSON.stringify({
        name: 'Fluffy',
        status: 'available'
      } as CreatePetRequest)
    });
    
    console.log('Pets:', pets);
    console.log('New pet:', newPet);
  } catch (error) {
    if (error instanceof Error) {
      console.error('API Error:', error.message);
    }
  }
}

// Example error boundary component
export class ApiErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: ApiError }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    if (error instanceof Error && 'status' in error) {
      return { hasError: true, error: error as ApiError };
    }
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('API Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div>
          <h2>Something went wrong with the API</h2>
          {this.state.error && (
            <div>
              <p>Status: {this.state.error.status}</p>
              <p>Message: {this.state.error.message}</p>
              <button onClick={() => this.setState({ hasError: false, error: undefined })}>
                Try again
              </button>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
