import * as zod from 'zod';

// Re-export with consistent interface
export const z = zod.z || zod;
export type ZodInfer<T extends zod.ZodType<any, any, any>> = zod.infer<T>;