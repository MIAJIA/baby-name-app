import * as zod from 'zod';

// Re-export with consistent interface
export const z = zod.z || zod;
export type ZodInfer<T> = zod.infer<T>;