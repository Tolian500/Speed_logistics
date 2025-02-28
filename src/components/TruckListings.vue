<script setup>
import { RouterLink } from 'vue-router';
import TruckListing from './TruckListing.vue';
import { reactive, defineProps, onMounted } from 'vue';
import PulseLoader from 'vue-spinner/src/PulseLoader.vue';
import axios from 'axios';

defineProps({
  limit: Number,
  showButton: {
    type: Boolean,
    default: false,
  },
});

const state = reactive({
  trucks: [],
  jobs: [],
  isLoading: true,
});

// Function to fetch and process data
const fetchData = async () => {
  state.isLoading = true;
  
  try {
    const [trucksResponse, jobsResponse] = await Promise.all([
      axios.get('/api/trucks'),
      axios.get('/api/jobs')
    ]);
    
    state.trucks = trucksResponse.data;
    
    // Process jobs to ensure correct status
    state.jobs = jobsResponse.data.map(job => {
      // If job has a realUnloadingDate, it should be marked as "done"
      if (job.realUnloadingDate && job.realUnloadingDate.length) {
        return { ...job, status: "done" };
      }
      
      // If job is in any truck's currentJob, it should be "doing"
      const isCurrentJob = state.trucks.some(truck => truck.currentJob === job.id);
      if (isCurrentJob && job.status !== "done") {
        return { ...job, status: "doing" };
      }
      
      // If job is in any truck's nextJobQueue, it should be "assigned" (unless it's already "doing")
      const isInQueue = state.trucks.some(truck => 
        truck.nextJobQueue && truck.nextJobQueue.includes(job.id)
      );
      if (isInQueue && job.status !== "doing" && job.status !== "done") {
        return { ...job, status: "assigned" };
      }
      
      return job;
    });
    
    // Attach job data to each truck
    state.trucks = state.trucks.map(truck => {
      // Get current job data
      const currentJobData = state.jobs.find(job => job.id === truck.currentJob);
      
      // Get next job data (if exists)
      let nextJobData = null;
      let nextJobQueueData = [];
      
      if (truck.nextJobQueue && truck.nextJobQueue.length > 0) {
        // Get the first job in the queue as the next job
        const nextJobId = truck.nextJobQueue[0];
        nextJobData = state.jobs.find(job => job.id === nextJobId);
        
        // Get all jobs in the queue
        nextJobQueueData = truck.nextJobQueue.map(jobId => {
          return state.jobs.find(job => job.id === jobId);
        }).filter(job => job !== undefined);
      }
      
      return {
        ...truck,
        currentJobData,
        nextJobData,
        nextJobQueueData
      };
    });
  } catch (error) {
    console.error('Error fetching data', error);
  } finally {
    state.isLoading = false;
  }
};

// Handler for job-completed event
const handleJobCompleted = () => {
  // Refresh the data when a job is completed
  fetchData();
};

onMounted(fetchData);
</script>

<template>
  <section class="bg-blue-50 px-4 py-10">
    <div class="container-xl lg:container m-auto">
      <h2 class="text-3xl font-bold text-green-500 mb-6 text-center">
        Flota pojazdów
      </h2>
      <!-- Show loading spinner while loading is true -->
      <div v-if="state.isLoading" class="text-center text-gray-500 py-6">
        <PulseLoader />
      </div>

      <!-- Show truck and job listings when done loading -->
      <div v-else class="grid grid-cols-1 gap-3">
        <TruckListing
          v-for="truck in state.trucks.slice(0, limit || state.trucks.length)"
          :key="truck.id"
          :truck="truck"
          :job="truck.currentJobData"
          :nextJob="truck.nextJobData"
          :nextJobQueue="truck.nextJobQueueData"
          @job-completed="handleJobCompleted"
        />
      </div>
    </div>
  </section>
</template>
