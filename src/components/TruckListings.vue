<script setup>
import { reactive, onMounted } from 'vue';
import TruckListing from '@/components/TruckListing.vue';
import axios from 'axios';
import PulseLoader from 'vue-spinner/src/PulseLoader.vue';

const state = reactive({
    jobs: [],
    isLoading: true
});

onMounted(async () => {
    try{
        const response = await axios.get('http://localhost:5000/jobs');
        state.jobs = response.data;
    } catch (error) {
        console.error('Error fetching jobs:', error);
    } finally {
        state.isLoading = false;
    }
});

</script>

<template>
    <section class="bg-blue-50 px-4 py-10">
        <div class="container-xl lg:container m-auto"></div>
        <h2 class="text-3xl font-bold text-green-500 mb-6 text-center">
            Latest Truck Listings
        </h2>
        <!-- Loading Spinner while loading is true-->
        <div v-if="state.isLoading" class="text-center text-gray-500">
            <PulseLoader />
        </div>
        <!-- Display the jobs when loading is done-->
        <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <TruckListing v-for="job in state.jobs" :key="job.id" :job="job">
                <h2>{{ job.title }}</h2>
            </TruckListing>
        </div>


    </section>


</template>
