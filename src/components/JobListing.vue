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
  job: Object,
});

const toast = useToast();

const showDetails = ref(false);

const toggleDetails = () => {
  showDetails.value = !showDetails.value;
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
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-1 gap-6">
    <!-- Job Listing Card -->
    <div 
      class="rounded-xl shadow-md relative"
      :class="{
        'bg-white': !job.realLoadingDate,
        'bg-green-100': job.realLoadingDate && !job.realUnloadingDate,
        'bg-gray-300': job.realLoadingDate && job.realUnloadingDate
      }"
    >
      
      <div class="p-4 ">
        <!-- Short Version - Always Visible -->
        <div class="flex justify-between items-center">
          <div>
            <h3 class="text-xl font-bold text-green-600">{{ job.client }}</h3>
            <div class="text-sm text-gray-600 mt-1 flex items-center gap-4">
              <div class="flex items-center gap-1">
                <i class="pi pi-arrow-down text-blue-500"></i>
                {{ formatDateOnly(job.planLoadingDate) }}
              </div>
              <div class="flex items-center gap-1">
                <i class="pi pi-arrow-up text-green-500"></i>
                {{ formatDateOnly(job.planUnloadingDate) }}
              </div>
            </div>
          </div>
          <button
            @click="toggleDetails"
            class="text-blue-500 hover:text-blue-600 text-sm flex items-center gap-1"
          >
            {{ showDetails ? 'Show Less' : 'Show More' }}
            <i :class="showDetails ? 'pi pi-chevron-up' : 'pi pi-chevron-down'"></i>
          </button>
        </div>

        <!-- Extended Details - Shown when showDetails is true -->
        <div v-if="showDetails" class="mt-1">
          <div class="border-t border-gray-100 pt-1">
            <!-- Job Type and ID -->
            <div class="mb-2">
              <span class="text-sm text-gray-500 mr-2">ID: {{ job.id }}</span>
              <span class="text-gray-600">{{ job.type }}</span>

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
                    {{ job.realLoadingDate ? formatDateOnly(job.realLoadingDate) : 'Pending' }}
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
                    {{ job.realUnloadingDate ? formatDateOnly(job.realUnloadingDate) : 'Pending' }}
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
                Added: {{ formatDateOnly(job.addDate) }}
              </div>
              <RouterLink
                :to="'/jobs/' + job.id"
                class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm"
              >
                Job Details
              </RouterLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>