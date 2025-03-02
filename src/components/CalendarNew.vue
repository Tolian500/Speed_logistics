<script setup>
import { ref, onMounted, computed, onUnmounted } from "vue"
import axios from "axios"
import PulseLoader from 'vue-spinner/src/PulseLoader.vue'

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
  
  // Get all assigned job IDs
  const assignedJobIds = new Set()
  trucks.value.forEach(truck => {
    const currentJobId = truck.currentJob
    const nextJobIds = truck.nextJobQueue || []
    const allJobIds = [currentJobId, ...nextJobIds].filter(id => id)
    allJobIds.forEach(id => assignedJobIds.add(id))
  })
  
  // Get unassigned jobs
  const unassignedJobs = jobs.value.filter(job => !assignedJobIds.has(job.id))
  
  // Create rows for trucks
  const truckRows = trucks.value.map(truck => {
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

  // Create unassigned jobs row
  const unassignedRow = {
    id: 'unassigned',
    plateNumber: 'Unassigned Jobs',
    type: '',
    label: 'Unassigned Jobs',
    bars: unassignedJobs.map(job => {
      const startDate = job.realLoadingDate || job.planLoadingDate
      const endDate = job.realUnloadingDate || job.planUnloadingDate
      
      if (!startDate || !endDate) return null

      return {
        myBeginDate: formatDate(startDate),
        myEndDate: formatDate(endDate),
        ganttBarConfig: {
          id: `job-${job.id}`,
          label: `${job.cargoName} (${job.startlocationCity} → ${job.destinationCity})`,
          hasHandles: true,
          style: {
            background: '#9C27B0', // Purple for unassigned jobs
            borderRadius: "6px",
            color: "white",
            boxShadow: "1px 1px 3px rgba(0,0,0,0.2)",
            border: '2px dashed #fff'
          }
        }
      }
    }).filter(job => job !== null)
  }

  // Add unassigned row at the bottom instead of top
  return [...truckRows, unassignedRow]
})

// Add helper functions that were missing
const formatDate = (dateString) => {
  if (!dateString) return null
  const date = new Date(dateString)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

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
      start: formatDate(startDate),
      end: formatDate(endDate)
    }
  }
  
  // Find earliest and latest dates from jobs
  let earliestDate = new Date()
  let latestDate = new Date(0) // Initialize with oldest possible date
  
  jobs.value.forEach(job => {
    const loadingDate = job.realLoadingDate || job.planLoadingDate
    const unloadingDate = job.realUnloadingDate || job.planUnloadingDate
    
    if (loadingDate) {
      const date = new Date(loadingDate)
      if (date < earliestDate) earliestDate = date
    }
    
    if (unloadingDate) {
      const date = new Date(unloadingDate)
      if (date > latestDate) latestDate = date
    }
  })
  
  // Add buffer days
  earliestDate.setDate(earliestDate.getDate() - 7)
  latestDate.setDate(latestDate.getDate() + 7)
  
  return {
    start: formatDate(earliestDate),
    end: formatDate(latestDate)
  }
})

// Add scroll to today function
const scrollToToday = () => {
  if (ganttContainer.value) {
    const today = new Date()
    const chartStart = new Date(chartDateRange.value.start)
    const totalDays = (new Date(chartDateRange.value.end) - chartStart) / (1000 * 60 * 60 * 24)
    const daysFromStart = (today - chartStart) / (1000 * 60 * 60 * 24)
    const scrollPercentage = daysFromStart / totalDays
    
    const scrollPosition = ganttContainer.value.scrollWidth * scrollPercentage
    ganttContainer.value.scrollLeft = scrollPosition
  }
}

// Call fetchData when component is mounted
onMounted(() => {
  fetchData()
})
</script>

<template>
  <div v-if="isLoading" class="loading">
    <PulseLoader :loading="true" color="#4CAF50" size="15px" />
    <p class="text-gray-600 mt-4">Loading trucks and jobs...</p>
  </div>
  
  <div v-else-if="error" class="error">
    <p>{{ error }}</p>
  </div>
  
  <div v-else-if="getRowsData.length === 0" class="no-data">
    <p>No scheduled jobs found for any trucks.</p>
  </div>
  
  <g-gantt-chart
    v-else
    :chart-start="chartDateRange.start"
    :chart-end="chartDateRange.end"
    precision="day"
    bar-start="myBeginDate"
    bar-end="myEndDate"
    :current-time="true"
    current-time-label="Today"
    label-column-title="Fleet"
    :label-column-width="150"
    :row-height="60"
    :column-width="50"
    grid
    ref="ganttContainer"
  >
    <!-- Custom month display in upper timeunit -->
    <template #upper-timeunit="{ label, value }">
      <div class="upper-timeunit">
        {{ new Date(value).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) }}
      </div>
    </template>

    <!-- Custom day display in timeunit -->
    <template #timeunit="{ label, value }">
      <div class="timeunit">
        <div class="day-number">{{ new Date(value).getDate() }}</div>
        <div class="day-name">{{ new Date(value).toLocaleDateString('en-US', { weekday: 'short' }) }}</div>
      </div>
    </template>

    <!-- Custom tooltip for bars -->
    <template #bar-tooltip="{ bar }">
      <div class="custom-tooltip">
        <div class="tooltip-title">{{ bar.label }}</div>
        <div class="tooltip-dates">
          <div>Start: {{ new Date(bar.myBeginDate).toLocaleDateString() }}</div>
          <div>End: {{ new Date(bar.myEndDate).toLocaleDateString() }}</div>
        </div>
      </div>
    </template>

    <!-- Custom current time label -->
    <template #current-time-label>
      <div class="current-time-label">
        <span class="current-time-dot"></span>
        Current Time
      </div>
    </template>

    <!-- Custom column title -->
    <template #label-column-title>
      <div class="label-column-header">
        <h3>Truck Fleet</h3>
        <p class="subtitle">Vehicle Schedule</p>
      </div>
    </template>

    <!-- Custom row label with special styling for unassigned row -->
    <template #label-column-row="{ label }">
      <div :class="['truck-label', { 'unassigned-label': label === 'Unassigned Jobs' }]">
        <div class="truck-number">{{ label }}</div>
      </div>
    </template>

    <g-gantt-row 
      v-for="row in getRowsData" 
      :key="row.id" 
      :label="row.plateNumber"
      :bars="row.bars" 
    />
  </g-gantt-chart>
</template>

<style scoped>
.loading, .error, .no-data {
  text-align: center;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

.error {
  color: #d32f2f;
}

.no-data {
  color: #607D8B;
}

.mt-4 {
  margin-top: 1rem;
}

.upper-timeunit {
  font-weight: 600;
  color: #1a1a1a;
  padding: 8px 0;
  text-align: center;
  background-color: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
}

.timeunit {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4px 0;
}

.day-number {
  font-weight: 600;
  font-size: 14px;
}

.day-name {
  font-size: 12px;
  color: #666;
}

.custom-tooltip {
  background: white;
  border-radius: 4px;
  padding: 8px 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  min-width: 200px;
}

.tooltip-title {
  font-weight: 600;
  margin-bottom: 8px;
  color: #1a1a1a;
}

.tooltip-dates {
  font-size: 13px;
  color: #666;
}

.current-time-label {
  display: flex;
  align-items: center;
  gap: 6px;
  background: white;
  padding: 4px 8px;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.current-time-dot {
  width: 8px;
  height: 8px;
  background: #4CAF50;
  border-radius: 50%;
}

.label-column-header {
  padding: 12px;
  background: #f9f9f9;
  border-bottom: 1px solid #e0e0e0;
}

.label-column-header h3 {
  margin: 0;
  font-size: 16px;
  color: #1a1a1a;
}

.label-column-header .subtitle {
  margin: 4px 0 0;
  font-size: 12px;
  color: #666;
}

.unassigned-label {
  background-color: #f3e5f5;
  border-left: 4px solid #9C27B0;
  font-weight: 600;
}

.truck-label {
  padding: 8px 12px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid #eee;
}

.truck-number {
  font-weight: 500;
  color: #1a1a1a;
}
</style>
  
