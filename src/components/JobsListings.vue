<script setup>
import { RouterLink } from 'vue-router';
import JobListing from './JobListing.vue';
import { reactive, defineProps, onMounted } from 'vue';
import PulseLoader from 'vue-spinner/src/PulseLoader.vue';
import axios from 'axios';

const state = reactive({
  jobs: [],
  isLoading: true,
});


onMounted(async () => {
  try {
    const jobsResponse = await axios.get('/api/jobs');
    
    state.jobs = jobsResponse.data;
    

  } catch (error) {
    console.error('Error fetching data', error);
  } finally {
    state.isLoading = false;
  }
});


</script>

<template>
    
    <section class="bg-blue-50 px-4 py-10">
    <div class="container-xl lg:container m-auto">
      <h2 class="text-3xl font-bold text-green-500 mb-6 text-center">
        Zamówienia
      </h2>
      <!-- Show loading spinner while loading is true -->
      <div v-if="state.isLoading" class="text-center text-gray-500 py-6">
        <PulseLoader />
      </div>

      <!-- Show truck and job listings when done loading -->
      <div v-else class="grid grid-cols-1 gap-6">
        <JobListing v-for="job in state.jobs" :key="job.id" :job="job" />
      </div>
    </div>
  </section>
</template>