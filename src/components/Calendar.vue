<script setup>
import { ref, onMounted, computed, onUnmounted } from "vue"
import axios from "axios"

// Data for trucks and their jobs
const trucks = ref([])
const jobs = ref([])
const isLoading = ref(true)
const error = ref(null)
const ganttContainer = ref(null)
const scrollbarContainer = ref(null)

// Fetch trucks and jobs data from the server
const fetchData = async () => {
  isLoading.value = true
  error.value = null
  
  try {
    // Fetch both trucks and jobs data
    const [trucksResponse, jobsResponse] = await Promise.all([
      axios.get('/api/trucks'),
      axios.get('/api/jobs')
    ])
    
    trucks.value = trucksResponse.data
    jobs.value = jobsResponse.data
    isLoading.value = false
    
    // Scroll to today after data is loaded
    setTimeout(() => {
      scrollToToday()
    }, 300)
  } catch (err) {
    console.error('Error fetching data:', err)
    error.value = 'Failed to load truck and job data'
    isLoading.value = false
  }
}

// Transform data into format needed for Gantt chart
const getRowsData = computed(() => {
  if (!trucks.value.length || !jobs.value.length) return []
  
  return trucks.value.map(truck => {
    // Get current job for this truck
    const currentJobId = truck.currentJob
    const nextJobIds = truck.nextJobQueue || []
    
    // Collect all jobs for this truck (current + queued)
    const allJobIds = [currentJobId, ...nextJobIds].filter(id => id)
    const truckJobs = jobs.value.filter(job => allJobIds.includes(job.id))
    
    // Map jobs to Gantt chart format
    const bars = truckJobs.map(job => {
      // Determine job status for color coding
      let status = job.status || 'pending'
      
      // Determine start and end dates
      const startDate = job.realLoadingDate || job.planLoadingDate
      const endDate = job.realUnloadingDate || job.planUnloadingDate
      
      // Skip jobs without dates
      if (!startDate || !endDate) return null
      
      return {
        myBeginDate: formatDate(startDate),
        myEndDate: formatDate(endDate),
        ganttBarConfig: {
          id: `job-${job.id}`,
          label: `${job.cargoName} (${job.startlocationCity} → ${job.destinationCity})`,
          hasHandles: status !== 'done' && status !== 'completed',
          style: {
            background: getColorByStatus(status),
            borderRadius: "6px",
            color: "white",
            boxShadow: "1px 1px 3px rgba(0,0,0,0.2)"
          }
        }
      }
    }).filter(job => job !== null) // Remove null entries
    
    return {
      id: truck.id,
      plateNumber: truck.plateNumber,
      type: truck.type,
      label: `${truck.plateNumber} (${truck.type})`,
      bars: bars
    }
  })
})

// Helper function to format date strings
const formatDate = (dateString) => {
  if (!dateString) return null
  
  // If it's already in the right format, return it
  if (dateString.includes('T') && dateString.includes('Z')) {
    // Convert to YYYY-MM-DD HH:MM format
    const date = new Date(dateString)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  }
  
  return dateString
}

// Helper function to get color based on job status
const getColorByStatus = (status) => {
  switch(status) {
    case 'assigned': return '#4CAF50' // Green
    case 'doing': return '#FF9800' // Orange
    case 'done':
    case 'completed': return '#9E9E9E' // Grey
    case 'pending': return '#2196F3' // Blue
    case 'delayed': return '#F44336' // Red
    default: return '#673AB7' // Purple
  }
}

// Calculate date range for the chart
const chartDateRange = computed(() => {
  if (!jobs.value.length) {
    // Default date range if no jobs
    const today = new Date()
    const startDate = new Date(today)
    startDate.setDate(today.getDate() - 7)
    
    const endDate = new Date(today)
    endDate.setDate(today.getDate() + 30)
    
    return {
      start: `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')} 00:00`,
      end: `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')} 23:59`
    }
  }
  
  // Find earliest and latest dates from jobs
  let earliestDate = new Date()
  let latestDate = new Date(0) // Initialize with oldest possible date
  
  jobs.value.forEach(job => {
    const loadingDate = job.planLoadingDate || job.realLoadingDate
    const unloadingDate = job.planUnloadingDate || job.realUnloadingDate
    
    if (loadingDate) {
      const date = new Date(loadingDate)
      if (date < earliestDate) earliestDate = date
    }
    
    if (unloadingDate) {
      const date = new Date(unloadingDate)
      if (date > latestDate) latestDate = date
    }
  })
  
  // Add 30 days to the latest date
  latestDate.setDate(latestDate.getDate() + 30)
  
  return {
    start: `${earliestDate.getFullYear()}-${String(earliestDate.getMonth() + 1).padStart(2, '0')}-${String(earliestDate.getDate()).padStart(2, '0')} 00:00`,
    end: `${latestDate.getFullYear()}-${String(latestDate.getMonth() + 1).padStart(2, '0')}-${String(latestDate.getDate()).padStart(2, '0')} 23:59`
  }
})

// Scroll to today's date
const scrollToToday = () => {
  setTimeout(() => {
    if (ganttContainer.value && scrollbarContainer.value) {
      // Calculate today's position in the chart
      const today = new Date('2025-03-01T00:00:00Z') // Fixed date for demo
      
      // Get chart start and end dates
      const chartStart = new Date(chartDateRange.value.start)
      const chartEnd = new Date(chartDateRange.value.end)
      
      // Calculate the total milliseconds in the chart
      const totalMs = chartEnd.getTime() - chartStart.getTime()
      
      // Calculate milliseconds from start to today
      const msFromStart = today.getTime() - chartStart.getTime()
      
      // Calculate the position as a percentage of the total width
      const positionPercentage = msFromStart / totalMs
      
      // Calculate the scroll position
      const scrollPosition = ganttContainer.value.scrollWidth * positionPercentage - (ganttContainer.value.clientWidth / 2)
      
      // Apply the scroll position
      ganttContainer.value.scrollLeft = Math.max(0, scrollPosition)
      scrollbarContainer.value.scrollLeft = Math.max(0, scrollPosition)
      
      // Set up scroll synchronization
      setupScrollSync()
    }
  }, 300)
}

// Synchronize scrolling between the scrollbar and the gantt chart
const setupScrollSync = () => {
  if (ganttContainer.value && scrollbarContainer.value) {
    ganttContainer.value.addEventListener('scroll', () => {
      scrollbarContainer.value.scrollLeft = ganttContainer.value.scrollLeft
    })
    
    scrollbarContainer.value.addEventListener('scroll', () => {
      ganttContainer.value.scrollLeft = scrollbarContainer.value.scrollLeft
    })
  }
}

// Call fetchData when component is mounted
onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="calendar-wrapper">
    <div v-if="isLoading" class="loading">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
      <p class="text-gray-600">Loading trucks and jobs...</p>
    </div>
    
    <div v-else-if="error" class="error">
      <p>{{ error }}</p>
    </div>
    
    <div v-else-if="getRowsData.length === 0" class="no-data">
      <p>No scheduled jobs found for any trucks.</p>
    </div>
    
    <template v-else>
      <div class="gantt-container">
        <!-- Fixed column for truck names -->
        <div class="truck-column">
          <div class="truck-column-header">
            <h2>Logistics Schedule</h2>
          </div>
          <div 
            v-for="row in getRowsData" 
            :key="row.id" 
            class="truck-row-fixed"
          >
            <div class="truck-plate">
              <span class="full-plate">{{ row.plateNumber }}</span>
              <span class="short-plate">{{ row.plateNumber.slice(-7) }}</span>
            </div>
            <div class="truck-type">{{ row.type }}</div>
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
              :chart-start="chartDateRange.start"
              :chart-end="chartDateRange.end"
              precision="day"
              width="auto"
              bar-start="myBeginDate"
              bar-end="myEndDate"
              grid
              row-height="60"
              class="gantt-chart"
              :column-width="50"
              :min-column-width="50"
              :date-format="{ month: 'short', day: 'numeric' }"
            >
              <!-- Custom header template to show only day numbers -->
              <template #chart-header-cell="{ column }">
                <div class="day-number">
                  {{ new Date(column.time).getDate() }}
                </div>
                <div class="month-name" v-if="new Date(column.time).getDate() === 1 || column.index === 0">
                  {{ new Date(column.time).toLocaleDateString('en-US', { month: 'short' }) }}
                </div>
              </template>
              
              <g-gantt-row 
                v-for="row in getRowsData" 
                :key="row.id" 
                :label="''" 
                :bars="row.bars" 
              />
            </g-gantt-chart>
          </div>
        </div>
      </div>
      
      <div class="legend-container">
        <div class="legend">
          <div class="legend-item">
            <span class="color-box" style="background-color: #4CAF50;"></span>
            <span>Assigned</span>
          </div>
          <div class="legend-item">
            <span class="color-box" style="background-color: #FF9800;"></span>
            <span>In Progress</span>
          </div>
          <div class="legend-item">
            <span class="color-box" style="background-color: #2196F3;"></span>
            <span>Pending</span>
          </div>
          <div class="legend-item">
            <span class="color-box" style="background-color: #F44336;"></span>
            <span>Delayed</span>
          </div>
          <div class="legend-item">
            <span class="color-box" style="background-color: #9E9E9E;"></span>
            <span>Completed</span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

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
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin: 20px 0;
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
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 10px;
}

.truck-column-header h2 {
  margin: 0;
  font-size: 1.2rem;
  color: #333;
  font-weight: 500;
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
  left: 150px;
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
  min-width: 2500px; /* Match the total width of all columns */
}

.loading, .error, .no-data {
  text-align: center;
  padding: 2rem;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #666;
}

.error {
  color: #d32f2f;
}

.no-data {
  color: #607D8B;
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

.month-name {
  font-size: 12px;
  color: #666;
  text-align: center;
  margin-top: 4px;
}

:deep(.g-gantt-chart-header) {
  padding-top: 0 !important;
  margin-top: 16px;
}

:deep(.g-gantt-chart-header-cell) {
  padding: 8px 0;
  height: 84px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 50px !important; /* Ensure minimum width is maintained */
  width: 50px !important; /* Force fixed width */
  flex-shrink: 0; /* Prevent column shrinking */
}

.short-plate {
  display: none;
}

.legend-container {
  width: 100%;
  display: flex;
  justify-content: center;
  margin: 10px 0;
}

.legend {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  padding: 10px 15px;
  border-top: 1px solid #eee;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  max-width: 100%;
  margin: 0 20px;
}

.legend-item {
  display: flex;
  align-items: center;
  margin-right: 20px;
  margin-bottom: 5px;
}

.color-box {
  width: 16px;
  height: 16px;
  border-radius: 3px;
  margin-right: 6px;
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
  
  .scrollbar-container {
    left: 75px;
  }
  
  .legend {
    padding: 8px;
  }
  
  .legend-item {
    margin-right: 12px;
    font-size: 12px;
  }
}
</style>

