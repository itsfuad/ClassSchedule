<script>
    import { onMount } from 'svelte';
    import { COURSES } from './courses.js';
  
    let days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday'];
    let selectedCourses = {
      Sunday: [{ course: '', time: '' }],
      Monday: [{ course: '', time: '' }],
      Tuesday: [{ course: '', time: '' }],
      Wednesday: [{ course: '', time: '' }],
    };
  
    function addCourse(day) {
      selectedCourses[day].push({ course: '', time: '' });
    }
  
    function deleteCourse(day, index) {
      if (selectedCourses[day].length > 1) {
        selectedCourses[day].splice(index, 1);
      }
    }
  
    function handleSubmit(event) {
      event.preventDefault();
      console.log(selectedCourses);
      //submit selectedCourses to the server or do something else
    }
  </script>
  
  <style>
    /* Add some CSS to style the form */
    form {
      display: flex;
      flex-wrap: wrap;
    }
  
    .day-container {
      width: 25%;
      padding: 16px;
    }
  
    .day-header {
      font-weight: bold;
      margin-bottom: 8px;
    }
  
    .course-container {
      display: flex;
      align-items: center;
      margin-bottom: 8px;
    }
  
    .course-select {
      width: 60%;
      margin-right: 8px;
    }
  
    .time-input {
      width: 20%;
    }
  
    .add-course,
    .delete-course {
      cursor: pointer;
      margin-left: 8px;
    }
  
    /* Add some animation */
    .course-container:nth-child(2) {
      transition: all 0.2s ease-in;
    }
  
    .course-container:nth-child(2) {
      transform: scale(1.05);
    }
  
    .course-container:hover {
      transform: scale(1.05);
    }
  </style>
  
  <form on:submit={handleSubmit}>
    {#each days as day}
        <div class="day-container">
            <div class="day-header">{day}</div>
            {#each selectedCourses[day] as { course, time }, index}
                <div class="course-container">
                <select class="course-select" bind:value={course}>
                    <option value="" disabled>Select a course</option>
                    {#each COURSES as option}
                    <option value={option}>{option}</option>
                    {/each}
                </select>
                <input class="time-input" type="time" bind:value={time}>
                <span class="delete-course" on:click={() => deleteCourse(day, index)}>
                    X
                </span>
                </div>
            {/each}
            <span class="add-course" on:click={() => addCourse(day)}>Add course</span>
        </div>
    {/each}
    <button type="submit">Submit</button>
</form>
        

  