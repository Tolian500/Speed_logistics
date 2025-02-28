<script setup>
import { RouterLink } from 'vue-router';
import { defineProps, ref, computed, watch } from 'vue';
import { useToast } from 'vue-toastification';
import axios from 'axios';
import VueDatePicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css'
import { VueFinalModal } from 'vue-final-modal'
import 'vue-final-modal/style.css'

const props = defineProps({
  job: Object,
});

const toast = useToast();

const formatDate = (date) => {
  if (!date) return 'Not set';
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day}.${month}.${year} ${hours}:${minutes}`;
};
</script>

<template>
<div class="grid grid-cols-1 md:grid-cols-1 gap-6">
          <!-- Job Listing 1 -->
          <div class="bg-white rounded-xl shadow-md relative">
            <div class="p-4">
              <div class="mb-6">
                <div class="text-gray-600 my-2">Full-Time</div>
                <h3 class="text-xl font-bold">Senior Vue Developer</h3>
              </div>

              <div class="mb-5">
                We are seeking a talented Front-End Developer to join our team
                in Boston, MA. The ideal candidate will have strong skills in
                HTML, CSS, and JavaScript...
              </div>

              <h3 class="text-green-500 mb-2">$70 - $80K / Year</h3>

              <div class="border border-gray-100 mb-5"></div>

              <div class="flex flex-col lg:flex-row justify-between mb-4">
                <div class="text-orange-700 mb-3">
                  <i class="fa-solid fa-location-dot text-lg"></i>
                  Boston, MA
                </div>
                <a
                  href="job.html"
                  class="h-[36px] bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-center text-sm"
                >
                  Read More
                </a>
              </div>
            </div>
          </div>
        </div>
  
</template>