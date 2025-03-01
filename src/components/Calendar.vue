<template>
    <div class="calendar-wrapper">
      <div v-if="isLoading" class="loading">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
        <p class="text-gray-600">Loading trucks...</p>
      </div>
      
      <g-gantt-chart
        v-else
        :chart-start="startDate"
        :chart-end="endDate"
        precision="day"
        width="100%"
        bar-start="myBeginDate"
        bar-end="myEndDate"
        date-format="YYYY-MM-DD"
        grid
        row-height="60"
        class="gantt-chart"
      >
        <template #row="{ row }">
          <div class="truck-row">
            <div class="truck-plate">{{ row.label }}</div>
            <div class="truck-type">{{ getTruckType(row.label) }}</div>
          </div>
        </template>
        
        <g-gantt-row
          v-for="truck in trucks"
          :key="truck.id"
          :label="truck.plateNumber"
          :bars="[]"
        />
      </g-gantt-chart>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted, computed } from "vue";
  import axios from "axios";
  
  const trucks = ref([]);
  const isLoading = ref(true);
  
  // Calculate start and end dates for the current month
  const today = new Date();
  const startDate = computed(() => {
    // First day of current month
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    // Go back a few days to include the end of previous month
    start.setDate(start.getDate() - 3);
    return start.toISOString().split('T')[0]; // Format as YYYY-MM-DD
  });
  
  const endDate = computed(() => {
    // Last day of current month
    const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    // Add a few days to include the beginning of next month
    end.setDate(end.getDate() + 3);
    return end.toISOString().split('T')[0]; // Format as YYYY-MM-DD
  });
  
  // Fetch trucks from API
  const fetchTrucks = async () => {
    isLoading.value = true;
    try {
      const response = await axios.get('/api/trucks');
      trucks.value = response.data;
      console.log('Trucks loaded:', trucks.value);
    } catch (error) {
      console.error('Error fetching trucks:', error);
      // Fallback for development/demo
      trucks.value = [
        { id: 1, plateNumber: 'ABC123', type: 'Semi-trailer' },
        { id: 2, plateNumber: 'XYZ789', type: 'Box truck' },
        { id: 3, plateNumber: 'DEF456', type: 'Flatbed' }
      ];
    } finally {
      isLoading.value = false;
    }
  };
  
  // Helper function to get truck type by plate number
  const getTruckType = (plateNumber) => {
    const truck = trucks.value.find(t => t.plateNumber === plateNumber);
    return truck ? truck.type : '';
  };
  
  onMounted(() => {
    fetchTrucks();
  });
  </script>
  
  <style scoped>
  .calendar-wrapper {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
  }
  
  /* Add some basic styling */
  :deep(.g-gantt-chart) {
    flex-grow: 1;
    min-height: 400px;
    width: 100%;
  }
  
  .loading {
    text-align: center;
    padding: 2rem;
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }
  
  .truck-row {
    display: flex;
    flex-direction: column;
    justify-content: center;
    height: 100%;
    padding: 0 10px;
  }
  
  .truck-plate {
    font-weight: 600;
    font-size: 14px;
  }
  
  .truck-type {
    font-size: 12px;
    color: #666;
  }
  </style>