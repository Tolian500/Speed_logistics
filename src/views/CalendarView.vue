<script setup>
import Calendar from '@/components/Calendar.vue';
import CalendarNew from '@/components/CalendarNew.vue';
</script>

<template>
    <div class="calendar-view">
        <!-- <div class="header bg-white p-4 shadow-sm mb-4 rounded-lg">
            <h1 class="text-2xl font-bold text-green-600 mb-2">Logistics Calendar</h1>
            <p class="text-gray-600">View and manage your truck assignments and job schedules</p>
        </div> -->
        
        <div class="calendar-container bg-white p-4 rounded-lg shadow-sm">
            <CalendarNew />
        </div>
    </div>
</template>

<style scoped>
.calendar-view {
    padding: 1rem;
    background-color: #f0f9ff;
    min-height: calc(100vh - 64px);
    display: flex;
    flex-direction: column;
}

.header {
    flex-shrink: 0;
}

.calendar-container {
    flex-grow: 1;
    width: 100%;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    padding: 0;
}
</style>