<template>
    <g-gantt-chart
      chart-start="2021-07-11 12:00"
      chart-end="2021-07-15 12:00"
      precision="hour"
      width="100%"
      bar-start="myBeginDate"
      bar-end="myEndDate"
    >
      <g-gantt-row
        label="My row 1"
        :bars="myBarList"
      />
    </g-gantt-chart>
  </template>
  
  <script setup>
  
  import { ref } from "vue"
  
  const myBarList = ref([])
  const addNewBar = () => {
    const bar = {
      myBeginDate: "2021-07-11 17:00",
      myEndDate: "2021-07-12 03:00",
      ganttBarConfig : {
        id: "some-id-blabla" // make sure this is unique!
      }
    }
    myBarList.push(bar)
  }
  </script>