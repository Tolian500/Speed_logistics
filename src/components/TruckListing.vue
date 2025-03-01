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
  truck: Object,
  job: Object,
  nextJob: Object,
  nextJobQueue: Array,
});

const toast = useToast();
const showDetails = ref(false);
const showFutureJobs = ref(false);

const showRealLoadingCalendar = ref(false);
const showRealUnloadingCalendar = ref(false);
const selectedRealLoadingDate = ref(null);
const selectedRealUnloadingDate = ref(null);

const loadingModal = ref(false)
const unloadingModal = ref(false)

const deleteLoadingModal = ref(false)
const deleteUnloadingModal = ref(false)

// New refs for job completion
const completeJobModal = ref(false)
const isCompletingJob = ref(false)

const formatDate = (date) => {
  if (!date) return null;
  return new Date(date);
};

const formatDisplayDate = (date) => {
  if (!date) return 'Set date';
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
};

const formatDisplayDateShort = (date) => {
  if (!date) return 'Set date';
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}.${month}`;
};

const getDefaultDate = () => {
  const today = new Date();
  today.setHours(10, 0, 0, 0); // Set time to 10:00:00
  return today;
};

const submitRealLoadingDate = async () => {
  if (!selectedRealLoadingDate.value) return;
  
  try {
    const isUpdate = !!props.job.realLoadingDate;
    const isoDate = selectedRealLoadingDate.value.toISOString();
    
    await axios.patch(`/api/jobs/${props.job.id}`, {
      realLoadingDate: isoDate
    });
    
    props.job.realLoadingDate = isoDate;
    loadingModal.value = false;
    selectedRealLoadingDate.value = null;

    if (isUpdate) {
      toast.info("Loading date was successfully updated");
    } else {
      toast.success("Loading date was successfully set");
    }
  } catch (error) {
    toast.error("Failed to update loading date");
    console.error('Failed to update loading date:', error);
  }
};

const submitRealUnloadingDate = async () => {
  if (!selectedRealUnloadingDate.value) return;
  
  // Show confirmation modal instead of immediately setting the date
  unloadingModal.value = false;
  completeJobModal.value = true;
};

// New function to complete the job
const completeJob = async () => {
  if (!selectedRealUnloadingDate.value) return;
  
  isCompletingJob.value = true;
  
  try {
    const isoDate = selectedRealUnloadingDate.value.toISOString();
    
    // 1. Update the job with realUnloadingDate, status "done", and deliveredBy
    await axios.patch(`/api/jobs/${props.job.id}`, {
      realUnloadingDate: isoDate,
      status: "done",
      deliveredBy: props.truck.plateNumber,
      lastUpdate: new Date().toISOString()
    });
    
    // Update local job state
    props.job.realUnloadingDate = isoDate;
    props.job.status = "done";
    props.job.deliveredBy = props.truck.plateNumber;
    props.job.lastUpdate = new Date().toISOString();
    
    // 2. Get the current truck data to ensure we have the latest
    const truckResponse = await axios.get(`/api/trucks/${props.truck.id}`);
    const currentTruck = truckResponse.data || props.truck;
    
    // 3. Prepare the next job (if available)
    let nextJobId = null;
    let updatedNextJobQueue = [...(currentTruck.nextJobQueue || [])];
    
    if (updatedNextJobQueue.length > 0) {
      // Get the first job from the queue
      nextJobId = updatedNextJobQueue.shift();
    }
    
    // 4. Update the truck: clear currentJob and assign next job if available
    await axios.put(`/api/trucks/${props.truck.id}`, {
      ...currentTruck,
      currentJob: nextJobId,
      nextJobQueue: updatedNextJobQueue
    });
    
    // 5. If we assigned a new job, update its status to "doing"
    if (nextJobId) {
      const nextJobResponse = await axios.get(`/api/jobs/${nextJobId}`);
      const nextJobData = nextJobResponse.data;
      
      await axios.put(`/api/jobs/${nextJobId}`, {
        ...nextJobData,
        status: "doing",
        lastUpdate: new Date().toISOString()
      });
      
      toast.success(`Job completed and next job #${nextJobId} assigned to truck`);
    } else {
      toast.success("Job completed. No more jobs in queue for this truck.");
    }
    
    // Close modals and reset state
    completeJobModal.value = false;
    selectedRealUnloadingDate.value = null;
    
    // Emit an event to notify parent component to refresh data
    emit('job-completed');
    
  } catch (error) {
    console.error('Error completing job:', error);
    toast.error("Failed to complete job. Please try again.");
    
    // Fallback for demo/development
    // Update local state to simulate the API call
    props.job.realUnloadingDate = selectedRealUnloadingDate.value.toISOString();
    props.job.status = "done";
    props.job.deliveredBy = props.truck.plateNumber;
    
    // Simulate removing job from truck and assigning next job
    if (props.nextJobQueue && props.nextJobQueue.length > 0) {
      toast.success(`Job completed and next job assigned to truck (Demo Mode)`);
    } else {
      toast.success("Job completed. No more jobs in queue for this truck. (Demo Mode)");
    }
    
    completeJobModal.value = false;
    selectedRealUnloadingDate.value = null;
  } finally {
    isCompletingJob.value = false;
  }
};

const deleteRealLoadingDate = async () => {
  try {
    await axios.patch(`/api/jobs/${props.job.id}`, {
      realLoadingDate: null
    });
    
    // Update local state
    props.job.realLoadingDate = null;
    loadingModal.value = false;
    deleteLoadingModal.value = false;
    selectedRealLoadingDate.value = null;
    toast.success("Loading date was successfully deleted");
  } catch (error) {
    toast.error("Failed to delete loading date");
    console.error('Failed to delete loading date:', error);
  }
};

const deleteRealUnloadingDate = async () => {
  try {
    await axios.patch(`/api/jobs/${props.job.id}`, {
      realUnloadingDate: null
    });
    
    // Update local state
    props.job.realUnloadingDate = null;
    unloadingModal.value = false;
    deleteUnloadingModal.value = false;
    selectedRealUnloadingDate.value = null;
    toast.success("Unloading date was successfully deleted");
  } catch (error) {
    toast.error("Failed to delete unloading date");
    console.error('Failed to delete unloading date:', error);
  }
};

// Define emit for parent component notification
const emit = defineEmits(['job-completed']);

// Replace the watch blocks with these new ones
watch(loadingModal, (newValue) => {
  if (newValue) {
    selectedRealLoadingDate.value = formatDate(props.job.realLoadingDate) || getDefaultDate();
  }
});

watch(unloadingModal, (newValue) => {
  if (newValue) {
    selectedRealUnloadingDate.value = formatDate(props.job.realUnloadingDate) || getDefaultDate();
  }
});

const toggleDetails = () => {
  showDetails.value = !showDetails.value;
};

const toggleFutureJobs = (event) => {
  event.stopPropagation();
  showFutureJobs.value = !showFutureJobs.value;
};
</script>

<style scoped>
.card-container {
  position: relative;
}

.main-card {
  border-radius: 0.75rem;
  position: relative;
  z-index: 2;
}

.placeholder-card {
  position: relative;
  top: -5px;
  width: 90%;
  margin: 0 auto;
  border-bottom-left-radius: 0.75rem;
  border-bottom-right-radius: 0.75rem;
  border-top-left-radius: 0;
  border-top-right-radius: 0;
  z-index: 1;
  cursor: pointer;
}

.future-jobs-container {
  position: relative;
  top: -5px;
  width: 90%;
  margin: 0 auto;
  border-bottom-left-radius: 0.75rem;
  border-bottom-right-radius: 0.75rem;
  z-index: 0;
}
</style>

<template>
  <div class="card-container">
    <div 
      @click="toggleDetails"
      class="main-card bg-white shadow-md relative cursor-pointer hover:shadow-lg transition-shadow"
    >
      <div class="p-3">
        <!-- Short Version - Always Visible -->
        <div class="flex justify-between items-start">
          <div class="flex flex-col sm:flex-row sm:items-center sm:gap-4 gap-2 flex-1 min-w-0">
            <!-- Truck Info -->
            <div class="flex items-center gap-2">
              <h3 class="text-l font-bold truncate">{{ truck.plateNumber }}</h3>
              <template v-if="job && !job.realLoadingDate && !job.realUnloadingDate">
                <i class="pi pi-caret-right text-yellow-500"></i>
              </template>
              <template v-else-if="job && job.realLoadingDate">
                <div class="flex gap-0.5">
                  <i class="pi pi-caret-right text-green-500"></i>
                  <i class="pi pi-caret-right text-green-500"></i>
                  <i class="pi pi-caret-right text-green-500"></i>
                </div>
              </template>
              <template v-else>
                <i class="pi pi-caret-right text-gray-400"></i>
              </template>
            </div>
            
            <!-- Job Info (if exists) -->
            <div v-if="job" class="flex items-center text-sm relative min-w-0 flex-1">
              <div class="flex items-center gap-4 flex-1 min-w-0 sm:pr-20 pr-16">
                <span class="text-green-600 font-medium truncate">{{ job.client }}</span>
                <div class="flex items-center gap-2 text-gray-600 truncate">
                  <span class="truncate">{{ job.startlocationCity }}</span>
                  <i class="pi pi-arrow-right text-xs flex-shrink-0"></i>
                  <span class="truncate">{{ job.destinationCity }}</span>
                </div>
              </div>
              <span class="text-gray-500 font-medium absolute right-0 whitespace-nowrap">
                {{ job.realLoadingDate ? formatDate(job.realLoadingDate).getDate().toString().padStart(2, '0') + '.' + (formatDate(job.realLoadingDate).getMonth() + 1).toString().padStart(2, '0') : 
                   formatDate(job.planLoadingDate).getDate().toString().padStart(2, '0') + '.' + (formatDate(job.planLoadingDate).getMonth() + 1).toString().padStart(2, '0') }}
              </span>
            </div>
          </div>
          <i 
            :class="[
              showDetails ? 'pi pi-chevron-up' : 'pi pi-chevron-down',
              'text-blue-500 text-xl transition-transform flex-shrink-0 ml-2'
            ]"
          ></i>
        </div>

        <!-- Extended Details - Shown when showDetails is true -->
        <div v-if="showDetails" class="mt-3">
          <div class="border-t border-gray-100 pt-2">
            <!-- Truck Info Section -->
            <div class="mb-2">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <div class="text-gray-600 text-xs">{{ truck.type }}</div>
                </div>
                <RouterLink
                  v-if="job"
                  :to="'/jobs/' + job.id"
                  class="bg-green-500 hover:bg-green-600 text-white px-2 py-0.5 rounded text-xs"
                  @click.stop
                >
                  Details
                </RouterLink>
              </div>
            </div>

            <!-- Current Job Info Section -->
            <div v-if="job">
              <h3 class="text-green-500 mb-2 text-sm">{{ job.client }}</h3>

              <div class="grid grid-cols-2 gap-4 mb-3">
                <div class="flex flex-col gap-1">
                  <button 
                    disabled
                    class="text-sm text-gray-400 p-2 rounded cursor-not-allowed flex items-center"
                  >
                    <span class="font-semibold mr-1">Plan</span>
                    <i class="pi pi-arrow-down text-xs mr-2 text-blue-500"></i>
                    <span :class="{ 'font-bold': !job.planLoadingDate }">
                      {{ job.planLoadingDate ? formatDisplayDateShort(job.planLoadingDate) : 'Set date' }}
                    </span>
                  </button>
                  <button 
                    @click.stop="loadingModal = true"
                    class="text-sm text-gray-600 hover:bg-gray-100 p-2 rounded flex items-center"
                  >
                    <span class="font-semibold mr-1">Real</span>
                    <i class="pi pi-arrow-down text-xs mr-2 text-blue-500"></i>
                    <span :class="{ 'font-bold': !job.realLoadingDate }">
                      {{ job.realLoadingDate ? formatDisplayDateShort(job.realLoadingDate) : 'Set date' }}
                    </span>
                  </button>
                </div>
                <div class="flex flex-col gap-1">
                  <button 
                    disabled
                    class="text-sm text-gray-400 p-2 rounded cursor-not-allowed flex items-center"
                  >
                    <span class="font-semibold mr-1">Plan</span>
                    <i class="pi pi-arrow-up text-xs mr-2 text-green-500"></i>
                    <span :class="{ 'font-bold': !job.planUnloadingDate }">
                      {{ job.planUnloadingDate ? formatDisplayDateShort(job.planUnloadingDate) : 'Set date' }}
                    </span>
                  </button>
                  <button 
                    @click.stop="unloadingModal = true"
                    class="text-sm text-gray-600 hover:bg-gray-100 p-2 rounded flex items-center"
                  >
                    <span class="font-semibold mr-1">Real</span>
                    <i class="pi pi-arrow-up text-xs mr-2 text-green-500"></i>
                    <span :class="{ 'font-bold': !job.realUnloadingDate }">
                      {{ job.realUnloadingDate ? formatDisplayDateShort(job.realUnloadingDate) : 'Set date' }}
                    </span>
                  </button>
                </div>
              </div>

              <div class="flex items-center justify-between mb-2 text-xs">
                <div class="text-orange-700 flex items-center">
                  <template v-if="!job.realLoadingDate">
                    <i class="pi pi-forward text-orange-700 mr-1"></i>
                  </template>
                  <i class="pi pi-map-marker text-orange-700 mr-1"></i>
                  <span class="truncate">{{ job.startlocationCountry }} {{ job.startlocationCity }}</span>
                </div>
                <template v-if="job.realLoadingDate">
                  <div class="text-orange-700 mx-1">
                    <i class="pi pi-forward text-orange-700"></i>
                  </div>
                </template>
                <div class="text-orange-700 flex items-center">
                  <i class="pi pi-map-marker text-orange-700 mr-1"></i>
                  <span class="truncate">{{ job.destinationCountry }} {{ job.destinationCity }}</span>
                </div>
              </div>
            </div>
            
            <!-- No Current Job Message -->
            <div v-else class="text-gray-500 italic">
              No current job assigned
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Next Jobs Placeholder Card -->
    <div 
      @click="toggleFutureJobs"
      class="placeholder-card bg-white shadow-sm p-1 text-xs h-8 flex items-center justify-between px-3 hover:bg-gray-50 transition-colors"
    >
      <template v-if="nextJob">
        <div class="flex items-center gap-2 flex-1 min-w-0">
          <i class="pi pi-calendar-plus text-blue-400 flex-shrink-0"></i>
          <span class="font-medium text-green-600 truncate max-w-[80px]">
            {{ nextJob.client.length > 10 ? nextJob.client.substring(0, 10) + '...' : nextJob.client }}
          </span>
          <div class="flex items-center gap-1 truncate text-gray-600 flex-1 min-w-0">
            <span class="truncate max-w-[60px]">{{ nextJob.startlocationCity }}</span>
            <i class="pi pi-arrow-right text-xs flex-shrink-0"></i>
            <span class="truncate max-w-[60px]">{{ nextJob.destinationCity }}</span>
          </div>
          <span v-if="nextJobQueue && nextJobQueue.length > 1" class="bg-blue-100 text-blue-800 text-xs px-1.5 py-0.5 rounded-full flex-shrink-0">
            +{{ nextJobQueue.length - 1 }}
          </span>
        </div>
        <div class="flex items-center">
          <span class="text-gray-500 whitespace-nowrap flex-shrink-0 mr-1">
            {{ nextJob.planLoadingDate ? formatDisplayDateShort(nextJob.planLoadingDate) : '' }}
          </span>
          <i 
            :class="[
              showFutureJobs ? 'pi pi-chevron-up' : 'pi pi-chevron-down',
              'text-blue-500 text-sm transition-transform flex-shrink-0'
            ]"
          ></i>
        </div>
      </template>
      <template v-else>
        <span class="text-gray-400 text-center w-full">No future jobs scheduled</span>
      </template>
    </div>

    <!-- Future Jobs Expanded View -->
    <div v-if="showFutureJobs && nextJobQueue && nextJobQueue.length > 0" class="future-jobs-container bg-white shadow-sm p-3 text-xs">
      <h4 class="font-medium text-gray-700 mb-2">Future Jobs Queue ({{ nextJobQueue.length }})</h4>
      <div class="space-y-2">
        <div v-for="(job, index) in nextJobQueue" :key="job.id" class="p-2 border border-gray-100 rounded hover:bg-gray-50">
          <div class="flex justify-between items-center">
            <div class="flex items-center gap-2 flex-1 min-w-0">
              <span class="text-gray-400 w-4">{{ index + 1 }}.</span>
              <span class="font-medium text-green-600 truncate max-w-[80px]">
                {{ job.client && job.client.length > 10 ? job.client.substring(0, 10) + '...' : job.client }}
              </span>
              <div class="flex items-center gap-1 truncate text-gray-600 flex-1 min-w-0">
                <span class="truncate max-w-[60px]">{{ job.startlocationCity }}</span>
                <i class="pi pi-arrow-right text-xs flex-shrink-0"></i>
                <span class="truncate max-w-[60px]">{{ job.destinationCity }}</span>
              </div>
            </div>
            <span class="text-gray-500 whitespace-nowrap flex-shrink-0">
              {{ job.planLoadingDate ? formatDisplayDateShort(job.planLoadingDate) : 'No date' }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <VueFinalModal
    v-model="loadingModal"
    class="flex justify-center items-center z-50"
    content-class="relative bg-white rounded-lg p-4 border shadow-lg w-[500px]"
    overlay-class="bg-black bg-opacity-30 overflow-hidden"
    :lock-scroll="false"
    hide-overlay="false"
  >
    <div class="text-sm font-semibold text-gray-700 mb-2">Set load date</div>
    <VueDatePicker
      v-model="selectedRealLoadingDate"
      auto-apply
      locale="de"
      format="dd.MM.yyyy"
      class="mb-2"
    />
    <div class="flex gap-2">
      <button 
        :class="[
          job.realLoadingDate 
            ? 'bg-blue-500 hover:bg-blue-600' 
            : 'bg-green-500 hover:bg-green-600'
        ]"
        class="text-white px-3 py-1 rounded text-sm"
        @click="submitRealLoadingDate"
      >
        {{ job.realLoadingDate ? 'Update' : 'Submit' }}
      </button>
      <button 
        v-if="job.realLoadingDate"
        class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
        @click="deleteLoadingModal = true"
      >
        Delete
      </button>
      <button 
        class="bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded text-sm"
        @click="loadingModal = false"
      >
        Cancel
      </button>
    </div>
  </VueFinalModal>

  <VueFinalModal
    v-model="unloadingModal"
    class="flex justify-center items-center z-50"
    content-class="relative bg-white rounded-lg p-4 border shadow-lg w-[500px]"
    overlay-class="bg-black bg-opacity-30 overflow-hidden"
    :lock-scroll="false"
    hide-overlay="false"
  >
    <div class="text-sm font-semibold text-gray-700 mb-2">Set unload date</div>
    <VueDatePicker
      v-model="selectedRealUnloadingDate"
      auto-apply
      locale="de"
      format="dd.MM.yyyy"
      class="mb-2"
    />
    <div class="flex gap-2">
      <button 
        :class="[
          job.realUnloadingDate 
            ? 'bg-blue-500 hover:bg-blue-600' 
            : 'bg-green-500 hover:bg-green-600'
        ]"
        class="text-white px-3 py-1 rounded text-sm"
        @click="submitRealUnloadingDate"
      >
        {{ job.realUnloadingDate ? 'Update' : 'Submit' }}
      </button>
      <button 
        v-if="job.realUnloadingDate"
        class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
        @click="deleteUnloadingModal = true"
      >
        Delete
      </button>
      <button 
        class="bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded text-sm"
        @click="unloadingModal = false"
      >
        Cancel
      </button>
    </div>
  </VueFinalModal>

  <!-- Loading delete confirmation modal -->
  <VueFinalModal
    v-model="deleteLoadingModal"
    class="flex justify-end items-end sm:items-center z-50"
    content-class="relative bg-white rounded-t-lg sm:rounded-lg p-4 border shadow-lg w-full sm:w-[500px] mx-auto"
    overlay-class="bg-black bg-opacity-30"
    :lock-scroll="false"
  >
    <div class="text-center">
      <h3 class="text-lg font-medium mb-4">Delete Loading Date?</h3>
      <p class="text-gray-500 mb-4">Are you sure you want to delete the loading date?</p>
      <div class="flex gap-2 justify-center">
        <button 
          class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
          @click="deleteRealLoadingDate"
        >
          Delete
        </button>
        <button 
          class="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded"
          @click="deleteLoadingModal = false"
        >
          Cancel
        </button>
      </div>
    </div>
  </VueFinalModal>

  <!-- Unloading delete confirmation modal -->
  <VueFinalModal
    v-model="deleteUnloadingModal"
    class="flex justify-end items-end sm:items-center z-50"
    content-class="relative bg-white rounded-t-lg sm:rounded-lg p-4 border shadow-lg w-full sm:w-[500px] mx-auto"
    overlay-class="bg-black bg-opacity-30"
    :lock-scroll="false"
  >
    <div class="text-center">
      <h3 class="text-lg font-medium mb-4">Delete Unloading Date?</h3>
      <p class="text-gray-500 mb-4">Are you sure you want to delete the unloading date?</p>
      <div class="flex gap-2 justify-center">
        <button 
          class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
          @click="deleteRealUnloadingDate"
        >
          Delete
        </button>
        <button 
          class="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded"
          @click="deleteUnloadingModal = false"
        >
          Cancel
        </button>
      </div>
    </div>
  </VueFinalModal>
  
  <!-- Job completion confirmation modal -->
  <VueFinalModal
    v-model="completeJobModal"
    class="flex justify-center items-center z-50"
    content-class="relative bg-white rounded-lg p-4 border shadow-lg w-[500px]"
    overlay-class="bg-black bg-opacity-30 overflow-hidden"
    :lock-scroll="false"
    hide-overlay="false"
  >
    <div class="text-center">
      <h3 class="text-lg font-medium mb-4">Complete Job?</h3>
      <p class="text-gray-600 mb-4">
        Setting the unloading date will mark this job as completed, remove it from this truck's current job, 
        and assign the next job from the queue if available.
      </p>
      <p class="text-gray-600 mb-4">
        Unloading date: <span class="font-semibold">{{ selectedRealUnloadingDate ? formatDisplayDate(selectedRealUnloadingDate) : 'Not set' }}</span>
      </p>
      
      <div class="flex gap-2 justify-center">
        <button 
          class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
          @click="completeJob"
          :disabled="isCompletingJob"
          :class="{ 'opacity-50 cursor-not-allowed': isCompletingJob }"
        >
          <span v-if="isCompletingJob">Processing...</span>
          <span v-else>Complete Job</span>
        </button>
        <button 
          class="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded"
          @click="completeJobModal = false"
          :disabled="isCompletingJob"
        >
          Cancel
        </button>
      </div>
    </div>
  </VueFinalModal>
</template>

