<script>
// @ts-nocheck

import { onMount } from 'svelte';
import { COURSES } from './courses.js';

console.log('%cmain.js loaded', 'color: green;');

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
      }
      if (!selectedCourse){
        errLog('Please select a course');
        return;
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
        data[selectedDay] = {};
        data[selectedDay][time] = selectedCourse;
      }

      if (!error){
        //update the display
        addedCourseDisplay += `<li class="course" data-day="${selectedDay}" data-time="${time}">${selectedCourse} on ${selectedDay} from ${selectedTimeStart} to ${selectedTimeEnd} <i class="fa-solid fa-trash delete-btn" title="Delete course"></i><li>`;
        if (Object.keys(data).length == 4){
          loadData();
        }
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

let addCourse;
let addedCourseDisplay = '';
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
 * @param {string} str
 * @returns {string}
 */
function titleCase(str) {
  str = str.toLowerCase().split(' ');
  for (var i = 0; i < str.length; i++) {
    str[i] = str[i].charAt(0).toUpperCase() + str[i].slice(1); 
  }
  return str.join(' ');
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

    const course = titleCase(data[day][time]);

    if (!colors[course]){
        const color = chooseColor();
        colors[course] = color;
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
   
    fillTimeClock(startAngle, endAngle, colors[course], ctx, xCord, yCord, radius);
    writeLabel(course, timeRange, startAngle, endAngle, ctx, xCord, yCord, radius);
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
function writeLabel(courseName, Time, startAngle, endAngle, ctx, xCord, yCord, radius) {
    ctx.fillStyle = '#bdf';
    ctx.font = `${font_size/2.5}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText(courseName[0], xCord + radius * Math.cos((startAngle + endAngle) / 2), yCord + radius * Math.sin((startAngle + endAngle) / 2));
    if (courseName[1]){
        ctx.fillText(courseName[1], xCord + radius * Math.cos((startAngle + endAngle) / 2), yCord + radius * Math.sin((startAngle + endAngle) / 2) + 15);
        ctx.fillText(Time, xCord + radius * Math.cos((startAngle + endAngle) / 2), yCord + radius * Math.sin((startAngle + endAngle) / 2) + 30);
    }else{
        ctx.fillText(Time, xCord + radius * Math.cos((startAngle + endAngle) / 2), yCord + radius * Math.sin((startAngle + endAngle) / 2) + 15);
    }
}

function reset(){
  errorClass = '';
}

const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday'];

let selectedCourse, selectedDay, selectedTimeStart, selectedTimeEnd;

</script>

<div id="charts" bind:this={charts}></div>

{#if Object.entries(data).length < 4}
  <div id="coursesDisplay">
    <ul class="courses">{@html addedCourseDisplay}</ul>
    <label for="coursesDisplay" id="clb">Added Courses</label>
  </div>
  <div class="form">
    <div class="errLog {errorClass}">{errorText}</div>
    <div class="title mid">Select your courses and times <i class="fa-solid fa-calendar-days"></i></div>
    <div class="form-field">
      <select name="day" id="day" bind:value={selectedDay} on:change={reset}>
        <option value> - Select Day - </option>
        {#each days as day}
          <option value={day}>{day}</option>
        {/each}
      </select>
    </div>
    <div class="form-field">
      <select name="course" id="course" bind:value={selectedCourse} on:change={reset}>
        <option value> - Select Courses - </option>
        {#each COURSES as course}
          <option value={course}>{course}</option>
        {/each}
      </select>
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
    </div>
  </div>
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
  .form-field select{
    width: 100%;
    padding: 5px;
    background: rgb(26, 121, 209);
    color: white;
    outline: none;
    border: none;
    border-radius: 5px;
  }
  .form-field option{
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
