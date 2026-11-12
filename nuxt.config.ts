export default defineNuxtConfig({
  // Extend the layer that is installed into node_modules (via file: tarball).
  // This is how published layers such as @dx/* are consumed.
  extends: ['my-layer'],
  compatibilityDate: '2025-07-15',
})
