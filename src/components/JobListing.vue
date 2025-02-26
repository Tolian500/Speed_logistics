<script setup>
import { RouterLink } from 'vue-router';
import { defineProps, ref, computed } from 'vue';

const props = defineProps({
  job: Object,
});

const showFullDescription = ref(false);

const toggleFullDescription = () => {
  showFullDescription.value = !showFullDescription.value;
};

const truncatedDescription = computed(() => {
  let description = props.job.description;
  if (!showFullDescription.value) {
    description = description.substring(0, 90) + '...';
  }
  return description;
});
</script>

<template>
  <div class="bg-white rounded-xl shadow-md relative">
    <div class="p-4">
      <div class="mb-2">
        <div class="flex items-center gap-2">
          <div class="text-gray-600">{{ job.type }}</div>
          <h3 class="text-xl font-bold">{{ job.plateNumber }}</h3>
        </div>
      </div>

      <h3 class="text-green-500 mb-2">{{ job.client }}</h3>

      <div class="border border-gray-100 mb-5"></div>

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
          <button class="text-sm text-gray-600 hover:bg-gray-100 p-2 rounded">
            <span class="font-semibold">Real Loading:</span>
            <span :class="{ 'font-bold': !job.realLoadingDate }">
              {{ job.realLoadingDate ? new Date(job.realLoadingDate).toLocaleDateString('de-DE') : 'Set date' }}
            </span>
          </button>
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

      <div class="flex flex-col lg:flex-row justify-between mb-4">
        <div class="flex items-center justify-between mb-4 lg:mb-0">
          <div class="text-orange-700">
            <i class="pi pi-map-marker text-orange-700"></i>
            {{ job.startlocationCountry }} {{ job.startlocationCity }} 
          </div>
          <div class="text-orange-700 mx-2">
            <i class="pi pi-forward text-orange-700"></i>
          </div>
          <div class="text-orange-700">
            <i class="pi pi-map-marker text-orange-700"></i>
            {{ job.destinationCountry }} {{ job.destinationCity }} 
          </div>
        </div>
        <RouterLink
          :to="'/jobs/' + job.id"
          class="h-[36px] bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-center text-sm"
        >
          Read More
        </RouterLink>
      </div>
    </div>
  </div>
</template>
