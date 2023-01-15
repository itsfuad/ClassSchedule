<script>
  // @ts-nocheck

  import { onMount } from "svelte";
  import { COURSES, titleCase } from "./courses.js";
  import { ROOMS } from "./rooms.js";

  console.log("%cmain.js loaded", "color: green;");

  let READY = false;

  onMount(() => {
    console.log("%cApp mounted", "color: green;");

    addCourse = function () {
      if (!selectedDay) {
        errLog("Please select a day");
        return;
      } else {
        const temp = titleCase(selectedDay);
        if (!DAYS.includes(temp)) {
          errLog("Please select a valid day");
          return;
        }
      }
      if (!selectedCourse) {
        errLog("Please select a course");
        return;
      } else {
        const temp = titleCase(selectedCourse);
        if (!COURSES.includes(temp)) {
          errLog("Please select a valid course");
          return;
        }
      }
      if (!selectedRoom) {
        errLog("Please select a room");
        return;
      } else {
        const temp = selectedRoom;
        if (!ROOMS.includes(temp)) {
          errLog("Please select a valid room");
          return;
        }
      }
      if (!selectedTimeStart) {
        errLog("Please select a start time");
        return;
      }
      if (!selectedTimeEnd) {
        errLog("Please select an end time");
        return;
      }

      const [selectedTimeStartRange, selectedTimeEndRange] = timeParser(`${selectedTimeStart} - ${selectedTimeEnd}`);

      let valid = true;

      valid = validateTimeRange(selectedTimeStartRange, selectedTimeEndRange);

      if (!valid) {
        return;
      }

      errorClass = "";

      const time = `${selectedTimeStart} - ${selectedTimeEnd}`;

      console.log(time, __DATA__, selectedDay);

      valid = checkTimeClashes(__DATA__, time, selectedDay, selectedCourse);

      if (!valid) {
        return;
      }

      if (valid) {
        //update the display

        const li = document.createElement("li");
        li.classList.add("course");
        li.setAttribute("data-day", selectedDay);
        li.setAttribute("data-time", time);
        const id = crypto.randomUUID();
        li.id = id;

        const deleteBtn = document.createElement("i");
        deleteBtn.classList.add("fa-solid", "fa-trash", "delete-btn");
        deleteBtn.setAttribute("title", "Delete course");
        deleteBtn.style.color = "indianred";
        deleteBtn.style.padding = "0 5px";
        deleteBtn.style.cursor = "pointer";
        deleteBtn.style.fontSize = "0.9rem";

        li.textContent = `${selectedCourse} on ${selectedDay} [${timeConverter(
          time
        )}][${selectedRoom}]`;
        li.appendChild(deleteBtn);

        coursesAddedList.appendChild(li);

        if (!__DATA__[selectedDay]) {
          __DATA__[selectedDay] = {};
        }

        __DATA__[selectedDay][time] = [selectedCourse, selectedRoom];

        console.log("%cCourse added", "color: deepskyblue;");
      } else {
        console.log("%cError adding course", "color: red;");
      }
    };

    const dataAvailable = localStorage.getItem("data");
    if (dataAvailable) {
      const parsedData = JSON.parse(dataAvailable);
      if (Object.keys(parsedData).length > 0) {
        if (validateData(parsedData)) {
          console.log("%cData loaded", "color: deepskyblue;");
          __DATA__ = parsedData;
          loadData();
        } else {
          console.log("%cInvalid data found", "color: red;");
          localStorage.removeItem("data");
          __DATA__ = {};
        }
      } else {
        console.log("%cInvalid data found", "color: red;");
        localStorage.removeItem("data");
        __DATA__ = {};
      }
    } else {
      console.log("%cNo data found", "color: deepskyblue;");
      //change the title
      document.title = "Select Courses";
    }
  });

  function validateTimeRange(start, end) {
    if (start > end) {
      errLog("Start time must be before end time");
      console.log("%cStart time must be before end time", "color: red;");
      //console.log('%cStart time: ' + start, 'color: orangered;');
      //console.log('%cEnd time: ' + end, 'color: orangered;');
      return false;
    }
    if (start == end) {
      errLog("Start time and end time cannot be the same");
      console.log(
        "%cStart time and end time cannot be the same",
        "color: red;"
      );
      //console.log('%cStart time: ' + start, 'color: orangered;');
      //console.log('%cEnd time: ' + end, 'color: orangered;');
      return false;
    }
    if (end - start < 60){
      errLog('Courses should have at least 1 lecture hour.\nRe check time range.');
      console.log('Course less than an hour');
      return false;
    }
    if (start < 480 || start > 1080) {
      errLog("Start time must be between 8:00 AM and 6:00 PM");
      console.log(
        "%cStart time must be between 8:00 AM and 6:00 PM",
        "color: red;"
      );
      //console.log('%cStart time: ' + start, 'color: orangered;');
      //console.log('%cEnd time: ' + end, 'color: orangered;');
      return false;
    }
    return true;
  }

  function checkTimeClashes(
    data,
    customTime = null,
    customDay = null,
    customCourse = null
  ) {
    if (customTime && !customDay) {
      throw new Error("Day not provided");
    }
    let _counterCond = 0;
    if (!customTime) {
      _counterCond = 1;
    }

    for (let day in data) {
      if (customDay && customDay !== day) continue;
      let times = Object.keys(data[day]);

      for (let i = 0; i < times.length; i++) {
        for (let j = i + _counterCond; j < times.length; j++) {
          if (
            customCourse &&
            (data[day][times[i]][0] === customCourse ||
              data[day][times[j]][0] === customCourse)
          ) {
            console.log("Course already added");
            errLog("Course already taken");
            return false;
          }

          let [start1, end1] = timeParser(times[i]);
          let [start2, end2] = timeParser(times[j]);

          if (customTime) {
            [start1, end1] = timeParser(customTime);
          }
          if (
            (start1 >= start2 && start1 < end2) ||
            (start2 >= start1 && start2 < end1)
          ) {
            let errorText;
            if (customCourse) {
              errorText = `Time clash with ${data[day][times[j]][0]} [${
                timeConverter(times[j])
              }]`;
            } else if (!customTime && !customDay && !customCourse) {
              errorText = `Time clash on ${day}, between ${data[day][times[i]][0]} [${
                timeConverter(times[i])
              }] and ${data[day][times[j]][0]} [${times[j]}].\nPlease select time correctly.`;
            } else {
              errorText = `Time clash with ${data[day][times[j]][0]} [${
                timeConverter(times[j])
              }]`;
            }
            console.log(errorText);
            errLog(errorText);
            return false;
          }
        }
      }
    }
    //console.log("Free slot");
    return true;
  }

  /**
   * @param {string} time
   * @returns {[number, number]}
   * @example timeParser('8:00 - 9:00') => [480, 540]
   */
  function timeParser(timeRange) {
    const times = timeRange.split("-").map((time) => time.trim());
    const startTime = times[0];
    const endTime = times[1];
    const start = new Date("1970-01-01 " + startTime);
    const end = new Date("1970-01-01 " + endTime);
    const startMinutes = start.getHours() * 60 + start.getMinutes();
    const endMinutes = end.getHours() * 60 + end.getMinutes();
    return [startMinutes, endMinutes];
  }

  //24h to 12h time
  /**
   * @param {string} time
   * @returns {string}
   */
  function timeConverter(time) {
    if (!time) {
      return "";
    }
    const timeRange = time.split("-");
    const timeStart = timeRange[0].trim().split(":");
    const timeStartValue = parseInt(timeStart[0]) * 60 + parseInt(timeStart[1]);
    const timeEnd = timeRange[1].trim().split(":");
    const timeEndValue = parseInt(timeEnd[0]) * 60 + parseInt(timeEnd[1]);
    const timeStart12h =
      timeStartValue < 720
        ? `${timeStart[0].toString().padStart(2, "0")}:${timeStart[1]
            .toString()
            .padStart(2, "0")} AM`
        : `${
            timeStart[0] == 12
              ? timeStart[0].toString().padStart(2, "0")
              : (timeStart[0] - 12).toString().padStart(2, "0")
          }:${timeStart[1].toString().padStart(2, "0")} PM`;
    const timeEnd12h =
      timeEndValue < 720
        ? `${timeEnd[0].toString().padStart(2, "0")}:${timeEnd[1]
            .toString()
            .padStart(2, "0")} AM`
        : `${
            timeEnd[0] == 12
              ? timeEnd[0].toString().padStart(2, "0")
              : (timeEnd[0] - 12).toString().padStart(2, "0")
          }:${timeEnd[1].toString().padStart(2, "0")} PM`;
    return `${timeStart12h} - ${timeEnd12h}`;
  }

  let addCourse;
  let errorText,
    errorClass = "";

  let charts;
  let __DATA__ = {};

  const colors = {
    Free: "#000800aa",
    Break: "#077518",
  };

  const colorsArray = [
    "#405b91",
    "#1d8ad3",
    "#d34f1d",
    "#d3251d",
    "#009169",
    "#008a91",
    "#064491",
    "#7d12df",
    "#df1241",
    "#4d6a59",
  ];

  let canvasResolution = 1080;

  let canvasSize;

  if (document.body.clientHeight > document.body.clientWidth) {
    canvasSize = document.body.clientWidth * 0.7;
  } else {
    canvasSize = document.body.clientHeight * 0.7;
  }

  const font_size = canvasResolution / 16;

  function loadData() {
    
    if (Object.keys(__DATA__).length == 0) {
      errLog("Empty form");
      return;
    }
    
    if (!localStorage.getItem("data")) {
      localStorage.setItem("data", JSON.stringify(__DATA__));
      console.log("%cData saved", "color: deepskyblue;");
    }
    document.title = "Your Schedule";
    init();
  }

  /**
   * @param {{ Sunday?: { '8:00 AM - 9:15 AM': string[]; '9:15 AM - 1:00 PM': string[]; '1:00 PM - 2:15 PM': string[]; '2:15 PM - 3:30 PM': string[]; '3:30 PM - 6:00 PM': string[]; }; Monday?: { '8:00 AM - 2:40 PM': string[]; '2:40 PM - 4:20 PM': string[]; '4:20 PM - 6:00 PM': string[]; }; Tuesday?: { '8:00 AM - 9:15 AM': string[]; '9:15 AM - 1:00 PM': string[]; '1:00 PM - 2:15 PM': string[]; '2:15 PM - 6:00 PM': string[]; }; Wednesday?: { '8:00 AM - 10:30 AM': string[]; '10:30 AM - 3:30 PM': string[]; '3:30 PM - 6:00 PM': string[]; }; }} data
   */
  function init() {
    console.log("%cInitializing Charts", "color: deepskyblue;");
    READY = true;

    //sort data by day sunday - wednesday
    const data = {};

    for (let i = 0; i < DAYS.length; i++) {
      if (__DATA__[DAYS[i]]) {
        data[DAYS[i]] = __DATA__[DAYS[i]];
      }
    }

    __DATA__ = data;

    Object.keys(__DATA__).forEach((day) => {
      const canvas = document.createElement("canvas");
      charts.appendChild(canvas);
      const ctx = canvas.getContext("2d");

      ctx.globalCompositeOperation = "destination-over";

      canvas.height = canvasResolution;
      canvas.width = canvasResolution * 1.3;

      canvas.style.height = `${canvasSize}px`;
      canvas.style.width = `${canvasSize * 1.3}px`;

      const xCord = canvas.width / 2;
      const yCord = canvas.height / 2;

      const radius = canvasResolution / 3;

      ctx.beginPath();
      ctx.arc(xCord, yCord, radius, 0, (360 * Math.PI) / 180);
      ctx.lineTo(xCord, yCord);
      ctx.fillStyle = "#111d2a";
      ctx.fill();

      Object.keys(__DATA__[day]).forEach(async (time) => {
        draw(day, time, ctx, xCord, yCord, radius);
      });

      //write the day name
      ctx.fillStyle = "#bdf";
      ctx.font = `${font_size}px Arial`;
      ctx.textAlign = "center";

      ctx.fillText(day, xCord, font_size * 2);
    });
  }

  function chooseColor() {
    const index = Math.floor(Math.random() * (colorsArray.length - 1));
    const color = colorsArray[index];
    colorsArray.splice(index, 1);
    return color;
  }

  function errLog(err) {
    errorClass = "";
    setTimeout(() => {
      errorText = err;
      errorClass = "shake";
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
  function draw(day, time, ctx, xCord, yCord, radius) {
    const courseInfo = __DATA__[day][time];
    const courseName = courseInfo[0];

    if (!colors[courseName]) {
      const color = chooseColor();
      colors[courseName] = color;
    }

    //extract the start time and end time from '1:00 PM - 2:15 PM' format
    const startTime = time.split(" - ")[0].trim();
    const endTime = time.split(" - ")[1].trim();

    //convert 24 hour time to 12 hour time with am pm
    const start = convertTime(startTime);
    const end = convertTime(endTime);

    const timeRange = `${start} - ${end}`;

    let startMinutes =
      parseInt(startTime.split(":")[0]) * 60 +
      parseInt(startTime.split(":")[1]);
    let endMinutes =
      parseInt(endTime.split(":")[0]) * 60 + parseInt(endTime.split(":")[1]);

    // fill area between start and end time
    const startAngle = ((startMinutes / 2) * Math.PI) / 180 - Math.PI / 2;
    const endAngle = ((endMinutes / 2) * Math.PI) / 180 - Math.PI / 2;

    //run writeLabel function after all fillTimeClock functions are done

    fillTimeClock(startAngle,endAngle,colors[courseName],ctx,xCord,yCord,radius);
    writeLabel(courseInfo,timeRange,startAngle,endAngle,ctx,xCord,yCord,radius);
  }

  /**
   * @param {string} time
   * @returns {string}
   * @example convertTime('13:00') -> '1:00 PM'
   */
  function convertTime(time) {
    const hour = parseInt(time.split(":")[0]);
    const minutes = parseInt(time.split(":")[1]);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    //return `${hour12}:${minutes} ${ampm}`;
    //add 0 before hour and minutes if it is less than 10, eg. 1:5 PM -> 01:05 PM with the padsStart method
    return `${hour12.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")} ${ampm}`;
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
  function fillTimeClock(
    startAngle,
    endAngle,
    color,
    ctx,
    xCord,
    yCord,
    radius
  ) {
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
  function writeLabel(courseInfo,Time,startAngle,endAngle,ctx,xCord,yCord,radius) {
    ctx.fillStyle = "#bdf";
    ctx.font = `${font_size / 2.5}px Arial`;
    ctx.textAlign = "center";
    ctx.fillText(courseInfo[0], xCord + radius * Math.cos((startAngle + endAngle) / 2),yCord + radius * Math.sin((startAngle + endAngle) / 2));
    if (courseInfo[1]) {
      ctx.fillText(
        courseInfo[1], xCord + radius * Math.cos((startAngle + endAngle) / 2), yCord + radius * Math.sin((startAngle + endAngle) / 2) + font_size/2);
      ctx.fillText(Time,xCord + radius * Math.cos((startAngle + endAngle) / 2),yCord + radius * Math.sin((startAngle + endAngle) / 2) + font_size);
    } else {
      ctx.fillText(Time,xCord + radius * Math.cos((startAngle + endAngle) / 2),yCord + radius * Math.sin((startAngle + endAngle) / 2) + font_size/2);
    }
  }

  function reset() {
    errorClass = "";
    errorText = "";
  }

  const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday"];

  let selectedCourse,
    selectedDay,
    selectedRoom,
    selectedTimeStart,
    selectedTimeEnd;

  let coursesAddedList;

  function handleDeleteCourse(evt) {
    //if the target is not the ul element
    if (evt.target == coursesAddedList) {
      return;
    }
    const course = evt.target?.closest(".course");
    if (course) {
      const day = course.dataset.day;
      const time = course.dataset.time;
      if (__DATA__[day]) {
        course.remove();
        course.remove();
        delete __DATA__[day][time];
        if (Object.keys(__DATA__[day]).length == 0) {
          delete __DATA__[day];
        }
        console.log("%cCourse Deleted", "color: red;");
      }
    }
  }

  function download() {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(__DATA__));
    const downloadAnchorNode = document.createElement("a");
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "schedule.json");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }

  let importedFiles;

  function validateData(data) {
    if (!data) {
      errLog("No Data");
      console.log("%cNo Data", "color: red;");
      return false;
    }
    let valid = true;
    Object.keys(data).forEach((day) => {
      if (!DAYS.includes(day)) {
        errLog(`Invalid Day: ${day}`);
        //console.log('%cInvalid Day: ' + day, 'color: red;');
        valid = false;
      }

      if (valid) {
        Object.keys(data[day]).forEach((time) => {
          if (!valid) {
            return;
          }

          const [convertedTimeStartRange, convertedTimeEndRange] = timeParser(time);

          /*
          console.log('%cValidating time range', 'color: deepskyblue;');
          console.log('%cStart time: ' + convertedTimeStartRange, 'color: deepskyblue;');
          console.log('%cEnd time: ' + convertedTimeEndRange, 'color: deepskyblue;');
          console.log('Selected day: ' + day);
          console.log('Selected course: ' + data[day][time]);
          */
        
          valid = validateTimeRange(convertedTimeStartRange, convertedTimeEndRange);
          if (!valid) {
            return;
          }
          //console.log('time range: ' + valid);

          const course = data[day][time];
          if (!course) {
            valid = false;
            console.log("%cNo Course", "color: red;");
            return;
          } else {
            if (!COURSES.includes(course[0])) {
              errLog(`Invalid Course: ${course[0]}`);
              console.log("%cInvalid Course: " + course[0], "color: red;");
              valid = false;
              return;
            }
          }

          valid = checkTimeClashes(data);
          if (!valid) {
            return;
          }

          //console.log('time clash: ' + valid)
          if (!ROOMS.includes(course[1])) {
            errLog(`Invalid Room: ${course[1]}`);
            console.log("%cInvalid Room: " + course[1], "color: red;");
            valid = false;
            return;
          }
        });
      }
    });
    return valid;
  }

  function loadFile() {
    try {
      if (importedFiles) {
        const file = importedFiles.files[0];
        //if file is not json
        if (file.type != "application/json") {
          console.log("%cFile is not a json file", "color: red;");
          errLog("File is not a json file");
          importedFiles.value = "";
          return;
        }
        const reader = new FileReader();
        reader.onload = function (e) {
          const text = e.target.result;
          const tempData = JSON.parse(text);
          if (validateData(tempData)) {
            __DATA__ = tempData;
            console.log("%cFile Loaded", "color: green;");
            importedFiles.value = "";
            loadData();
          } else {
            importedFiles.value = "";
            return;
          }
        };
        reader.readAsText(file);
      }
    } catch (e) {
      console.log("%cFile contains invalid data", "color: red;");
      errLog("File contains invalid data");
      importedFiles.value = "";
    }
  }
</script>

<div id="charts" bind:this={charts} />

{#if !READY}
  <div id="coursesDisplay">
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <ul
      class="courses"
      bind:this={coursesAddedList}
      on:click={handleDeleteCourse}
    />
    <label for="coursesDisplay" id="clb"
      >Added Courses <i class="fa-solid fa-puzzle-piece" /></label
    >
  </div>
  <div class="form">
    <div class="errLog {errorClass}">{errorText}</div>
    <div class="title mid">
      Select your courses and times <i class="fa-solid fa-calendar-days" />
    </div>

    <div class="form-field">
      <input
        list="day"
        class="dropdown-list"
        bind:value={selectedDay}
        on:change={reset}
        placeholder=" - Select day - "
      />
      <datalist name="day" id="day">
        {#each DAYS as day}
          <option class="list-item" value={day}>{day}</option>
        {/each}
      </datalist>
    </div>

    <div class="form-field">
      <input
        list="course"
        class="dropdown-list"
        bind:value={selectedCourse}
        on:change={reset}
        placeholder=" - Select course - "
      />
      <datalist name="course" id="course">
        {#each COURSES as course}
          <option class="list-item" value={course}>{course}</option>
        {/each}
      </datalist>
    </div>

    <div class="form-field">
      <input
        list="room"
        class="dropdown-list"
        bind:value={selectedRoom}
        on:change={reset}
        placeholder=" - Select room - "
      />
      <datalist name="room" id="room">
        {#each ROOMS as room}
          <option class="list-item" value={room}>{room}</option>
        {/each}
      </datalist>
    </div>

    <div class="form-group backgound padding">
      <div class="form-field">
        <label for="time" class="title small">Class starts</label>
        <input
          type="time"
          name="courseTime"
          id="time-start"
          bind:value={selectedTimeStart}
          on:change={reset}
        />
      </div>

      <div class="form-field">
        <label for="time" class="title small">Class ends</label>
        <input
          type="time"
          name="courseTime"
          id="time-end"
          bind:value={selectedTimeEnd}
          on:change={reset}
        />
      </div>
    </div>

    <div class="form-group">
      <button class="addButton" on:click={addCourse}
        >Add <i class="fa-solid fa-circle-plus" /></button
      >
      <button
        class="clear"
        on:click={() => {
          selectedDay = "";
          selectedCourse = "";
          selectedRoom = "";
          selectedTimeStart = "";
          selectedTimeEnd = "";

          if (importedFiles?.files?.length > 0) {
            importedFiles.value = "";
          }

          reset();
        }}>Clear <i class="fa-solid fa-trash" /></button
      >
      <button class="finishButton" on:click={loadData}
        >Finish <i class="fa-solid fa-check" /></button
      >
    </div>

    <div class="form-field">
      <!-- import from file -->
      <div class="or">Or</div>
      <label for="file" id="fileImportLabel">Import from file</label>
      <input
        type="file"
        id="file"
        accept=".json"
        on:change={loadFile}
        bind:this={importedFiles}
      />
    </div>
  </div>
  <footer>&copy; Fuad Hasan</footer>
{:else}
  <div class="form-group margin">
    <button class="export" on:click={download}>Export Data</button>
    <button
      class="clear reset"
      on:click={() => {
        while (charts.firstChild) {
          charts.removeChild(charts.firstChild);
        }

        selectedDay = "";
        selectedCourse = "";
        selectedRoom = "";
        selectedTimeStart = "";
        selectedTimeEnd = "";

        if (importedFiles?.files?.length > 0) {
          importedFiles.value = "";
        }

        __DATA__ = {};

        localStorage.removeItem("data");

        READY = false;
      }}>Clear Data</button
    >
  </div>
{/if}

<style>
  #coursesDisplay {
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

  #clb {
    font-size: 0.9rem;
    color: aliceblue;
    width: 100%;
    text-align: center;
    position: relative;
    display: none;
  }

  .course {
    color: rgb(233, 233, 233);
  }

  ul {
    list-style: none;
  }

  #coursesDisplay .courses:empty::after {
    content: "No courses added";
    width: 100%;
    text-align: center;
    color: #f0f8ff6e;
  }

  .courses:not(:empty) + #clb {
    display: block;
  }

  .errLog {
    font-size: 0.7em;
    color: orangered;
    width: 100%;
    word-wrap: break-word;
    white-space: break-spaces;
    opacity: 0;
    display: none;
    position: relative;
  }

  .shake {
    animation: shake 300ms;
    opacity: 1;
    display: block;
  }
  .form {
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

  .title.large {
    font-size: 1.2rem;
    font-weight: 500;
    margin-bottom: 20px;
  }

  .form-field {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 80%;
  }
  .form-group {
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    gap: 20px;
    border-radius: 10px;
  }
  .form-group.backgound {
    background: rgba(255, 255, 255, 0.068);
  }
  .form-group.padding {
    margin-top: 10px;
    padding: 10px;
  }

  .dropdown-list {
    width: 100%;
    padding: 5px;
    background: rgb(26, 121, 209);
    color: white;
    outline: none;
    border: none;
    border-radius: 5px;
    text-align: center;
  }

  ::placeholder {
    color: #f0f8ff6e;
  }

  .list-item {
    background: rgb(26, 121, 209);
    color: white;
    border: none;
    outline: none;
    padding: 5px;
  }

  .or {
    color: rgba(187, 221, 255, 0.336);
    position: relative;
  }

  .or::after,
  .or::before {
    content: "";
    position: absolute;
    top: 50%;
    left: -110px;
    width: 100px;
    height: 2px;
    transform: translateY(-50%);
    background: rgba(187, 221, 255, 0.336);
  }

  .or::before {
    left: unset;
    right: -110px;
  }

  #fileImportLabel {
    cursor: pointer;
    padding: 5px;
    color: rgb(26, 121, 209);
    text-decoration: underline;
    outline: none;
    border: none;
    border-radius: 5px;
  }
  #fileImportLabel:hover {
    color: rgb(26, 121, 209, 0.8);
  }

  #file {
    display: none;
  }

  input[type="time"] {
    padding: 5px;
    background: rgb(26, 121, 209);
    color: white;
    outline: none;
    border: none;
    border-radius: 5px;
  }
  /*time icon color*/
  input[type="time"]::-webkit-calendar-picker-indicator {
    filter: invert(1);
  }

  ::selection {
    background: rgba(0, 240, 140, 0.651);
  }

  .title.small {
    font-size: 0.8rem;
  }
  .title.mid {
    font-size: 1.2rem;
  }
  .title.large {
    font-size: 1.5rem;
  }
  @keyframes shake {
    0% {
      transform: translateX(1px);
    }
    10% {
      transform: translateX(-1px);
    }
    20% {
      transform: translateX(-3px);
    }
    30% {
      transform: translateX(3px);
    }
    40% {
      transform: translateX(1px);
    }
    50% {
      transform: translateX(-1px);
    }
    60% {
      transform: translateX(-3px);
    }
    70% {
      transform: translateX(3px);
    }
    80% {
      transform: translateX(-1px);
    }
    90% {
      transform: translateX(1px);
    }
    100% {
      transform: translateX(1px);
    }
  }
</style>
