<script>
// @ts-nocheck

import { onMount } from 'svelte';
import { COURSES, titleCase } from './courses.js';
import { ROOMS } from './rooms.js';

console.log('%cmain.js loaded', 'color: green;');

let READY = false;

onMount(() => {
  console.log('%cApp mounted', 'color: green;');

  const dataAvailable = localStorage.getItem('data');
  if (dataAvailable){
    const parsedData = JSON.parse(dataAvailable);
    if (Object.keys(parsedData).length == 4){
      data = parsedData;
      console.log('%cData loaded', 'color: deepskyblue;');
      loadData();
    }else{
      console.log('%cInvalid data found', 'color: red;');
    }

  }else{
    console.log('%cNo data found', 'color: deepskyblue;');
    //change the title
    document.title = 'Select Courses';
    addCourse = function(){
      
      if (!selectedDay){
        errLog('Please select a day');
        return;
      }else{
        const temp = titleCase(selectedDay);
        if (!days.includes(temp)){
          errLog('Please select a valid day');
          return;
        }
      }
      if (!selectedCourse){
        errLog('Please select a course');
        return;
      }else{
        const temp = titleCase(selectedCourse);
        if (!COURSES.includes(temp)){
          errLog('Please select a valid course');
          return;
        }
      }
      if (!selectedRoom){
        errLog('Please select a room');
        return;
      }else{
        const temp = selectedRoom;
        if (!ROOMS.includes(temp)){
          errLog('Please select a valid room');
          return;
        }
      }
      if (!selectedTimeStart){
        errLog('Please select a start time');
        return;
      }
      if (!selectedTimeEnd){
        errLog('Please select an end time');
        return;
      }
      
      const [selectedTimeStartValue, selectedTimeEndValue] = timeParser(`${selectedTimeStart} - ${selectedTimeEnd}`);
      
      if (selectedTimeStartValue >= selectedTimeEndValue){
        errLog('Start time must be before end time');
        return;
      }
      if (selectedTimeStartValue == selectedTimeEndValue){
        errLog('Start time and end time cannot be the same');
        return;
      }
      if (selectedTimeStartValue < 480 || selectedTimeStartValue > 1080){
        errLog('Start time must be between 8:00 AM and 6:00 PM');
        return;
      }
      
      errorClass = '';

      const time = `${selectedTimeStart} - ${selectedTimeEnd}`;

      let error = false;

      if (data[selectedDay]){
        //get time range from data to see if it overlaps with any other time range
        Object.keys(data[selectedDay]).forEach(time => {

          const [timeStartValue, timeEndValue] = timeParser(time);

          if (selectedTimeStartValue >= timeStartValue && selectedTimeStartValue <= timeEndValue){
            errLog('Time range overlaps with another time range');
            error = true;
            return;
          }
          if (selectedTimeEndValue >= timeStartValue && selectedTimeEndValue <= timeEndValue){
            errLog('Time range overlaps with another time range');
            error = true;
            return;
          }
        });
      }

      if (!error){
        if (!data[selectedDay]){
          data[selectedDay] = {};
        }
        data[selectedDay][time] = [selectedCourse, selectedRoom];
      }

      if (!error){
        //update the display
       
        const li = document.createElement('li');
        li.classList.add('course');
        li.setAttribute('data-day', selectedDay);
        li.setAttribute('data-time', time);

        const deleteBtn = document.createElement('i');
        deleteBtn.classList.add('fa-solid', 'fa-trash', 'delete-btn');
        deleteBtn.setAttribute('title', 'Delete course');
        deleteBtn.style.color = 'indianred';
        deleteBtn.style.padding = '0 5px';
        deleteBtn.style.cursor = 'pointer';
        deleteBtn.style.fontSize = '0.9rem';

        li.textContent = `${selectedCourse} | ${selectedDay} [${timeConverter(time)}][${selectedRoom}]`;
        li.appendChild(deleteBtn);

        coursesAddedList.appendChild(li);
      }else{
        console.log('%cError adding course', 'color: red;');
      }
    }
  }
});

/**
* @param {string} time
* @returns {[number, number]}
*/
function timeParser(time){
  if (!time){
    return [0, 0];
  }
  const timeRange = time.split('-');
  const timeStart = timeRange[0].trim().split(':');
  const timeStartValue = parseInt(timeStart[0])*60 + parseInt(timeStart[1]);
  const timeEnd = timeRange[1].trim().split(':');
  const timeEndValue = parseInt(timeEnd[0])*60 + parseInt(timeEnd[1]);
  return [timeStartValue, timeEndValue];
}

//24h to 12h time
/**
 * @param {string} time
 * @returns {string}
 */
function timeConverter(time){
  if (!time){
    return '';
  }
  const timeRange = time.split('-');
  const timeStart = timeRange[0].trim().split(':');
  const timeStartValue = parseInt(timeStart[0])*60 + parseInt(timeStart[1]);
  const timeEnd = timeRange[1].trim().split(':');
  const timeEndValue = parseInt(timeEnd[0])*60 + parseInt(timeEnd[1]);
  const timeStart12h = timeStartValue < 720 ? `${timeStart[0]}:${timeStart[1]} AM` : `${timeStart[0] == 12 ? timeStart[0] : timeStart[0]-12}:${timeStart[1]} PM`;
  const timeEnd12h = timeEndValue < 720 ? `${timeEnd[0]}:${timeEnd[1]} AM` : `${timeEnd[0] == 12 ? timeEnd[0] : timeEnd[0]-12}:${timeEnd[1]} PM`;
  return `${timeStart12h} - ${timeEnd12h}`;
}

let addCourse;
let errorText, errorClass = '';

let charts;
let data = {};

const colors = {
    'Free': '#000800aa',
    'Break': '#077518',
};

const colorsArray = [
    '#405b91', 
    '#1d8ad3', 
    '#d34f1d', 
    '#d3251d', 
    '#009169', 
    '#008a91', 
    '#064491', 
    '#7d12df', 
    '#df1241',
    '#4d6a59',
];

let canvasSize;

if (document.body.clientHeight > document.body.clientWidth){
    canvasSize = document.body.clientWidth*0.6;
}else{
    canvasSize = document.body.clientHeight*0.6;
}

const font_size = canvasSize/15;

function loadData(){
  if (Object.keys(data).length < 4){
    errLog('Please complete the form');
    return;
  }
  if (!localStorage.getItem('data')){
    localStorage.setItem('data', JSON.stringify(data));
    console.log('%cData saved', 'color: deepskyblue;');
  }
  document.title = 'Your Schedule';
  init();
}

/**
 * @param {{ Sunday?: { '8:00 AM - 9:15 AM': string[]; '9:15 AM - 1:00 PM': string[]; '1:00 PM - 2:15 PM': string[]; '2:15 PM - 3:30 PM': string[]; '3:30 PM - 6:00 PM': string[]; }; Monday?: { '8:00 AM - 2:40 PM': string[]; '2:40 PM - 4:20 PM': string[]; '4:20 PM - 6:00 PM': string[]; }; Tuesday?: { '8:00 AM - 9:15 AM': string[]; '9:15 AM - 1:00 PM': string[]; '1:00 PM - 2:15 PM': string[]; '2:15 PM - 6:00 PM': string[]; }; Wednesday?: { '8:00 AM - 10:30 AM': string[]; '10:30 AM - 3:30 PM': string[]; '3:30 PM - 6:00 PM': string[]; }; }} data
 */
function init(){

    console.log('%cInitializing Charts', 'color: deepskyblue;');
    READY = true;

    Object.keys(data).forEach(day => {

        const canvas = document.createElement('canvas');
        charts.appendChild(canvas);
        const ctx = canvas.getContext('2d');
    
        canvas.height = canvasSize;
        canvas.width = canvasSize;
        
        const xCord = canvasSize / 2;
        const yCord = canvasSize / 2;
    
        const radius = canvasSize/3;
    
        ctx.beginPath();
        ctx.arc(xCord, yCord, radius, 0, 360 * Math.PI / 180);
        ctx.lineTo(xCord, yCord);
        ctx.fillStyle = '#111d2a';
        ctx.fill();
        
        Object.keys(data[day]).forEach( async (time) => {
            draw(day, time, ctx, xCord, yCord, radius);
        });
    
        //write the day name
        ctx.fillStyle = '#bdf';
        ctx.font = `${font_size}px Arial`;
        ctx.textAlign = 'center';
    
        ctx.fillText(day, xCord, canvasSize-font_size);
    });
}

function chooseColor(){
    const index = Math.floor(Math.random()*(colorsArray.length-1));
    const color = colorsArray[index];
    colorsArray.splice(index, 1);
    return color;
}

function errLog(err){
  errorClass = '';
  setTimeout(() => {
    errorText = err;
    errorClass = 'shake';
  }, 10);
}

/**
 * @param {string} day
 * @param {string} time
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} xCord
 * @param {number} yCord
 * @param {number} radius
 */
function draw(day, time, ctx, xCord, yCord, radius){

    const courseInfo = data[day][time];
    const courseName = courseInfo[0];

    if (!colors[courseName]){
        const color = chooseColor();
        colors[courseName] = color;
    }

    //extract the start time and end time from '1:00 PM - 2:15 PM' format
    const startTime = time.split(' - ')[0].trim();
    const endTime = time.split(' - ')[1].trim();

    //convert 24 hour time to 12 hour time with am pm
    const start = convertTime(startTime);
    const end = convertTime(endTime);

    const timeRange = `${start} - ${end}`;

    let startMinutes = parseInt(startTime.split(':')[0]) * 60 + parseInt(startTime.split(':')[1]);
    let endMinutes = parseInt(endTime.split(':')[0]) * 60 + parseInt(endTime.split(':')[1]);

    // fill area between start and end time
    const startAngle = (startMinutes) / 2 * Math.PI / 180 - (Math.PI / 2);
    const endAngle = (endMinutes) / 2 * Math.PI / 180 - (Math.PI / 2);

    //run writeLabel function after all fillTimeClock functions are done
   
    fillTimeClock(startAngle, endAngle, colors[courseName], ctx, xCord, yCord, radius);
    writeLabel(courseInfo, timeRange, startAngle, endAngle, ctx, xCord, yCord, radius);
}

/**
 * @param {string} time
 */
function convertTime(time){
    const hour = parseInt(time.split(':')[0]);
    const minutes = time.split(':')[1];
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
}

/**
 * @param {number} startAngle
 * @param {number} endAngle
 * @param {any} color
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} xCord
 * @param {number} yCord
 * @param {number} radius
 */
function fillTimeClock(startAngle, endAngle, color, ctx, xCord, yCord, radius) {
    ctx.beginPath();
    ctx.arc(xCord, yCord, radius, startAngle, endAngle);
    ctx.lineTo(xCord, yCord);
    ctx.fillStyle = color;
    ctx.fill();
}

/**
 * @param {any[]} courseName
 * @param {string} Time
 * @param {number} startAngle
 * @param {number} endAngle
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} xCord
 * @param {number} yCord
 * @param {number} radius
 */
function writeLabel(courseInfo, Time, startAngle, endAngle, ctx, xCord, yCord, radius) {
    ctx.fillStyle = '#bdf';
    ctx.font = `${font_size/2.5}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText(courseInfo[0], xCord + radius * Math.cos((startAngle + endAngle) / 2), yCord + radius * Math.sin((startAngle + endAngle) / 2));
    if (courseInfo[1]){
        ctx.fillText(courseInfo[1], xCord + radius * Math.cos((startAngle + endAngle) / 2), yCord + radius * Math.sin((startAngle + endAngle) / 2) + 15);
        ctx.fillText(Time, xCord + radius * Math.cos((startAngle + endAngle) / 2), yCord + radius * Math.sin((startAngle + endAngle) / 2) + 30);
    }else{
        ctx.fillText(Time, xCord + radius * Math.cos((startAngle + endAngle) / 2), yCord + radius * Math.sin((startAngle + endAngle) / 2) + 15);
    }
}

function reset(){
  errorClass = '';
}

const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday'];

let selectedCourse, selectedDay, selectedRoom, selectedTimeStart, selectedTimeEnd;

let coursesAddedList;

function handleDeleteCourse(evt){
  //if the target is not the ul element
  if (evt.target == coursesAddedList){
    return;
  }
  const course = evt.target?.closest('.course');
  if (course){
    const day = course.dataset.day;
    const time = course.dataset.time;
    if (data[day]){
      course.remove();
      course.remove();
      delete data[day][time];
      if (Object.keys(data[day]).length == 0){
        delete data[day];
      }
      console.log('%cCourse Deleted', 'color: red;');
    }
  }
}

</script>

<div id="charts" bind:this={charts}></div>

{#if !READY}
  <div id="coursesDisplay">
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <ul class="courses" bind:this={coursesAddedList} on:click={handleDeleteCourse}></ul>
    <label for="coursesDisplay" id="clb">Added Courses <i class="fa-solid fa-puzzle-piece"></i></label>
  </div>
  <div class="form">

    <div class="errLog {errorClass}">{errorText}</div>
    <div class="title mid">Select your courses and times <i class="fa-solid fa-calendar-days"></i></div>
    
    <div class="form-field">
      <input list="day" class="dropdown-list" bind:value={selectedDay} on:change={reset} placeholder=" - Select day - ">
      <datalist name="day" id="day">
        {#each days as day}
          <option class="list-item" value={day}>{day}</option>
        {/each}
      </datalist>
    </div>

    <div class="form-field">
      <input list="course" class="dropdown-list" bind:value={selectedCourse} on:change={reset} placeholder=" - Select course - ">
      <datalist name="course" id="course">
        {#each COURSES as course}
          <option class="list-item" value={course}>{course}</option>
        {/each}
      </datalist>
    </div>

    <div class="form-field">
      <input list="room" class="dropdown-list" bind:value={selectedRoom} on:change={reset} placeholder=" - Select room - ">
      <datalist name="room" id="room">
        {#each ROOMS as room}
          <option class="list-item" value={room}>{room}</option>
        {/each}
      </datalist>
    </div>

    <div class="form-group backgound padding">

      <div class="form-field">
        <label for="time" class="title small">Class starts</label>
        <input type="time" name="courseTime" id="time-start" bind:value={selectedTimeStart} on:change={reset}>
      </div>

      <div class="form-field">
        <label for="time" class="title small">Class ends</label>
        <input type="time" name="courseTime" id="time-end" bind:value={selectedTimeEnd} on:change={reset}>
      </div>

    </div>

    <div class="form-group">
      <button class="addButton" on:click={addCourse}>Add <i class="fa-solid fa-circle-plus"></i></button>
      <button class="clear" on:click={() => {
          selectedDay = '';
          selectedCourse = '';
          selectedTimeStart = '';
          selectedTimeEnd = '';
      }}>Clear</button>
      <button class="finishButton" on:click={loadData}>Finish <i class="fa-solid fa-check"></i></button>
    </div>

  </div>
  <footer>&copy; Fuad Hasan</footer>
{:else}
  <button class="clear reset" on:click={() => {

    while (charts.firstChild) {
      charts.removeChild(charts.firstChild);
    }

    selectedDay = '';
    selectedCourse = '';
    selectedTimeStart = '';
    selectedTimeEnd = '';

    data = {};

    localStorage.removeItem('data');

    READY = false;

  }}>Clear Data</button>
{/if}

<style>

  #coursesDisplay{
    display: flex;
    flex-direction: column-reverse;
    justify-content: center;
    align-items: flex-start;
    gap: 5px;
    font-size: 0.7rem;
    padding: 10px 20px;
    border-radius: 10px;
    background: rgba(187, 221, 255, 0.096);
    margin-bottom: 20px;
    max-width: 90%;
  }

  #clb{
    font-size: 0.9rem;
    color: aliceblue;
    width: 100%;
    text-align: center;
    position: relative;
    display: none;
  }

  .course{
    color: rgb(233, 233, 233);
  }

  ul{
    list-style: none;
  }

  #coursesDisplay .courses:empty::after{
    content: 'No courses added';
    width: 100%;
    text-align: center;
    color: #f0f8ff6e;
  }

  .courses:not(:empty) + #clb{
    display: block;
  }

  .errLog{
    font-size: 0.7em;
    color: orangered;
    width: 100%;
    word-wrap: break-word;
    opacity: 0;
    display: none;
    position: relative;
  }

  .shake{
    animation: shake 300ms;
    opacity: 1;
    display: block;
  }
  .form{
    position: relative;
    width: 90%;
    max-width: 400px;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    background: rgba(187, 221, 255, 0.096);
    border-radius: 10px;
    padding: 20px;
    z-index: 10;
    gap: 10px;
  }

  .title.large{
    font-size: 1.2rem;
    font-weight: 500;
    margin-bottom: 20px;
  }

  .form-field{
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 80%;
  }
  .form-group{
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    gap: 20px;
    border-radius: 10px;
  }
  .form-group.backgound{
    background: rgba(255, 255, 255, 0.068);
  }
  .form-group.padding{
    margin-top: 10px;
    padding: 10px;
  }

  .dropdown-list{
    width: 100%;
    padding: 5px;
    background: rgb(26, 121, 209);
    color: white;
    outline: none;
    border: none;
    border-radius: 5px;
    text-align: center;
  }

  ::placeholder{
    color: #f0f8ff6e;
  }

  .list-item{
    background: rgb(26, 121, 209);
    color: white;
    border: none;
    outline: none;
    padding: 5px;
  }

  input[type='time']{
    padding: 5px;
    background: rgb(26, 121, 209);
    color: white;
    outline: none;
    border: none;
    border-radius: 5px;
  }
  /*time icon color*/
  input[type='time']::-webkit-calendar-picker-indicator {
    filter: invert(1);
  }

  ::selection{
    background: rgba(0, 240, 140, 0.651);
  }

  .title.small{
    font-size: 0.8rem;
  }
  .title.mid{
    font-size: 1.2rem;
  }
  .title.large{
    font-size: 1.5rem;
  }
  @keyframes shake {
    0% { transform: translateX(1px);}
    10% { transform: translateX(-1px);}
    20% { transform: translateX(-3px);}
    30% { transform: translateX(3px);}
    40% { transform: translateX(1px);}
    50% { transform: translateX(-1px);}
    60% { transform: translateX(-3px);}
    70% { transform: translateX(3px);}
    80% { transform: translateX(-1px);}
    90% { transform: translateX(1px);}
    100% { transform: translateX(1px);}
  }
</style>
