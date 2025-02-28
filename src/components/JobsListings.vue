<script setup>
import { RouterLink } from 'vue-router';
import JobListing from './JobListing.vue';
import { reactive, defineProps, onMounted, computed, ref } from 'vue';
import PulseLoader from 'vue-spinner/src/PulseLoader.vue';
import axios from 'axios';

const state = reactive({
  jobs: [],
  isLoading: true,
});

// Add controls for filtering and sorting
const showCompletedJobs = ref(false);
const isAscending = ref(true);

// Filtered jobs
const filteredJobs = computed(() => {
  return state.jobs.filter(job => {
    if (!showCompletedJobs.value) {
      // Show only jobs without realUnloadingDate
      return !job.realUnloadingDate || job.realUnloadingDate.length === 0;
    }
    // Show all jobs
    return true;
  });
});

// Sorted and filtered jobs
const sortedJobs = computed(() => {
  return [...filteredJobs.value].sort((a, b) => {
    // If either date is null/empty, move it to the top
    if (!a.planLoadingDate && !b.planLoadingDate) return 0;
    if (!a.planLoadingDate) return -1;
    if (!b.planLoadingDate) return 1;

    // Compare dates based on sort direction
    const comparison = new Date(a.planLoadingDate) - new Date(b.planLoadingDate);
    return isAscending.value ? comparison : -comparison;
  });
});

// Toggle functions
const toggleShowCompleted = () => {
  showCompletedJobs.value = !showCompletedJobs.value;
};

const toggleSortDirection = () => {
  isAscending.value = !isAscending.value;
};

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

      <!-- Control buttons -->
      <div class="flex justify-center gap-4 mb-6">
        <button 
          @click="toggleShowCompleted"
          class="px-4 py-2 rounded-lg font-medium transition-colors"
          :class="{
            'bg-green-500 text-white': !showCompletedJobs,
            'bg-gray-300 text-gray-700': showCompletedJobs
          }"
        >
          {{ showCompletedJobs ? 'Hide Completed' : 'Show Completed' }}
        </button>
        
        <button 
          @click="toggleSortDirection"
          class="bg-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-600 transition-colors flex items-center gap-2"
        >
          <span>Sort</span>
          <i :class="[
            isAscending ? 'pi pi-sort-amount-up' : 'pi pi-sort-amount-down',
            'text-lg'
          ]"></i>
        </button>

        <RouterLink 
          to="/jobs/add"
          class="bg-orange-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-600 transition-colors flex items-center gap-2"
        >
          <span>Add Job</span>
          <i class="pi pi-plus text-lg"></i>
        </RouterLink>
      </div>

      <!-- Show loading spinner while loading is true -->
      <div v-if="state.isLoading" class="text-center text-gray-500 py-6">
        <PulseLoader />
      </div>

      <!-- Show truck and job listings when done loading -->
      <div v-else class="grid grid-cols-1 gap-3">
        <JobListing v-for="job in sortedJobs" :key="job.id" :job="job" />
      </div>
    </div>
  </section>
</template>