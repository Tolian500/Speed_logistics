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

// Add status filter
const statusFilter = ref('all'); // 'all', 'assigned', 'doing', 'done'

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

// Pending jobs (not assigned)
const pendingJobs = computed(() => {
  return filteredJobs.value.filter(job => {
    // Consider a job pending if:
    // 1. It has no status or status is empty or status is "pending"
    // 2. It doesn't have a realUnloadingDate (not done)
    // 3. It's not assigned to any truck (no status "assigned" or "doing")
    return (!job.status || job.status === "" || job.status === "pending") && 
           (!job.realUnloadingDate || job.realUnloadingDate.length === 0) &&
           job.status !== "assigned" && job.status !== "doing";
  }).sort((a, b) => {
    // If either date is null/empty, move it to the top
    if (!a.planLoadingDate && !b.planLoadingDate) return 0;
    if (!a.planLoadingDate) return -1;
    if (!b.planLoadingDate) return 1;

    // Compare dates based on sort direction
    const comparison = new Date(a.planLoadingDate) - new Date(b.planLoadingDate);
    return isAscending.value ? comparison : -comparison;
  });
});

// Other jobs (assigned, doing, done, etc.)
const otherJobs = computed(() => {
  return filteredJobs.value.filter(job => {
    // Consider a job non-pending if:
    // 1. It has a status of "assigned", "doing", or "done"
    // 2. It has a realUnloadingDate (completed)
    return (job.status === "assigned" || job.status === "doing" || 
            job.status === "done" || job.status === "completed") ||
           (job.realUnloadingDate && job.realUnloadingDate.length > 0);
  }).sort((a, b) => {
    // If either date is null/empty, move it to the top
    if (!a.planLoadingDate && !b.planLoadingDate) return 0;
    if (!a.planLoadingDate) return -1;
    if (!b.planLoadingDate) return 1;

    // Compare dates based on sort direction
    const comparison = new Date(a.planLoadingDate) - new Date(b.planLoadingDate);
    return isAscending.value ? comparison : -comparison;
  });
});

// Filtered other jobs based on status
const filteredOtherJobs = computed(() => {
  if (statusFilter.value === 'all') {
    return otherJobs.value;
  }
  
  return otherJobs.value.filter(job => {
    if (statusFilter.value === 'assigned') {
      return job.status === 'assigned';
    } else if (statusFilter.value === 'doing') {
      return job.status === 'doing';
    } else if (statusFilter.value === 'done') {
      return job.status === 'done' || job.status === 'completed' || 
             (job.realUnloadingDate && job.realUnloadingDate.length > 0);
    }
    return true;
  });
});

// Count jobs by status
const assignedJobsCount = computed(() => {
  return otherJobs.value.filter(job => job.status === "assigned").length;
});

const doingJobsCount = computed(() => {
  return otherJobs.value.filter(job => job.status === "doing").length;
});

const doneJobsCount = computed(() => {
  return otherJobs.value.filter(job => 
    job.status === "done" || job.status === "completed" || 
    (job.realUnloadingDate && job.realUnloadingDate.length > 0)
  ).length;
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

      <!-- Show job listings when done loading -->
      <div v-else>
        <!-- Pending Jobs Section -->
        <div v-if="pendingJobs.length > 0" class="mb-8">
          <div class="flex items-center mb-4 bg-yellow-50 p-3 rounded-lg shadow-sm">
            <i class="pi pi-clock text-yellow-500 mr-2 text-xl"></i>
            <h3 class="text-xl font-semibold text-yellow-600">
              Pending Jobs - Not Assigned
            </h3>
            <span class="ml-2 bg-yellow-200 text-yellow-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
              {{ pendingJobs.length }}
            </span>
          </div>
          <div class="grid grid-cols-1 gap-3">
            <JobListing v-for="job in pendingJobs" :key="job.id" :job="job" />
          </div>
        </div>

        <!-- Divider -->
        <div v-if="pendingJobs.length > 0 && otherJobs.length > 0" class="relative my-10">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-300"></div>
          </div>
          <div class="relative flex justify-center">
            <span class="bg-blue-50 px-4 text-sm text-gray-500">Other Jobs</span>
          </div>
        </div>

        <!-- Other Jobs Section -->
        <div v-if="otherJobs.length > 0">
          <div class="flex flex-col md:flex-row md:items-center mb-4 bg-blue-50 p-3 rounded-lg shadow-sm">
            <div class="flex items-center">
              <i class="pi pi-check-circle text-blue-500 mr-2 text-xl"></i>
              <h3 class="text-xl font-semibold text-blue-600">
                Active & Completed Jobs
              </h3>
              <span class="ml-2 bg-blue-200 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                {{ otherJobs.length }}
              </span>
            </div>
            
            <!-- Status counts and filters -->
            <div class="mt-2 md:mt-0 md:ml-auto flex flex-wrap gap-2">
              <button 
                @click="statusFilter = 'all'"
                class="text-xs font-medium px-2.5 py-1 rounded-full flex items-center transition-colors"
                :class="statusFilter === 'all' ? 'bg-blue-200 text-blue-800' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'"
              >
                <i class="pi pi-list text-blue-500 mr-1"></i>
                All
              </button>
              <button 
                @click="statusFilter = 'assigned'"
                class="text-xs font-medium px-2.5 py-1 rounded-full flex items-center transition-colors"
                :class="statusFilter === 'assigned' ? 'bg-purple-200 text-purple-800' : 'bg-purple-100 text-purple-800 hover:bg-purple-200'"
              >
                <i class="pi pi-tag text-purple-500 mr-1"></i>
                Assigned: {{ assignedJobsCount }}
              </button>
              <button 
                @click="statusFilter = 'doing'"
                class="text-xs font-medium px-2.5 py-1 rounded-full flex items-center transition-colors"
                :class="statusFilter === 'doing' ? 'bg-orange-200 text-orange-800' : 'bg-orange-100 text-orange-800 hover:bg-orange-200'"
              >
                <i class="pi pi-sync text-orange-500 mr-1"></i>
                In Progress: {{ doingJobsCount }}
              </button>
              <button 
                @click="statusFilter = 'done'"
                class="text-xs font-medium px-2.5 py-1 rounded-full flex items-center transition-colors"
                :class="statusFilter === 'done' ? 'bg-gray-200 text-gray-800' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'"
              >
                <i class="pi pi-check text-gray-500 mr-1"></i>
                Completed: {{ doneJobsCount }}
              </button>
            </div>
          </div>
          
          <!-- No results message when filtered -->
          <div v-if="filteredOtherJobs.length === 0" class="text-center text-gray-500 py-6 bg-white rounded-lg shadow-sm">
            <p>No jobs match the selected filter. Try a different filter.</p>
          </div>
          
          <!-- Job listings -->
          <div v-else class="grid grid-cols-1 gap-3">
            <JobListing v-for="job in filteredOtherJobs" :key="job.id" :job="job" />
          </div>
        </div>

        <!-- No Jobs Message -->
        <div v-if="pendingJobs.length === 0 && otherJobs.length === 0" class="text-center text-gray-500 py-6">
          <p>No jobs found. Try adjusting your filters or add a new job.</p>
        </div>
      </div>
    </div>
  </section>
</template>