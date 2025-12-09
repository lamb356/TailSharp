// Client-side check (works in browser and server)
export const IS_SIMULATION =
  process.env.NEXT_PUBLIC_TAILSHARP_SIMULATION === 'true';

// For server-side only code, we can also check the non-public version as fallback
export const IS_SIMULATION_SERVER =
  process.env.NEXT_PUBLIC_TAILSHARP_SIMULATION === 'true' ||
  process.env.TAILSHARP_SIMULATION === 'true';