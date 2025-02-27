<script setup>
import { RouterLink } from 'vue-router';
import { defineProps, ref } from 'vue';

const props = defineProps({
  truck: Object,
  job: Object,
});

const showRealLoadingCalendar = ref(false);
const selectedRealLoadingDate = ref(null);
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
            
            <div v-if="showRealLoadingCalendar" class="absolute z-10 mt-1 bg-white shadow-lg rounded-lg p-2 border right-0">
              <input 
                type="date" 
                v-model="selectedRealLoadingDate"
                class="border rounded p-1 mb-2"
              >
              <div class="flex gap-2">
                <button 
                  class="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                  @click="showRealLoadingCalendar = false"
                >
                  Submit
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
            <button class="text-sm text-gray-600 hover:bg-gray-100 p-2 rounded">
              <span class="font-semibold">Real Unloading:</span>
              <span :class="{ 'font-bold': !job.realUnloadingDate }">
                {{ job.realUnloadingDate ? new Date(job.realUnloadingDate).toLocaleDateString('de-DE') : 'Set date' }}
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
</template>
