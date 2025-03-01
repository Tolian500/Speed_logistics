<script setup>
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  count: {
    type: Number,
    default: null
  },
  bgColor: {
    type: String,
    default: 'bg-blue-50'
  },
  expandable: {
    type: Boolean,
    default: false
  },
  expanded: {
    type: Boolean,
    default: false
  },
  marginY: {
    type: String,
    default: 'my-8' // Default vertical margin
  }
});

const emit = defineEmits(['toggle']);

const handleToggle = () => {
  if (props.expandable) {
    emit('toggle');
  }
};
</script>

<template>
  <div :class="['relative', marginY]">
    <div class="absolute inset-0 flex items-center">
      <div class="w-full border-t border-gray-300"></div>
    </div>
    <div class="relative flex justify-center">
      <button 
        v-if="expandable"
        @click="handleToggle" 
        :class="[bgColor, 'px-4 py-1 text-sm text-gray-600 hover:text-gray-800 rounded-full flex items-center gap-1 hover:bg-blue-100 transition-colors']"
      >
        <span>{{ title }} <span v-if="count !== null">({{ count }})</span></span>
        <i :class="[expanded ? 'pi pi-chevron-up' : 'pi pi-chevron-down', 'text-xs']"></i>
      </button>
      <span 
        v-else
        :class="[bgColor, 'px-4 text-sm text-gray-500']"
      >
        {{ title }}
      </span>
    </div>
  </div>
</template>