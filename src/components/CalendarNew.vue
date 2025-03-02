<script setup>
import { ref, onMounted, computed } from "vue"
import axios from "axios"
import PulseLoader from 'vue-spinner/src/PulseLoader.vue'

// Data for trucks and jobs
const trucks = ref([])
const jobs = ref([])
const isLoading = ref(true) // Start with loading state
const realDataRows = ref([])

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
        label: truck.plateNumber,
        bars: bars
      }
    })
    
    console.log('Created real data rows:', realDataRows.value)
    isLoading.value = false
  } catch (err) {
    console.error('Error fetching data:', err)
    isLoading.value = false
    
    // Set fallback date range in case of error
    const today = new Date()
    chartStartDate.value = formatDate(new Date(today.setDate(today.getDate() - 15)))
    chartEndDate.value = formatDate(new Date(today.setDate(today.getDate() + 30)))
  }
}

onMounted(() => {
  fetchData()
})
</script>

<template>
  <div v-if="isLoading" class="loading">
    <PulseLoader :loading="true" color="#4CAF50" size="15px" />
    <p class="text-gray-600 mt-4">Loading...</p>
  </div>

  <g-gantt-chart
    v-else
    :chart-start="chartStartDate"
    :chart-end="chartEndDate"
    precision="day"
    bar-start="myBeginDate"
    bar-end="myEndDate"
    grid
    enable-drag
    no-overlap
    current-time
    label-column-title="Trucks"
    @drag-end="(e) => console.log('Drag ended:', e)"
  >
    <!-- Custom upper time unit (months) -->
    <template #upper-timeunit="{ label, value }">
      <div class="custom-upper-timeunit">
        {{ label }}
      </div>
    </template>
    
    <!-- Custom time unit (days) with day number and day of week -->
    <template #timeunit="{ label, value }">
      <div class="custom-timeunit">
        <div class="day-number">{{ new Date(value).getDate() }}</div>
        <div class="day-of-week">{{ getDayOfWeek(value) }}</div>
      </div>
    </template>
    
    <g-gantt-row 
      v-for="row in realDataRows" 
      :key="row.label"
      :label="row.label"
      :bars="row.bars"
    />
  </g-gantt-chart>
</template>

<style scoped>
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

/* Custom styles for time units */


.custom-timeunit {
  padding: 5px 3px;
  border-right: 1px solid #eee;
  text-align: center;
  min-height: 50px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.day-number {
  font-size: 0.8rem;

  color: #333;
}

.day-of-week {
  font-size: 0.7rem;
  color: #666;
  margin-top: 2px;
}

/* Weekend styling */
.custom-timeunit:has(.day-of-week:contains('Sat')),
.custom-timeunit:has(.day-of-week:contains('Sun')) {
  background-color: #f9f9f9;
}
</style>

