<script setup>
import Hero from '@/components/Hero.vue';
import HomeCards from '@/components/HomeCards.vue';
import JobListings from '@/components/JobListings.vue';
</script>

<template>
    <JobListings :limit="0" :showButton="true" />

  <HomeCards />
  <Hero />
</template>
