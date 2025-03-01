<script setup>
import { RouterLink } from 'vue-router';
import { defineProps, ref, computed, watch, onMounted } from 'vue';
import { useToast } from 'vue-toastification';
import axios from 'axios';
import VueDatePicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css'
import { VueFinalModal } from 'vue-final-modal'
import 'vue-final-modal/style.css'

const props = defineProps({
  job: Object
});

const toast = useToast();

const showDetails = ref(false);
const showAssignModal = ref(false);
const trucks = ref([]);
const allJobs = ref([]);
const selectedTruck = ref(null);
const isLoading = ref(false);

onMounted(async () => {
  await fetchTrucks();
});

const fetchTrucks = async () => {
  try {
    const [trucksResponse, jobsResponse] = await Promise.all([
      axios.get('/api/trucks'),
      axios.get('/api/jobs')
    ]);
    trucks.value = trucksResponse.data;
    allJobs.value = jobsResponse.data;
  } catch (error) {
    console.error('Error fetching data:', error);
    toast.error('Failed to fetch data. Please try again.');
  }
};

const toggleDetails = () => {
  showDetails.value = !showDetails.value;
};

const openAssignModal = () => {
  showAssignModal.value = true;
};

const closeAssignModal = () => {
  showAssignModal.value = false;
  selectedTruck.value = null;
};

const assignJobToTruck = async () => {
  if (!selectedTruck.value) {
    toast.error('Please select a truck first');
    return;
  }
  
  isLoading.value = true;
  
  try {
    // Get current truck data and all jobs for comparison
    const truckResponse = await axios.get(`/api/trucks/${selectedTruck.value}`);
    const truck = truckResponse.data;
    const jobsResponse = await axios.get('/api/jobs');
    const allJobs = jobsResponse.data;
    
    // Find current job data if exists
    const currentJobData = truck.currentJob ? allJobs.find(job => job.id === truck.currentJob) : null;
    const newJobData = props.job;
    
    let updatedTruck = { ...truck };
    let newJobStatus = "assigned";
    
    // Determine job placement based on dates and current job
    if (!truck.currentJob) {
      // If no current job, assign directly
      updatedTruck.currentJob = newJobData.id;
      newJobStatus = "doing";
    } else {
      // Compare dates to decide placement
      const currentJobDate = currentJobData?.planLoadingDate ? new Date(currentJobData.planLoadingDate) : null;
      const newJobDate = newJobData?.planLoadingDate ? new Date(newJobData.planLoadingDate) : null;
      
      if (currentJobDate && newJobDate && newJobDate < currentJobDate) {
        // If new job starts earlier, move current job to queue
        updatedTruck.nextJobQueue = [truck.currentJob, ...truck.nextJobQueue];
        updatedTruck.currentJob = newJobData.id;
        newJobStatus = "doing";
        
        // Update status of the previous current job
        if (currentJobData && currentJobData.status === "doing") {
          await axios.put(`/api/jobs/${currentJobData.id}`, {
            ...currentJobData,
            status: "assigned",
            lastUpdate: new Date().toISOString()
          });
        }
      } else {
        // Add to queue if new job starts later
        updatedTruck.nextJobQueue = [...truck.nextJobQueue, newJobData.id];
      }
    }
    
    // Sort nextJobQueue by planLoadingDate if it exists
    if (updatedTruck.nextJobQueue && updatedTruck.nextJobQueue.length > 0) {
      const sortedQueue = [...updatedTruck.nextJobQueue];
      sortedQueue.sort((a, b) => {
        const jobA = allJobs.find(job => job.id === a);
        const jobB = allJobs.find(job => job.id === b);
        
        if (!jobA?.planLoadingDate) return 1;
        if (!jobB?.planLoadingDate) return -1;
        
        return new Date(jobA.planLoadingDate) - new Date(jobB.planLoadingDate);
      });
      
      updatedTruck.nextJobQueue = sortedQueue;
    }
    
    // Update truck data
    await axios.put(`/api/trucks/${selectedTruck.value}`, updatedTruck);
    
    // Update new job status
    if (props.job.status !== "doing") {
      const updatedJob = {
        ...props.job,
        status: newJobStatus,
        lastUpdate: new Date().toISOString()
      };
      
      await axios.put(`/api/jobs/${props.job.id}`, updatedJob);
      Object.assign(props.job, updatedJob);
    }
    
    const actionText = newJobStatus === "doing" ? "set as current job" : "added to queue";
    toast.success(`Job successfully ${actionText} for truck ${truck.plateNumber}`);
    closeAssignModal();
    
  } catch (error) {
    console.error('Error assigning job to truck:', error);
    toast.error('Failed to assign job to truck. Please try again.');
  } finally {
    isLoading.value = false;
  }
};

const formatDate = (date) => {
  if (!date) return 'Not set';
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day}.${month}.${year} ${hours}:${minutes}`;
};

const formatDateOnly = (date) => {
  if (!date) return 'Not set';
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
};

// New function for short date format (dd.mm only)
const formatDateShort = (date) => {
  if (!date) return 'Not set';
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}.${month}`;
};

// Update the jobStatus computed property
const jobStatus = computed(() => {
  // If job has a realUnloadingDate, it's completed
  if (props.job.realUnloadingDate && props.job.realUnloadingDate.length) {
    return "completed";
  }
  
  // If job is assigned to a truck
  if (assignedTruck.value) {
    // Return the job's position (current or queued)
    return assignedTruck.value.currentJob === props.job.id ? "Current Job" : "In Queue";
  }
  
  // If no assignment, it's pending
  return "pending";
});

// Add new computed property to check if job is assigned to any truck
const assignedTruck = computed(() => {
  return trucks.value.find(truck => 
    truck.currentJob === props.job.id || 
    truck.nextJobQueue.includes(props.job.id)
  );
});

// Add new computed property for button text
const assignButtonText = computed(() => {
  return assignedTruck.value ? 'Change Truck' : 'Assign Truck';
});

// Add new computed property to get jobs data for trucks
const jobsForTrucks = computed(() => {
  const jobsMap = {};
  trucks.value.forEach(truck => {
    if (truck.currentJob) {
      const job = allJobs.value.find(j => j.id === truck.currentJob);
      jobsMap[truck.id] = job;
    }
  });
  return jobsMap;
});
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-1 gap-6">
    <!-- Job Listing Card - Entire card is clickable -->
    <div 
      @click="toggleDetails"
      class="rounded-xl shadow-md relative cursor-pointer hover:shadow-lg transition-shadow"
      :class="{
        'bg-white': !job.realLoadingDate || !job.realLoadingDate.length,
        'bg-green-100': job.realLoadingDate && job.realLoadingDate.length && (!job.realUnloadingDate || !job.realUnloadingDate.length),
        'bg-gray-300': job.realLoadingDate && job.realLoadingDate.length && job.realUnloadingDate && job.realUnloadingDate.length
      }"
    >
      <div class="p-2"> <!-- card padding -->
        <!-- Desktop Layout (md and up) - Single line -->
        <div class="hidden md:grid grid-cols-12 gap-2 items-center">
          <!-- First column: Loading date (fixed width) -->
          <div class="col-span-2 flex items-center">
            <i class="pi pi-arrow-down text-blue-500 mr-1 flex-shrink-0"></i>
            <span :class="{ 'font-bold': job.isLoadingDateStrict }" class="text-xs whitespace-nowrap">
              {{ formatDateShort(job.planLoadingDate) }}
              {{ job.isLoadingDateStrict ? '❗' : '' }}
            </span>
          </div>
          
          <!-- Second column: Unloading date (fixed width) -->
          <div class="col-span-2 flex items-center">
            <i class="pi pi-arrow-up text-green-500 mr-1 flex-shrink-0"></i>
            <span :class="{ 'font-bold': job.isUnloadingDateStrict }" class="text-xs whitespace-nowrap">
              {{ formatDateShort(job.planUnloadingDate) }}
              {{ job.isUnloadingDateStrict ? '❗' : '' }}
            </span>
          </div>
          
          <!-- Third column: Client name (fixed width) -->
          <div class="col-span-3 flex items-center">
            <div 
              v-if="jobStatus" 
              class="w-2 h-2 rounded-full mr-2 flex-shrink-0"
              :class="{
                'bg-yellow-300': jobStatus === 'pending',
                'bg-blue-400': jobStatus === 'In Queue',
                'bg-green-500': jobStatus === 'Current Job',
                'bg-gray-500': jobStatus === 'completed'
              }"
            ></div>
            <h3 class="text-sm font-bold text-green-600 truncate">
              {{ job.client.length > 12 ? job.client.substring(0, 12) + '...' : job.client }}
            </h3>
          </div>
          
          <!-- Fourth column: Locations (flexible width) -->
          <div class="col-span-4 flex items-center text-xs text-gray-600">
            <span class="truncate max-w-[45%]">{{ job.startlocationCity }}</span>
            <i class="pi pi-arrow-right text-xs mx-1 flex-shrink-0"></i>
            <span class="truncate max-w-[45%]">{{ job.destinationCity }}</span>
          </div>
          
          <!-- Fifth column: Expand/Collapse button -->
          <div class="col-span-1 flex justify-end">
            <i 
              :class="[
                showDetails ? 'pi pi-chevron-up' : 'pi pi-chevron-down',
                'text-blue-500 text-xl transition-transform'
              ]"
            ></i>
          </div>
        </div>
        
        <!-- Mobile Layout (sm and down) - Two lines -->
        <div class="md:hidden">
          <!-- First row: Dates, Client, and Button -->
          <div class="grid grid-cols-12 gap-1 items-center">
            <!-- First column: Loading date (fixed width) -->
            <div class="col-span-3 flex items-center">
              <i class="pi pi-arrow-down text-blue-500 mr-1 flex-shrink-0"></i>
              <span :class="{ 'font-bold': job.isLoadingDateStrict }" class="text-xs whitespace-nowrap">
                {{ formatDateShort(job.planLoadingDate) }}
                {{ job.isLoadingDateStrict ? '❗' : '' }}
              </span>
            </div>
            
            <!-- Second column: Unloading date (fixed width) -->
            <div class="col-span-3 flex items-center">
              <i class="pi pi-arrow-up text-green-500 mr-1 flex-shrink-0"></i>
              <span :class="{ 'font-bold': job.isUnloadingDateStrict }" class="text-xs whitespace-nowrap">
                {{ formatDateShort(job.planUnloadingDate) }}
                {{ job.isUnloadingDateStrict ? '❗' : '' }}
              </span>
            </div>
            
            <!-- Third column: Client name (fixed width) -->
            <div class="col-span-5 flex items-center">
              <div 
                v-if="jobStatus" 
                class="w-2 h-2 rounded-full mr-2 flex-shrink-0"
                :class="{
                  'bg-yellow-300': jobStatus === 'pending',
                  'bg-blue-400': jobStatus === 'In Queue',
                  'bg-green-500': jobStatus === 'Current Job',
                  'bg-gray-500': jobStatus === 'completed'
                }"
              ></div>
              <h3 class="text-sm font-bold text-green-600 truncate">
                {{ job.client.length > 10 ? job.client.substring(0, 10) + '...' : job.client }}
              </h3>
            </div>
            
            <!-- Fourth column: Expand/Collapse button -->
            <div class="col-span-1 flex justify-end">
              <i 
                :class="[
                  showDetails ? 'pi pi-chevron-up' : 'pi pi-chevron-down',
                  'text-blue-500 text-xl transition-transform'
                ]"
              ></i>
            </div>
          </div>
          
          <!-- Second row: Locations only -->
          <div class="mt-1 flex items-center text-xs text-gray-600">
            <span class="truncate max-w-[45%]">{{ job.startlocationCity }}</span>
            <i class="pi pi-arrow-right text-xs mx-1 flex-shrink-0"></i>
            <span class="truncate max-w-[45%]">{{ job.destinationCity }}</span>
          </div>
        </div>

        <!-- Extended Details - Shown when showDetails is true -->
        <div v-if="showDetails" class="mt-1">
          <div class="border-t border-gray-100 pt-1">
            <!-- Job Type and ID -->
            <div class="mb-2 flex justify-between items-center">
              <span class="text-gray-600">{{ job.type }}</span>
              <span class="text-sm text-gray-500">ID: {{ job.id }}</span>
            </div>

            <!-- Status Field -->
            <div class="mb-3 flex items-center">
              <i class="pi pi-tag text-blue-500 mr-2"></i>
              <span class="font-semibold mr-2">Status:</span>
              <span class="px-2 py-1 rounded-full text-xs" 
                :class="{
                  'bg-yellow-100 text-yellow-700': jobStatus === 'pending',
                  'bg-blue-100 text-blue-700': jobStatus === 'In Queue',
                  'bg-green-100 text-green-700': jobStatus === 'Current Job',
                  'bg-gray-200 text-gray-700': jobStatus === 'completed'
                }">
                {{ jobStatus }}
              </span>
            </div>

            <!-- Assigned Truck Information -->
            <div v-if="assignedTruck" class="mb-3 flex items-center">
              <i class="pi pi-truck text-blue-500 mr-2"></i>
              <span class="font-semibold mr-2">Assigned Truck:</span>
              <div class="flex flex-col">
                <span class="text-sm font-medium text-gray-700">{{ assignedTruck.plateNumber }}</span>
                <span class="text-xs text-gray-500">{{ assignedTruck.type }}</span>
              </div>
            </div>

            <!-- Delivered By Information (for completed jobs) -->
            <div v-if="job.deliveredBy && jobStatus === 'completed'" class="mb-3 flex items-center">
              <i class="pi pi-check-circle text-green-500 mr-2"></i>
              <span class="font-semibold mr-2">Delivered By:</span>
              <div class="flex flex-col">
                <span class="text-sm font-medium text-gray-700">{{ job.deliveredBy }}</span>
                <span class="text-xs text-gray-500">Completed on {{ formatDateOnly(job.realUnloadingDate) }}</span>
              </div>
            </div>

            <!-- Cargo Information -->
            <div class="mb-4">
              <div class="flex items-center gap-2 mb-2">
                <i class="pi pi-box text-orange-500"></i>
                <span class="font-semibold">{{ job.cargoName }}</span>
              </div>
              <p class="text-sm text-gray-600">{{ job.cargoDescription }}</p>
            </div>

            <!-- Dates Grid -->
            <div class="grid grid-cols-2 gap-4 mb-4">
              <div class="text-sm">
                <div class="text-gray-600">
                  <div class="flex items-center gap-1">
                    <i class="pi pi-arrow-down text-blue-500"></i>
                    <span class="font-semibold">Real Loading:</span>
                  </div>
                  <div :class="{ 'text-gray-600': !job.realLoadingDate }">
                    {{ job.realLoadingDate ? formatDateShort(job.realLoadingDate) : 'Pending' }}
                  </div>
                </div>
              </div>
              <div class="text-sm">
                <div class="text-gray-600">
                  <div class="flex items-center gap-1">
                    <i class="pi pi-arrow-up text-green-500"></i>
                    <span class="font-semibold">Real Unloading:</span>
                  </div>
                  <div :class="{ 'text-gray-600': !job.realUnloadingDate }">
                    {{ job.realUnloadingDate ? formatDateShort(job.realUnloadingDate) : 'Pending' }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Route Information -->
            <div class="flex items-center justify-between mb-4">
              <div class="text-orange-700">
                <i class="pi pi-map-marker mr-1"></i>
                {{ job.startlocationCity }}, {{ job.startlocationCountry }}
              </div>
              <div class="text-orange-700 mx-2">
                <i class="pi pi-arrow-right"></i>
              </div>
              <div class="text-orange-700">
                {{ job.destinationCity }}, {{ job.destinationCountry }}
                <i class="pi pi-map-marker ml-1"></i>
              </div>
            </div>

            <!-- Footer -->
            <div class="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
              <div class="text-xs text-gray-500">
                Added: {{ formatDateShort(job.addDate) }}
              </div>
              <div class="flex gap-2">
                <button
                  @click.stop="openAssignModal"
                  class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm"
                >
                  {{ assignButtonText }}
                </button>
                <RouterLink
                  :to="'/jobs/' + job.id"
                  class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm"
                  @click.stop
                >
                  Job Details
                </RouterLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Assign Truck Modal -->
    <VueFinalModal
      v-model="showAssignModal"
      classes="flex justify-center items-center"
      content-class="relative mx-4 p-4 bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-auto"
      @click-outside="closeAssignModal"
    >
      <div class="flex flex-col">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-bold">{{ assignButtonText }}</h3>
          <button @click="closeAssignModal" class="text-gray-500 hover:text-gray-700">
            <i class="pi pi-times"></i>
          </button>
        </div>
        
        <div class="mb-4">
          <!-- Show current assignment if exists -->
          <div v-if="assignedTruck" class="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div class="text-sm text-blue-700 font-medium mb-2">Currently assigned to:</div>
            <div class="flex justify-between items-start">
              <div>
                <div class="font-semibold">{{ assignedTruck.plateNumber }}</div>
                <div class="text-xs text-gray-600">{{ assignedTruck.type }}</div>
                <div class="text-xs text-gray-500 mt-1">
                  <template v-if="assignedTruck.currentJob">
                    <span class="text-green-600">Current job: {{ jobsForTrucks[assignedTruck.id]?.client || 'Loading...' }}</span>
                  </template>
                  <template v-else>
                    <span class="text-gray-600">No current job</span>
                  </template>
                </div>
              </div>
              <div class="text-xs text-gray-500">
                <div>Jobs in queue: {{ assignedTruck.nextJobQueue.length }}</div>
                <div class="mt-1" :class="{
                  'text-orange-600': assignedTruck.currentJob === props.job.id,
                  'text-purple-600': assignedTruck.nextJobQueue.includes(props.job.id)
                }">
                  {{ assignedTruck.currentJob === props.job.id ? 'Current Job' : 'In Queue' }}
                </div>
              </div>
            </div>
          </div>

          <p class="text-sm text-gray-600 mb-2">
            {{ assignedTruck ? 'Select a new truck to reassign this job:' : 'Select a truck to assign this job to:' }}
          </p>
          
          <div class="max-h-[50vh] overflow-y-auto border border-gray-200 rounded-lg">
            <div 
              v-for="truck in trucks" 
              :key="truck.id"
              @click="selectedTruck = truck.id"
              class="p-3 border-b border-gray-200 last:border-b-0 cursor-pointer transition-colors"
              :class="{
                'bg-blue-50': selectedTruck === truck.id,
                'bg-gray-100': truck.id === assignedTruck?.id,
                'hover:bg-gray-50': truck.id !== assignedTruck?.id,
                'opacity-50': truck.id === assignedTruck?.id && !selectedTruck
              }"
            >
              <div class="flex justify-between items-center">
                <div>
                  <div class="font-semibold">{{ truck.plateNumber }}</div>
                  <div class="text-xs text-gray-600">{{ truck.type }}</div>
                  <div class="text-xs mt-1">
                    <template v-if="truck.currentJob">
                      <span class="text-green-600">Current job: {{ jobsForTrucks[truck.id]?.client || 'Loading...' }}</span>
                    </template>
                    <template v-else>
                      <span class="text-gray-600">No current job</span>
                    </template>
                  </div>
                </div>
                <div class="text-xs text-gray-500">
                  <div>Jobs in queue: {{ truck.nextJobQueue.length }}</div>
                  <div v-if="truck.id === assignedTruck?.id" class="mt-1 text-blue-600 font-medium">
                    Currently Assigned
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="flex justify-end gap-2">
          <button 
            @click="closeAssignModal"
            class="px-4 py-2 border border-gray-300 rounded-lg text-sm"
          >
            Cancel
          </button>
          <button 
            @click="assignJobToTruck"
            class="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm"
            :disabled="isLoading || !selectedTruck || selectedTruck === assignedTruck?.id"
            :class="{ 'opacity-50 cursor-not-allowed': isLoading || !selectedTruck || selectedTruck === assignedTruck?.id }"
          >
            <span v-if="isLoading">{{ assignedTruck ? 'Reassigning...' : 'Assigning...' }}</span>
            <span v-else>{{ assignedTruck ? 'Reassign' : 'Assign' }}</span>
          </button>
        </div>
      </div>
    </VueFinalModal>
  </div>
</template>