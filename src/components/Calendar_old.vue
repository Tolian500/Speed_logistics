<template>
    <div class="calendar-wrapper">
      <div v-if="isLoading" class="loading">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
        <p class="text-gray-600">Loading trucks...</p>
      </div>
      
      <template v-else>
        <div class="gantt-container">
          <!-- Fixed column for truck names -->
          <div class="truck-column">
            <div class="truck-column-header"></div>
            <div 
              v-for="truck in trucks" 
              :key="truck.id" 
              class="truck-row-fixed"
            >
              <div class="truck-plate">
                <span class="full-plate">{{ truck.plateNumber }}</span>
                <span class="short-plate">{{ truck.plateNumber.slice(-7) }}</span>
              </div>
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
                width="auto"
                bar-start="myBeginDate"
                bar-end="myEndDate"
                date-format="YYYY-MM-DD"
                :grid="true"
                row-height="60"
                class="gantt-chart"
                :column-width="50"
                :min-column-width="50"
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
                  :label="''"
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
    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() - 90);
    return start.toISOString().split('T')[0];
  });
  
  const visibleEndDate = computed(() => {
    const today = new Date();
    const end = new Date(today);
    end.setDate(end.getDate() + 90);
    return end.toISOString().split('T')[0];
  });
  
  // Fetch trucks from API
  const fetchTrucks = async () => {
    isLoading.value = true;
    try {
      const response = await axios.get('/api/trucks');
      trucks.value = response.data;
    } catch (error) {
      console.error('Error fetching trucks:', error);
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
        const scrollPosition = (ganttContainer.value.scrollWidth / 5) - (ganttContainer.value.clientWidth / 2);
        ganttContainer.value.scrollLeft = scrollPosition;
        scrollbarContainer.value.scrollLeft = scrollPosition;
        setupScrollSync();
      }
    }, 200);
  };
  
  // Synchronize scrolling between the scrollbar and the gantt chart
  const setupScrollSync = () => {
    if (ganttContainer.value && scrollbarContainer.value) {
      ganttContainer.value.addEventListener('scroll', () => {
        scrollbarContainer.value.scrollLeft = ganttContainer.value.scrollLeft;
      });
      
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
    height: 100px;
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
    padding-top: 16px;
  }
  
  .scrollbar-container {
    height: 16px;
    width: 100%;
    overflow-x: auto;
    overflow-y: hidden;
    background: #f1f1f1;
    border-bottom: 1px solid #ddd;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    z-index: 5;
  }
  
  .scrollbar-content {
    /* Calculate width based on number of visible days (180) and column width (50px) */
    width: 9000px;
    height: 1px;
  }
  
  .gantt-scroll-container {
    flex-grow: 1;
    width: 100%;
    overflow-x: auto;
    overflow-y: hidden;
    position: relative;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  
  .gantt-scroll-container::-webkit-scrollbar {
    display: none;
  }
  
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
  
  :deep(.g-gantt-chart) {
    position: relative;
    flex-grow: 1;
    min-height: 400px;
    min-width: 9000px; /* Match the total width of all columns */
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
    font-size: 14px;
    font-weight: 600;
    color: #333;
    text-align: center;
  }
  
  :deep(.g-gantt-chart-header) {
    padding-top: 0 !important;
    margin-top: 16px;
  }
  
  :deep(.g-gantt-chart-header-cell) {
    padding: 8px 0;
    height: 84px;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 50px !important; /* Ensure minimum width is maintained */
    width: 50px !important; /* Force fixed width */
    flex-shrink: 0; /* Prevent column shrinking */
  }
  
  .short-plate {
    display: none;
  }
  
  /* Responsive styles for small screens */
  @media (max-width: 768px) {
    .truck-column {
      width: 75px;
    }

    .truck-row-fixed {
      padding: 0 5px;
    }

    .full-plate {
      display: none;
    }

    .short-plate {
      display: inline;
    }

    .truck-type {
      font-size: 10px;
    }

    .truck-plate {
      font-size: 12px;
    }
  }
  </style>