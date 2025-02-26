<script setup>
import Navbar from '@/components/Navbar.vue';
import { RouterView } from 'vue-router';
</script>

<template>
  <div class="pb-20">
    <RouterView />
  </div>
  <Navbar />
</template>
