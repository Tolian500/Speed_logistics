<template>
    <div class="calendar-wrapper">
      <div v-if="isLoading" class="loading">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
        <p class="text-gray-600">Loading trucks...</p>
      </div>
      
      <template v-else>
        <div class="calendar-header">
          <span class="date-range">{{ formatDateRange() }}</span>
        </div>
        
        <div class="gantt-container">
          <!-- Fixed column for truck names -->
          <div class="truck-column">
            <div class="truck-column-header"></div>
            <div 
              v-for="truck in trucks" 
              :key="truck.id" 
              class="truck-row-fixed"
            >
              <div class="truck-plate">{{ truck.plateNumber }}</div>
              <div class="truck-type">{{ truck.type }}</div>
            </div>
          </div>
          
          <!-- Scrollable gantt chart -->
          <div class="gantt-scroll-wrapper">
            <!-- Scrollbar at the top -->
            <div class="scrollbar-container custom-scrollbar" ref="scrollbarContainer">
              <div class="scrollbar-content"></div>
            </div>
            
            <!-- Gantt chart content -->
            <div class="gantt-scroll-container" ref="ganttContainer">
              <g-gantt-chart
                :chart-start="visibleStartDate"
                :chart-end="visibleEndDate"
                precision="day"
                width="500%"
                bar-start="myBeginDate"
                bar-end="myEndDate"
                date-format="YYYY-MM-DD"
                :grid="true"
                row-height="60"
                class="gantt-chart"
                :highlight-current-time="true"
                column-width="100"
              >
                <!-- Custom header template to show only day numbers -->
                <template #chart-header-cell="{ column }">
                  <div class="day-number">
                    {{ new Date(column.time).getDate() }}
                  </div>
                </template>

                <template #row="{ row }">
                  <div class="truck-row">
                    <!-- Empty row content since we show truck info in the fixed column -->
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
          </div>
        </div>
      </template>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted, computed } from "vue";
  import axios from "axios";
  
  const trucks = ref([]);
  const isLoading = ref(true);
  const ganttContainer = ref(null);
  const scrollbarContainer = ref(null);
  
  // Calculate visible date range (180 days)
  const visibleStartDate = computed(() => {
    // Start from 90 days before today
    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() - 90);
    return start.toISOString().split('T')[0]; // Format as YYYY-MM-DD
  });
  
  const visibleEndDate = computed(() => {
    // End 90 days after today
    const today = new Date();
    const end = new Date(today);
    end.setDate(end.getDate() + 90);
    return end.toISOString().split('T')[0]; // Format as YYYY-MM-DD
  });
  
  // Format the date range for display
  const formatDateRange = () => {
    const today = new Date();
    const month = today.toLocaleString('default', { month: 'long' });
    return `${month} ${today.getFullYear()}`;
  };
  
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
  
  // Scroll to today's date
  const scrollToToday = () => {
    setTimeout(() => {
      if (ganttContainer.value && scrollbarContainer.value) {
        // Calculate position to center today
        // The chart is now 500% wide
        const scrollPosition = (ganttContainer.value.scrollWidth / 5) - (ganttContainer.value.clientWidth / 2);
        ganttContainer.value.scrollLeft = scrollPosition;
        scrollbarContainer.value.scrollLeft = scrollPosition;
        
        // Set up scroll synchronization
        setupScrollSync();
      }
    }, 200);
  };
  
  // Synchronize scrolling between the scrollbar and the gantt chart
  const setupScrollSync = () => {
    if (ganttContainer.value && scrollbarContainer.value) {
      // Sync scrollbar with gantt
      ganttContainer.value.addEventListener('scroll', () => {
        scrollbarContainer.value.scrollLeft = ganttContainer.value.scrollLeft;
      });
      
      // Sync gantt with scrollbar
      scrollbarContainer.value.addEventListener('scroll', () => {
        ganttContainer.value.scrollLeft = scrollbarContainer.value.scrollLeft;
      });
    }
  };
  
  onMounted(() => {
    fetchTrucks();
    scrollToToday();
  });
  </script>
  
  <style scoped>
  .calendar-wrapper {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
  }
  
  .calendar-header {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 0.75rem;
    background-color: #f5f5f5;
    border-bottom: 1px solid #e0e0e0;
  }
  
  .date-range {
    font-weight: 600;
    font-size: 1.25rem;
    color: #333;
  }
  
  .gantt-container {
    display: flex;
    flex-grow: 1;
    width: 100%;
    position: relative;
    overflow: hidden;
  }
  
  .truck-column {
    width: 150px;
    flex-shrink: 0;
    background-color: #f9f9f9;
    border-right: 1px solid #ddd;
    z-index: 10;
    display: flex;
    flex-direction: column;
  }
  
  .truck-column-header {
    height: 60px; /* Match the height of the gantt chart header */
    border-bottom: 1px solid #ddd;
  }
  
  .truck-row-fixed {
    height: 60px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 0 10px;
    border-bottom: 1px solid #eee;
  }
  
  .gantt-scroll-wrapper {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  
  /* Scrollbar container at the top */
  .scrollbar-container {
    height: 16px;
    width: 100%;
    overflow-x: auto;
    overflow-y: hidden;
    background: #f1f1f1;
    border-bottom: 1px solid #ddd;
    position: relative;
    z-index: 5;
  }
  
  .scrollbar-content {
    width: 500%; /* Match the width of the gantt chart */
    height: 1px;
  }
  
  .gantt-scroll-container {
    flex-grow: 1;
    width: 100%;
    overflow-x: auto;
    overflow-y: hidden;
    position: relative;
    /* Hide the default scrollbar since we're using the top one */
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none; /* IE and Edge */
  }
  
  /* Hide default scrollbar for Chrome, Safari and Opera */
  .gantt-scroll-container::-webkit-scrollbar {
    display: none;
  }
  
  /* Custom scrollbar styling */
  .custom-scrollbar::-webkit-scrollbar {
    height: 16px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 10px;
    border: 1px solid #ddd;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #4CAF50;
    border-radius: 10px;
    border: 3px solid #f1f1f1;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #388E3C;
  }
  
  /* Add some basic styling */
  :deep(.g-gantt-chart) {
    flex-grow: 1;
    min-height: 400px;
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
    height: 100%;
  }
  
  .truck-plate {
    font-weight: 600;
    font-size: 14px;
  }
  
  .truck-type {
    font-size: 12px;
    color: #666;
  }
  
  .day-number {
    font-size: 16px;
    font-weight: 600;
    color: #333;
    text-align: center;
    padding: 8px 0;
  }
  
  :deep(.g-gantt-chart-header-month) {
    display: none !important;
  }
  </style>