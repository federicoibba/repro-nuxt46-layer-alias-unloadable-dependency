// This composable lives inside an installed layer (node_modules/my-layer/app).
// Nuxt 4.6's dev dependency optimizer scans installed-layer app files and, while
// scanning, resolves the `@/` import below against the CONSUMER app's srcDir
// instead of THIS layer's own app/ dir, producing:
//   [UNLOADABLE_DEPENDENCY] Could not load app/utils/greeting
import { makeGreeting } from '@/utils/greeting'

export const useGreeting = (name: string): string => makeGreeting(name)
