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

// New function for short date format (dd.mm only)
const formatDateShort = (date) => {
  if (!date) return 'Not set';
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}.${month}`;
};
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
          <div class="col-span-3">
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
            <div class="col-span-5">
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
</template>