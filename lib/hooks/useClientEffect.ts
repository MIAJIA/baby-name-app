import { useLayoutEffect, useEffect } from 'react';

// Use this hook instead of useLayoutEffect for components that might be rendered on the server
export const useClientEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

// A safer version of useEffect that only runs on the client
export const useClientOnlyEffect = (effect: React.EffectCallback, deps?: React.DependencyList) => {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const isClient = typeof window !== 'undefined';

  useEffect(() => {
    if (isClient) {
      return effect();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClient, ...(deps || [])]);
};