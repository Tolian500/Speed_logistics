<script setup>
import { RouterLink } from 'vue-router';
import { defineProps, ref, computed, watch } from 'vue';
import { useToast } from 'vue-toastification';
import axios from 'axios';
import VueDatePicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css'
import { VueFinalModal } from 'vue-final-modal'
import 'vue-final-modal/style.css'

const props = defineProps({
  truck: Object,
  job: Object,
});

const toast = useToast();

const showRealLoadingCalendar = ref(false);
const showRealUnloadingCalendar = ref(false);
const selectedRealLoadingDate = ref(null);
const selectedRealUnloadingDate = ref(null);

const loadingModal = ref(false)
const unloadingModal = ref(false)

const deleteLoadingModal = ref(false)
const deleteUnloadingModal = ref(false)

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
  
  try {
    const isUpdate = !!props.job.realUnloadingDate;
    const isoDate = selectedRealUnloadingDate.value.toISOString();
    
    await axios.patch(`/api/jobs/${props.job.id}`, {
      realUnloadingDate: isoDate
    });
    
    props.job.realUnloadingDate = isoDate;
    unloadingModal.value = false;
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
              <span class="font-semibold mr-2">Plan Loading:</span>
              <span :class="{ 'font-bold': !job.planLoadingDate }">
                {{ job.planLoadingDate ? formatDisplayDate(job.planLoadingDate) : 'Set date' }}
              </span>
            </button>
            <button 
              @click="loadingModal = true"
              class="text-sm text-gray-600 hover:bg-gray-100 p-2 rounded"
            >
              <span class="font-semibold mr-2">Real Loading:</span>
              <span :class="{ 'font-bold': !job.realLoadingDate }">
                {{ job.realLoadingDate ? formatDisplayDate(job.realLoadingDate) : 'Set date' }}
              </span>
            </button>
          </div>
          <div class="flex flex-col">
            <button 
              disabled
              class="text-sm text-gray-400 p-2 rounded cursor-not-allowed"
            >
              <span class="font-semibold mr-2">Plan Unloading:</span>
              <span :class="{ 'font-bold': !job.planUnloadingDate }">
                {{ job.planUnloadingDate ? formatDisplayDate(job.planUnloadingDate) : 'Set date' }}
              </span>
            </button>
            <button 
              @click="unloadingModal = true"
              class="text-sm text-gray-600 hover:bg-gray-100 p-2 rounded"
            >
              <span class="font-semibold mr-2">Real Unloading:</span>
              <span :class="{ 'font-bold': !job.realUnloadingDate }">
                {{ job.realUnloadingDate ? formatDisplayDate(job.realUnloadingDate) : 'Set date' }}
              </span>
            </button>
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
</template>

