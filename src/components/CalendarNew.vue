<script setup>
import { ref, onMounted, computed } from "vue"
import axios from "axios"
import PulseLoader from 'vue-spinner/src/PulseLoader.vue'

// Data for trucks and jobs
const trucks = ref([])
const jobs = ref([])
const isLoading = ref(true) // Start with loading state
const realDataRows = ref([])
const ganttContainer = ref(null)
const scrollbarContainer = ref(null)

// Chart date range
const chartStartDate = ref("")
const chartEndDate = ref("")

// Helper function to get day of week
const getDayOfWeek = (dateString) => {
  const date = new Date(dateString)
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return days[date.getDay()]
}

// Helper function to format dates correctly
const formatDate = (dateString) => {
  if (!dateString) return null
  const date = new Date(dateString)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

// Helper function to add or subtract days from a date
const addDays = (dateString, days) => {
  const date = new Date(dateString)
  date.setDate(date.getDate() + days)
  return formatDate(date)
}

// Fetch data
const fetchData = async () => {
  try {
    isLoading.value = true
    const [trucksResponse, jobsResponse] = await Promise.all([
      axios.get('/api/trucks'),
      axios.get('/api/jobs')
    ])
    
    trucks.value = trucksResponse.data
    jobs.value = jobsResponse.data
    
    // Find earliest and latest dates from jobs
    let earliestDate = null
    let latestDate = null
    
    jobs.value.forEach(job => {
      const startDate = job.realLoadingDate || job.planLoadingDate
      const endDate = job.realUnloadingDate || job.planUnloadingDate
      
      if (startDate && (!earliestDate || new Date(startDate) < new Date(earliestDate))) {
        earliestDate = startDate
      }
      
      if (endDate && (!latestDate || new Date(endDate) > new Date(latestDate))) {
        latestDate = endDate
      }
    })
    
    // Set chart date range with 15-day buffer on each side
    if (earliestDate && latestDate) {
      chartStartDate.value = addDays(earliestDate, -15)
      chartEndDate.value = addDays(latestDate, 15)
      console.log('Chart date range:', { start: chartStartDate.value, end: chartEndDate.value })
    } else {
      // Fallback to a default range if no valid dates found
      const today = new Date()
      chartStartDate.value = formatDate(new Date(today.setDate(today.getDate() - 15)))
      chartEndDate.value = formatDate(new Date(today.setDate(today.getDate() + 30)))
    }
    
    // Create real data rows
    realDataRows.value = trucks.value.map((truck, index) => {
      // Get all jobs for this truck
      const currentJobId = truck.currentJob
      const nextJobIds = truck.nextJobQueue || []
      const allJobIds = [currentJobId, ...nextJobIds].filter(id => id)
      const truckJobs = jobs.value.filter(job => allJobIds.includes(job.id))
      
      // Create bars for each job
      const bars = truckJobs.map(job => {
        const startDate = formatDate(job.realLoadingDate || job.planLoadingDate)
        const endDate = formatDate(job.realUnloadingDate || job.planUnloadingDate)
        
        if (!startDate || !endDate) return null
        
        return {
          myBeginDate: startDate,
          myEndDate: endDate,
          ganttBarConfig: {
            id: `job-${job.id}`,
            hasHandles: true,
            label: `${job.cargoName || 'Cargo'} (${job.startlocationCity || 'Start'} → ${job.destinationCity || 'End'})`,
            style: {
              background: job.status === 'completed' ? '#9E9E9E' :
                         job.status === 'doing' ? '#FF9800' :
                         job.status === 'delayed' ? '#F44336' :
                         job.status === 'assigned' ? '#4CAF50' :
                         '#2196F3', // default/pending
              borderRadius: "20px",
              color: "white"
            }
          }
        }
      }).filter(bar => bar !== null)
      
      // If no valid bars, create a placeholder
      if (bars.length === 0) {
        bars.push({
          myBeginDate: chartStartDate.value,
          myEndDate: addDays(chartStartDate.value, 1),
          ganttBarConfig: {
            id: `truck-${index}-placeholder`,
            hasHandles: true,
            label: "No scheduled jobs",
            style: {
              background: "#e0e0e0",
              borderRadius: "20px",
              color: "#666"
            }
          }
        })
      }
      
      return {
        id: truck.id,
        plateNumber: truck.plateNumber,
        type: truck.type || 'Standard',
        label: '',
        bars: bars
      }
    })
    
    console.log('Created real data rows:', realDataRows.value)
    isLoading.value = false
    
    // Set up scroll synchronization after data is loaded
    setTimeout(() => {
      setupScrollSync()
    }, 300)
  } catch (err) {
    console.error('Error fetching data:', err)
    isLoading.value = false
    
    // Set fallback date range in case of error
    const today = new Date()
    chartStartDate.value = formatDate(new Date(today.setDate(today.getDate() - 15)))
    chartEndDate.value = formatDate(new Date(today.setDate(today.getDate() + 30)))
  }
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

onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="calendar-wrapper">
    <div v-if="isLoading" class="loading">
      <PulseLoader :loading="true" color="#4CAF50" size="15px" />
      <p class="text-gray-600 mt-4">Loading...</p>
    </div>

    <div v-else class="gantt-container">
      <!-- Fixed column for truck names -->
      <div class="truck-column">
        <div class="truck-column-header">
          <h2>Logistics Schedule</h2>
        </div>
        <div 
          v-for="row in realDataRows" 
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
            :chart-start="chartStartDate"
            :chart-end="chartEndDate"
            precision="day"
            width="auto"
            bar-start="myBeginDate"
            bar-end="myEndDate"
            grid
            enable-drag
            no-overlap
            current-time
            :row-height="60"
            class="gantt-chart"
            :column-width="50"
            :min-column-width="50"
          >
            <!-- Custom header template to show only day numbers -->
            <template #chart-header-cell="{ column }">
              <div class="day-number">
                {{ new Date(column.time).getDate() }}
              </div>
              <div class="day-of-week">
                {{ getDayOfWeek(column.time) }}
              </div>
            </template>
            
            <g-gantt-row 
              v-for="row in realDataRows" 
              :key="row.id"
              :label="''"
              :bars="row.bars"
            />
          </g-gantt-chart>
        </div>
      </div>
    </div>
    
    <!-- Legend -->
    <div v-if="!isLoading" class="legend-container">
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
  </div>
</template>

<style scoped>
.calendar-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
}

.loading {
  text-align: center;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

.mt-4 {
  margin-top: 1rem;
}

/* Gantt container and fixed column styles */
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

.truck-plate {
  font-weight: 600;
  font-size: 14px;
}

.truck-type {
  font-size: 12px;
  color: #666;
}

.short-plate {
  display: none;
}

/* Scrollbar and gantt scroll container */
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

.day-number {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  text-align: center;
}

.day-of-week {
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

/* Legend styles */
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

