<script setup>
import router from '@/router';
import { reactive } from 'vue';
import { useToast } from 'vue-toastification';
import axios from 'axios';

const form = reactive({
      type: "",
      startlocationCountry: "",
      startlocationCity: "",
      destinationCountry: "",
      destinationCity: "",
      client: "",
      cargoName: "",
      cargoDescription: "",
      planLoadingDate: "",
      realLoadingDate: "",
      planUnloadingDate: "",
      realUnloadingDate: "",
      addDate: "",
      lastUpdate: ""
});

const toast = useToast();

const formatDateWithDefaultTime = (date, isLoading = true) => {
  if (!date) return "";
  // Create date object from the input date
  const selectedDate = new Date(date);
  // Set default time: 8:00 for loading, 16:00 for unloading
  selectedDate.setHours(isLoading ? 8 : 16, 0, 0, 0);
  // Return ISO string
  return selectedDate.toISOString();
};

const handleSubmit = async () => {
  const newJob = {
    type: form.type,
    startlocationCountry: form.startlocationCountry,
    startlocationCity: form.startlocationCity,
    destinationCountry: form.destinationCountry,
    destinationCity: form.destinationCity,
    client: form.client,
    cargoName: form.cargoName,
    cargoDescription: form.cargoDescription,
    planLoadingDate: formatDateWithDefaultTime(form.planLoadingDate, true),
    realLoadingDate: form.realLoadingDate,
    planUnloadingDate: formatDateWithDefaultTime(form.planUnloadingDate, false),
    realUnloadingDate: form.realUnloadingDate,
    addDate: new Date().toISOString(),
    lastUpdate: new Date().toISOString()
  };

  try {
    const response = await axios.post('/api/jobs', newJob);
    toast.success('Job Added Successfully');
    router.push(`/jobs/${response.data.id}`);
  } catch (error) {
    console.error('Error adding job', error);
    toast.error('Job Was Not Added');
  }
};
</script>

<template>
  <section class="bg-green-50">
    <div class="container m-auto max-w-2xl py-24">
      <div
        class="bg-white px-6 py-8 mb-4 shadow-md rounded-md border m-4 md:m-0"
      >
        <form @submit.prevent="handleSubmit">
          <h2 class="text-3xl text-center font-semibold mb-6">Add Job</h2>

          <div class="mb-4">
            <label for="type" class="block text-gray-700 font-bold mb-2">Job Type</label>
            <select
              v-model="form.type"
              id="type"
              name="type"
              class="border rounded w-full py-2 px-3"
              required
            >
              <option value="Semi Trailer">Semi Trailer</option>
              <option value="Tief bet">Tief bet</option>
              <option value="Box Truck">Box Truck</option>
            </select>
          </div>

          <div class="mb-4">
            <label class="block text-gray-700 font-bold mb-2">Start Location</label>
            <input
              type="text"
              v-model="form.startlocationCountry"
              id="startlocationCountry"
              name="startlocationCountry"
              class="border rounded w-full py-2 px-3 mb-2"
              placeholder="Country"
              required
            />
            <input
              type="text"
              v-model="form.startlocationCity"
              id="startlocationCity"
              name="startlocationCity"
              class="border rounded w-full py-2 px-3"
              placeholder="City"
              required
            />
          </div>

          <div class="mb-4">
            <label class="block text-gray-700 font-bold mb-2">Destination</label>
            <input
              type="text"
              v-model="form.destinationCountry"
              id="destinationCountry"
              name="destinationCountry"
              class="border rounded w-full py-2 px-3 mb-2"
              placeholder="Country"
              required
            />
            <input
              type="text"
              v-model="form.destinationCity"
              id="destinationCity"
              name="destinationCity"
              class="border rounded w-full py-2 px-3"
              placeholder="City"
              required
            />
          </div>

          <div class="mb-4">
            <label class="block text-gray-700 font-bold mb-2">Client</label>
            <input
              type="text"
              v-model="form.client"
              id="client"
              name="client"
              class="border rounded w-full py-2 px-3"
              placeholder="Client Name"
              required
            />
          </div>

          <div class="mb-4">
            <label class="block text-gray-700 font-bold mb-2">Cargo Name</label>
            <input
              type="text"
              v-model="form.cargoName"
              id="cargoName"
              name="cargoName"
              class="border rounded w-full py-2 px-3"
              placeholder="Name of the cargo"
              required
            />
          </div>

          <div class="mb-4">
            <label class="block text-gray-700 font-bold mb-2">Cargo Description</label>
            <textarea
              v-model="form.cargoDescription"
              id="cargoDescription"
              name="cargoDescription"
              class="border rounded w-full py-2 px-3"
              rows="3"
              placeholder="Describe the cargo details, special requirements, etc."
              required
            ></textarea>
          </div>

          <div class="mb-4">
            <label class="block text-gray-700 font-bold mb-2">Planned Loading Date</label>
            <input
              type="date"
              v-model="form.planLoadingDate"
              id="planLoadingDate"
              name="planLoadingDate"
              class="border rounded w-full py-2 px-3"
              required
            />
            <!-- <span class="text-sm text-gray-500 mt-1">Loading time will be set to 8:00 AM</span> -->
          </div>

          <div class="mb-4">
            <label class="block text-gray-700 font-bold mb-2">Planned Unloading Date</label>
            <input
              type="date"
              v-model="form.planUnloadingDate"
              id="planUnloadingDate"
              name="planUnloadingDate"
              class="border rounded w-full py-2 px-3"
              required
            />
            <!-- <span class="text-sm text-gray-500 mt-1">Unloading time will be set to 4:00 PM</span> -->
          </div>

          <div>
            <button
              class="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-full w-full focus:outline-none focus:shadow-outline"
              type="submit"
            >
              Add Job
            </button>
          </div>
        </form>
      </div>
    </div>
  </section>
</template>
