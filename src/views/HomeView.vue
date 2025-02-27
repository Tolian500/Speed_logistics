<script setup>
import Hero from '@/components/Hero.vue';
import HomeCards from '@/components/HomeCards.vue';
import TruckListings from '@/components/TruckListings.vue';
</script>

<template>
    <TruckListings :limit="0" :showButton="true" />

  <HomeCards />
  <Hero />
</template>
