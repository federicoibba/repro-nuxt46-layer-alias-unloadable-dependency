<script setup lang="ts">
import { useGreeting } from '@/composables/useGreeting'

const message = useGreeting('world')
</script>

<template>
  <p>{{ message }}</p>
</template>
