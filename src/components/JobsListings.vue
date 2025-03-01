<script setup>
import { RouterLink } from 'vue-router';
import JobListing from './JobListing.vue';
import Divider from './Divider.vue';
import { reactive, defineProps, onMounted, computed, ref } from 'vue';
import PulseLoader from 'vue-spinner/src/PulseLoader.vue';
import axios from 'axios';

const state = reactive({
  jobs: [],
  isLoading: true,
});

// Add section-specific sorting controls
const pendingSortAscending = ref(true);
const activeSortAscending = ref(true);
const completedSortAscending = ref(false); // Default newest first for completed jobs

// Add status filter
const statusFilter = ref('all'); // 'all', 'assigned', 'doing'

// Add toggle for completed jobs section
const showCompletedSection = ref(false);
const showAllCompleted = ref(false);
const completedJobsLimit = 5; // Show only 5 completed jobs initially

// Pending jobs (not assigned)
const pendingJobs = computed(() => {
  return state.jobs.filter(job => {
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
    return pendingSortAscending.value ? comparison : -comparison;
  });
});

// Active jobs (assigned or doing, but not completed)
const activeJobs = computed(() => {
  return state.jobs.filter(job => {
    // Consider a job active if:
    // 1. It has a status of "assigned" or "doing"
    // 2. It doesn't have a realUnloadingDate (not done)
    return (job.status === "assigned" || job.status === "doing") &&
           (!job.realUnloadingDate || job.realUnloadingDate.length === 0);
  }).sort((a, b) => {
    // If either date is null/empty, move it to the top
    if (!a.planLoadingDate && !b.planLoadingDate) return 0;
    if (!a.planLoadingDate) return -1;
    if (!b.planLoadingDate) return 1;

    // Compare dates based on sort direction
    const comparison = new Date(a.planLoadingDate) - new Date(b.planLoadingDate);
    return activeSortAscending.value ? comparison : -comparison;
  });
});

// Completed jobs
const completedJobs = computed(() => {
  return state.jobs.filter(job => {
    // Consider a job completed if:
    // 1. It has a status of "done" or "completed"
    // 2. It has a realUnloadingDate
    return job.status === "done" || job.status === "completed" || 
           (job.realUnloadingDate && job.realUnloadingDate.length > 0);
  }).sort((a, b) => {
    // For completed jobs, sort by realUnloadingDate
    if (!a.realUnloadingDate && !b.realUnloadingDate) return 0;
    if (!a.realUnloadingDate) return 1;
    if (!b.realUnloadingDate) return -1;

    // Compare dates based on sort direction
    const comparison = new Date(a.realUnloadingDate) - new Date(b.realUnloadingDate);
    return completedSortAscending.value ? comparison : -comparison;
  });
});

// Filtered active jobs based on status
const filteredActiveJobs = computed(() => {
  if (statusFilter.value === 'all') {
    return activeJobs.value;
  }
  
  return activeJobs.value.filter(job => {
    if (statusFilter.value === 'assigned') {
      return job.status === 'assigned';
    } else if (statusFilter.value === 'doing') {
      return job.status === 'doing';
    }
    return true;
  });
});

// Count jobs by status
const assignedJobsCount = computed(() => {
  return activeJobs.value.filter(job => job.status === "assigned").length;
});

const doingJobsCount = computed(() => {
  return activeJobs.value.filter(job => job.status === "doing").length;
});

// Toggle functions
const togglePendingSort = () => {
  pendingSortAscending.value = !pendingSortAscending.value;
};

const toggleActiveSort = () => {
  activeSortAscending.value = !activeSortAscending.value;
};

const toggleCompletedSort = () => {
  completedSortAscending.value = !completedSortAscending.value;
};

const toggleCompletedSection = () => {
  showCompletedSection.value = !showCompletedSection.value;
  // Reset the show all flag when toggling the section
  if (!showCompletedSection.value) {
    showAllCompleted.value = false;
  }
};

const toggleShowAllCompleted = () => {
  showAllCompleted.value = !showAllCompleted.value;
};

// Limited completed jobs for initial display
const limitedCompletedJobs = computed(() => {
  if (showAllCompleted.value) {
    return completedJobs.value;
  }
  return completedJobs.value.slice(0, completedJobsLimit);
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
  <section class="bg-blue-50 px-4 py-10 pb-24">
    <div class="container-xl lg:container m-auto">
      <div class="flex justify-between md:justify-center items-center relative mb-6">
        <h2 class="text-2xl md:text-3xl font-bold text-green-500 md:absolute md:left-1/2 md:transform md:-translate-x-1/2">
        Zamówienia
      </h2>
        <div class="md:ml-auto">
        <RouterLink 
          to="/jobs/add"
            class="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-3 shadow-lg transition-all hover:shadow-xl hover:scale-105 flex items-center justify-center"
            title="Add New Job"
        >
            <i class="pi pi-plus-circle text-2xl"></i>
            <span class="ml-2 font-medium hidden md:inline">Add Job</span>
        </RouterLink>
        </div>
      </div>

      <!-- Show loading spinner while loading is true -->
      <div v-if="state.isLoading" class="text-center text-gray-500 py-6">
        <PulseLoader />
      </div>

      <!-- Show job listings when done loading -->
      <div v-else>
        <!-- Pending Jobs Section -->
        <div v-if="pendingJobs.length > 0" class="mb-8">
          <div class="flex items-center justify-between mb-4 bg-yellow-50 p-3 rounded-lg shadow-sm">
            <div class="flex items-center">
              <i class="pi pi-clock text-yellow-500 mr-2 text-xl"></i>
              <h3 class="text-xl font-semibold text-yellow-600">
                Not Assigned
              </h3>
              <span class="ml-2 bg-yellow-200 text-yellow-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                {{ pendingJobs.length }}
              </span>
            </div>
            <button 
              @click="togglePendingSort" 
              class="text-xs text-gray-600 hover:text-gray-800 flex items-center gap-1 px-2 py-1 rounded hover:bg-yellow-100 transition-colors"
              title="Toggle sort order"
            >
              <span>{{ pendingSortAscending ? 'Oldest first' : 'Newest first' }}</span>
              <i :class="[
                pendingSortAscending ? 'pi pi-sort-amount-up' : 'pi pi-sort-amount-down',
                'text-xs'
              ]"></i>
            </button>
          </div>
          <div class="grid grid-cols-1 gap-3">
            <JobListing v-for="job in pendingJobs" :key="job.id" :job="job" />
          </div>
        </div>

        <!-- Divider for Active Jobs -->
        <Divider 
          v-if="pendingJobs.length > 0 && activeJobs.length > 0" 
          title="Active Jobs"
          bgColor="bg-blue-50"
          marginY="my-0"
        />

        <!-- Active Jobs Section -->
        <div v-if="activeJobs.length > 0" class="mb-8">
          <div class="flex flex-col md:flex-row md:items-center mb-4 bg-blue-50 p-3 rounded-lg shadow-sm">
            <div class="flex items-center">
              <i class="pi pi-check-circle text-blue-500 mr-2 text-xl"></i>
              <h3 class="text-xl font-semibold text-blue-600">
                Active Jobs
              </h3>
              <span class="ml-2 bg-blue-200 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                {{ activeJobs.length }}
              </span>
            </div>
            
            <div class="mt-2 md:mt-0 md:ml-auto flex flex-wrap items-center gap-2">
              <!-- Status counts and filters -->
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
                :class="statusFilter === 'assigned' ? 'bg-blue-200 text-blue-800' : 'bg-blue-100 text-blue-800 hover:bg-blue-200'"
              >
                <i class="pi pi-tag text-blue-500 mr-1"></i>
                Assigned: {{ assignedJobsCount }}
              </button>
              <button 
                @click="statusFilter = 'doing'"
                class="text-xs font-medium px-2.5 py-1 rounded-full flex items-center transition-colors"
                :class="statusFilter === 'doing' ? 'bg-green-200 text-green-800' : 'bg-green-100 text-green-800 hover:bg-green-200'"
              >
                <i class="pi pi-sync text-green-500 mr-1"></i>
                Doing: {{ doingJobsCount }}
              </button>
              
              <!-- Status filter divider -->
              <div class="h-4 border-l border-gray-300 mx-1 hidden md:block"></div>
              
              <!-- Sort control (moved after filters) -->
              <button 
                @click="toggleActiveSort" 
                class="text-xs text-gray-600 hover:text-gray-800 flex items-center gap-1 px-2 py-1 rounded hover:bg-blue-100 transition-colors"
                title="Toggle sort order"
              >
                <span>{{ activeSortAscending ? 'Oldest first' : 'Newest first' }}</span>
                <i :class="[
                  activeSortAscending ? 'pi pi-sort-amount-up' : 'pi pi-sort-amount-down',
                  'text-xs'
                ]"></i>
              </button>
            </div>
          </div>
          
          <!-- No results message when filtered -->
          <div v-if="filteredActiveJobs.length === 0" class="text-center text-gray-500 py-6 bg-white rounded-lg shadow-sm">
            <p>No jobs match the selected filter. Try a different filter.</p>
          </div>
          
          <!-- Job listings -->
      <div v-else class="grid grid-cols-1 gap-3">
            <JobListing v-for="job in filteredActiveJobs" :key="job.id" :job="job" />
          </div>
        </div>

        <!-- Divider for Completed Jobs -->
        <Divider 
          v-if="completedJobs.length > 0" 
          title="Completed Jobs"
          :count="completedJobs.length"
          bgColor="bg-blue-50"
          expandable
          :expanded="showCompletedSection"
          marginY="my-6"
          @toggle="toggleCompletedSection"
        />

        <!-- Completed Jobs Section -->
        <div v-if="completedJobs.length > 0 && showCompletedSection" class="mb-12">
          <div class="flex items-center justify-between mb-4 bg-gray-50 p-3 rounded-lg shadow-sm">
            <div class="flex items-center">
              <i class="pi pi-check-square text-gray-500 mr-2 text-xl"></i>
              <h3 class="text-xl font-semibold text-gray-600">
                Completed Jobs
              </h3>
              <span class="ml-2 bg-gray-200 text-gray-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                {{ completedJobs.length }}
              </span>
            </div>
            <button 
              @click="toggleCompletedSort" 
              class="text-xs text-gray-600 hover:text-gray-800 flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-200 transition-colors"
              title="Toggle sort order"
            >
              <span>{{ completedSortAscending ? 'Oldest first' : 'Newest first' }}</span>
              <i :class="[
                completedSortAscending ? 'pi pi-sort-amount-up' : 'pi pi-sort-amount-down',
                'text-xs'
              ]"></i>
            </button>
          </div>
          <div class="grid grid-cols-1 gap-3">
            <JobListing v-for="job in limitedCompletedJobs" :key="job.id" :job="job" />
          </div>
          
          <!-- Show All / Show Less button -->
          <div v-if="completedJobs.length > completedJobsLimit" class="mt-4 text-center">
            <button 
              @click="toggleShowAllCompleted" 
              class="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            >
              <span v-if="showAllCompleted">
                <i class="pi pi-chevron-up mr-1"></i>
                Show Less
              </span>
              <span v-else>
                <i class="pi pi-chevron-down mr-1"></i>
                Show All {{ completedJobs.length }} Completed Jobs
              </span>
            </button>
          </div>
        </div>

        <!-- No Jobs Message -->
        <div v-if="pendingJobs.length === 0 && activeJobs.length === 0 && completedJobs.length === 0" class="text-center text-gray-500 py-6">
          <p>No jobs found. Add a new job to get started.</p>
        </div>
      </div>
    </div>
  </section>
</template>