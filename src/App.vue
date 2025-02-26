<script setup>
import {ref, onMounted} from 'vue';


const name = ref('Logistics');
const status = ref('active');
const tasks = ref(['Task One', 'Task Two', 'Task Three']); 
const newTask = ref(''); // add default value

const toggleStatus = () => {
  if (status.value === 'active') {
    status.value = 'pending';
  } else if (status.value === 'pending') {
    status.value = 'inactive';
  } else {
    status.value = 'active';
  }
};

const addTask = () => {
  if (newTask.value.trim() !== '') {
    tasks.value.push(newTask.value);
    newTask.value = '';
  }
}

const deleteTask = (index) => {
  tasks.value.splice(index,1)
};

onMounted(async () =>{
  try {
    const response = await fetch('https://jsonplaceholder.typicode.com/todos');
    const data = await response.json();
    tasks.value = data.slice(0, 10).map((task) => task.title);
  } catch (error) {
    console.error('Error fetching tasks:', error);
  }
});
</script>

<template>
  <h1>Hello {{name}}</h1>
  <p v-if="status === 'active'">User is active</p>
  <p v-else-if="status === 'pending'">User is pending</p>
  <p v-else>User is inactive</p>


  <form @submit.prevent="addTask">
    <label for="newTask">New Task</label>
    <input type="text" id="newTask" name="newTask" v-model="newTask">
    <button type="submit">Add Task</button>
  </form>
  <h3>Tasks</h3>
  <ul>
    <li v-for="(task,index) in tasks" :key="task">
      <span> {{ task }}</span>
      <button @click="deleteTask(index)">x</button>
    </li>
  </ul>
  <br />
  <button @click="toggleStatus">Change Status</button>
</template>
