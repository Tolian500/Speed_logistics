<script setup>
import { RouterLink } from 'vue-router';
import { defineProps, ref, computed } from 'vue';
import { useToast } from 'vue-toastification';
import axios from 'axios';
import VueDatePicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css'

const props = defineProps({
  truck: Object,
  job: Object,
});

const toast = useToast();

const showRealLoadingCalendar = ref(false);
const showRealUnloadingCalendar = ref(false);
const selectedRealLoadingDate = ref(null);
const selectedRealUnloadingDate = ref(null);

const formatDate = (date) => {
  if (!date) return null;
  return new Date(date);
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
    showRealLoadingCalendar.value = false;
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
  
  try {
    const isUpdate = !!props.job.realUnloadingDate;
    const isoDate = selectedRealUnloadingDate.value.toISOString();
    
    await axios.patch(`/api/jobs/${props.job.id}`, {
      realUnloadingDate: isoDate
    });
    
    props.job.realUnloadingDate = isoDate;
    showRealUnloadingCalendar.value = false;
    selectedRealUnloadingDate.value = null;

    if (isUpdate) {
      toast.info("Unloading date was successfully updated");
    } else {
      toast.success("Unloading date was successfully set");
    }
  } catch (error) {
    toast.error("Failed to update unloading date");
    console.error('Failed to update unloading date:', error);
  }
};

const deleteRealLoadingDate = async () => {
  if (!confirm('Are you sure you want to delete the loading date?')) return;
  
  try {
    await axios.patch(`/api/jobs/${props.job.id}`, {
      realLoadingDate: null
    });
    
    // Update local state
    props.job.realLoadingDate = null;
    showRealLoadingCalendar.value = false;
    selectedRealLoadingDate.value = null;
    toast.success("Loading date was successfully deleted");
  } catch (error) {
    toast.error("Failed to delete loading date");
    console.error('Failed to delete loading date:', error);
  }
};

const deleteRealUnloadingDate = async () => {
  if (!confirm('Are you sure you want to delete the unloading date?')) return;
  
  try {
    await axios.patch(`/api/jobs/${props.job.id}`, {
      realUnloadingDate: null
    });
    
    // Update local state
    props.job.realUnloadingDate = null;
    showRealUnloadingCalendar.value = false;
    selectedRealUnloadingDate.value = null;
    toast.success("Unloading date was successfully deleted");
  } catch (error) {
    toast.error("Failed to delete unloading date");
    console.error('Failed to delete unloading date:', error);
  }
};
</script>

<template>
  <div class="bg-white rounded-xl shadow-md relative">
    <div class="p-4">
      <!-- Truck Info Section -->
      <div class="mb-2">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="text-gray-600">{{ truck.type }}</div>
            <h3 class="text-xl font-bold">{{ truck.plateNumber }}</h3>
          </div>
          <RouterLink
            v-if="job"
            :to="'/jobs/' + job.id"
            class="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
          >
            Job Details
          </RouterLink>
        </div>
      </div>

      <div class="border border-gray-100 my-4"></div>

      <!-- Current Job Info Section -->
      <div v-if="job">
        <h3 class="text-green-500 mb-2">Obecne zlecenie: {{ job.client }}</h3>

        <div class="grid grid-cols-2 gap-4 mb-4">
          <div class="flex flex-col">
            <button 
              disabled
              class="text-sm text-gray-400 p-2 rounded cursor-not-allowed"
            >
              <span class="font-semibold">Plan Loading:</span>
              <span :class="{ 'font-bold': !job.planLoadingDate }">
                {{ job.planLoadingDate ? new Date(job.planLoadingDate).toLocaleDateString('de-DE') : 'Set date' }}
              </span>
            </button>
            <button 
              @click="showRealLoadingCalendar = !showRealLoadingCalendar"
              class="text-sm text-gray-600 hover:bg-gray-100 p-2 rounded"
            >
              <span class="font-semibold">Real Loading:</span>
              <span :class="{ 'font-bold': !job.realLoadingDate }">
                {{ job.realLoadingDate ? new Date(job.realLoadingDate).toLocaleDateString('de-DE') : 'Set date' }}
              </span>
            </button>
            
            <div v-if="showRealLoadingCalendar" class="absolute z-10 mt-1 bg-white shadow-lg rounded-lg p-2 border left-1/2 -translate-x-1/2">
              <div class="text-sm font-semibold text-gray-700 mb-2">Set load date</div>
              <VueDatePicker
                v-model="selectedRealLoadingDate"
                :model-value="selectedRealLoadingDate || formatDate(job.realLoadingDate)"
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
                  @click="deleteRealLoadingDate"
                >
                  Delete
                </button>
                <button 
                  class="bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded text-sm"
                  @click="showRealLoadingCalendar = false"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
          <div class="flex flex-col">
            <button 
              disabled
              class="text-sm text-gray-400 p-2 rounded cursor-not-allowed"
            >
              <span class="font-semibold">Plan Unloading:</span>
              <span :class="{ 'font-bold': !job.planUnloadingDate }">
                {{ job.planUnloadingDate ? new Date(job.planUnloadingDate).toLocaleDateString('de-DE') : 'Set date' }}
              </span>
            </button>
            <button 
              @click="showRealUnloadingCalendar = !showRealUnloadingCalendar"
              class="text-sm text-gray-600 hover:bg-gray-100 p-2 rounded"
            >
              <span class="font-semibold">Real Unloading:</span>
              <span :class="{ 'font-bold': !job.realUnloadingDate }">
                {{ job.realUnloadingDate ? new Date(job.realUnloadingDate).toLocaleDateString('de-DE') : 'Set date' }}
              </span>
            </button>

            <div v-if="showRealUnloadingCalendar" class="absolute z-10 mt-1 bg-white shadow-lg rounded-lg p-2 border left-1/2 -translate-x-1/2">
              <div class="text-sm font-semibold text-gray-700 mb-2">Set unload date</div>
              <VueDatePicker
                v-model="selectedRealUnloadingDate"
                :model-value="selectedRealUnloadingDate || formatDate(job.realUnloadingDate)"
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
                  @click="deleteRealUnloadingDate"
                >
                  Delete
                </button>
                <button 
                  class="bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded text-sm"
                  @click="showRealUnloadingCalendar = false"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="flex items-center justify-between mb-4">
          <div class="text-orange-700 flex items-center">
            <template v-if="!job.realLoadingDate">
              <i class="pi pi-forward text-orange-700 mr-2"></i>
            </template>
            <i class="pi pi-map-marker text-orange-700"></i>
            {{ job.startlocationCountry }} {{ job.startlocationCity }} 
          </div>
          <template v-if="job.realLoadingDate">
            <div class="text-orange-700 mx-2">
              <i class="pi pi-forward text-orange-700"></i>
            </div>
          </template>
          <div class="text-orange-700">
            <i class="pi pi-map-marker text-orange-700"></i>
            {{ job.destinationCountry }} {{ job.destinationCity }} 
          </div>
        </div>
      </div>
      
      <!-- No Current Job Message -->
      <div v-else class="text-gray-500 italic">
        No current job assigned
      </div>
    </div>
  </div>
</template>

