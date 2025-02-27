<script setup>
import Navbar from '@/components/Navbar.vue';
import { RouterView } from 'vue-router';

import { createVfm } from 'vue-final-modal'


const vfm = createVfm()



</script>

<template>
  <div class="pb-20">
    <RouterView />
  </div>
  <Navbar />
</template>
