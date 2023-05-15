<script>
  // @ts-nocheck

  import { onMount } from "svelte";
  import { fly } from "svelte/transition";
  import { Colors } from "./assets/metadata";
  import Logo from "./Logo.svelte";

  console.log("%cmain.js loaded", "color: green;");

  let LOGGED_IN = false;
  let SELECTION_PANEL = false;
  let User = '';
  let selectedSemester;
  let loadingMessage = '';

  onMount(() => {
    console.log("%cApp mounted", "color: green;");

    /*
    const dataAvailable = localStorage.getItem("data")?.split('|');
    const sm = localStorage.getItem("sm");
    */

    let dataAvailable, sm;
    window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
    window.requestFileSystem(window.PERSISTENT, 1024 * 1024, function (fs) {
      fs.root.getFile('data', {}, function (fileEntry) {
        fileEntry.file(function (file) {
          var reader = new FileReader();
          reader.onloadend = function(e) {
            dataAvailable = this.result.split('|');
            console.log('Data Read completed.');
            console.log(dataAvailable);
          };
          reader.readAsText(file);
        }, errorHandler);
      }, errorHandler);
      fs.root.getFile('sm', {}, function (fileEntry) {
        fileEntry.file(function (file) {
          var reader = new FileReader();
          reader.onloadend = function(e) {
            sm = this.result;
            console.log('Sm Read completed.');
            console.log(sm);
          };
          reader.readAsText(file);
        }, errorHandler);
      }, errorHandler);
    }, errorHandler);
  }).then(()=>{
    console.log("Done");
  })

  function errorHandler(e){
    console.log(e);
  }

  /**
   * @param {string} timeRange
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

  let errorText = "",
    errorClass = "";

  let charts;
  
  let __DATA__ = {};

  const colors = {
    Free: "#000800aa",
    Break: "#077518",
  };

  const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday"];

  let colorsArray = [...Colors];

  let canvasResolution = 1080;

  let canvasSize;

  if (document.body.clientHeight > document.body.clientWidth) {
    canvasSize = document.body.clientWidth * 0.7;
  } else {
    canvasSize = document.body.clientHeight * 0.7;
  }

  const font_size = canvasResolution / 15;

  function loadData() {
    if (Object.keys(__DATA__).length == 0) {
      errLog("No data found");
      return;
    }

    /*
    if (!localStorage.getItem("data")) {
      localStorage.setItem("data", btoa(JSON.stringify(__DATA__)) + '|' + btoa(User));
      console.log("%cData Updated", "color: limegreen;");
    }
    */

    window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
    window.requestFileSystem(window.PERSISTENT, 1024 * 1024, function (fs) {
      fs.root.getFile('data', {create: true}, function (fileEntry) {
        fileEntry.createWriter(function (fileWriter) {
          fileWriter.onwriteend = function(e) {
            console.log('Write completed.');
          };
          fileWriter.onerror = function(e) {
            console.log('Write failed: ' + e.toString());
          };
          var blob = new Blob([btoa(JSON.stringify(__DATA__)) + '|' + btoa(User)], {type: 'text/plain'});
          fileWriter.write(blob);
        }, errorHandler);
      }, errorHandler);
    }, errorHandler);

    document.title = "Your Schedule";

    SELECTION_PANEL = false;

    init();
  }

  function init() {
    console.log("%cInitializing Charts", "color: deepskyblue;");

    //localStorage.setItem("sm", btoa(selectedSemester)); Use filesystem API instead
    
    window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
    window.requestFileSystem(window.PERSISTENT, 1024 * 1024, function (fs) {
      fs.root.getFile('sm', {create: true}, function (fileEntry) {
        fileEntry.createWriter(function (fileWriter) {
          fileWriter.onwriteend = function(e) {
            console.log('Write completed.');
          };
          fileWriter.onerror = function(e) {
            console.log('Write failed: ' + e.toString());
          };
          var blob = new Blob([btoa(selectedSemester)], {type: 'text/plain'});
          fileWriter.write(blob);
        }, errorHandler);
      }, errorHandler);
    }, errorHandler);

    //sort data by day sunday - wednesday
    const data = {};
    charts.innerHTML = '';
    colorsArray = [...Colors];
    for (let i = 0; i < DAYS.length; i++) {
      if (__DATA__[selectedSemester][DAYS[i]]) {
        data[DAYS[i]] = __DATA__[selectedSemester][DAYS[i]];
      }
    }

    const today = new Date().toLocaleString("en-us", { weekday: "long" });

    Object.keys(data).forEach((day) => {

      const canvas = document.createElement("canvas");
      canvas.id = day;
      if (day == today) {
        canvas.style.border = "3px solid deepskyblue";
      }else{
        canvas.style.border = "3px solid #00000000";
      }
      charts.appendChild(canvas);
      const ctx = canvas.getContext("2d");

      ctx.globalCompositeOperation = "source-over";

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
      ctx.fillStyle = "#0f2636";
      ctx.fill();

      Object.keys(data[day]).forEach(async (time) => {
        drawPie(data, day, time, ctx, xCord, yCord, radius);
      });

      Object.keys(data[day]).forEach((time) => {
        drawLabel(data, day, time, ctx, xCord, yCord, radius);
      });

      //write the day name
      ctx.fillStyle = "#bdf";
      ctx.font = `${font_size}px Arial`;
      ctx.textAlign = "center";

      ctx.fillText(day, xCord, canvas.height - font_size);
    });
  }

  function chooseColor() {
    const index = Math.floor(Math.random() * (colorsArray.length - 1));
    const color = colorsArray[index];
    colorsArray.splice(index, 1);
    return color;
  }

  /**
   * 
   * @param {string} err
   */
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
  function drawPie(data, day, time, ctx, xCord, yCord, radius) {
    const courseInfo = data[day][time];
    const courseName = courseInfo['course_name'];

    if (!colors[courseName]) {
      const color = chooseColor();
      colors[courseName] = color;
    }

    let [startMinutes, endMinutes] = timeParser(time);
      
    // fill area between start and end time
    const startAngle = ((startMinutes / 2) * Math.PI) / 180 - Math.PI / 2;
    const endAngle = ((endMinutes / 2) * Math.PI) / 180 - Math.PI / 2;

    fillTimeClock(
      startAngle,
      endAngle,
      colors[courseName],
      ctx,
      xCord,
      yCord,
      radius
    );
  }

  function drawLabel(data, day, time, ctx, xCord, yCord, radius){
    const courseInfo = data[day][time];
    const courseName = courseInfo['course_name'];

    if (!colors[courseName]) {
      const color = chooseColor();
      colors[courseName] = color;
    }

    let [startMinutes, endMinutes] = timeParser(time);
      
    // fill area between start and end time
    const startAngle = ((startMinutes / 2) * Math.PI) / 180 - Math.PI / 2;
    const endAngle = ((endMinutes / 2) * Math.PI) / 180 - Math.PI / 2;

    writeLabel(
      courseInfo,
      time,
      startAngle,
      endAngle,
      ctx,
      xCord,
      yCord,
      radius
    );
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

  CanvasRenderingContext2D.prototype.fillTextCircle = function (text, x, y, radius, startAngle){
    const numRadsPerLetter = 2*Math.PI / text.length;
    this.save();
    this.translate(x, y);
    this.rotate(startAngle);

    for (let i = 0; i < text.length; i++){
      this.save();
      this.rotate(i*numRadsPerLetter);
      this.fillText(text[i], 0, -radius);
      this.restore();
    }
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
  function writeLabel(
    courseInfo,
    Time,
    startAngle,
    endAngle,
    ctx,
    xCord,
    yCord,
    radius
  ) {

    ctx.fillStyle = "#bdf";
    ctx.font = `${font_size / 2.5}px Arial`;
    ctx.textAlign = "center";

    let courseName = courseInfo['course_name'];
    if (courseName.length > 15) {
      //short each word
      courseName = courseName.split(' ').map((word => {
        if (word.includes('-') || word.includes('(') || word.includes(')') || word.includes('[') || word.includes(']')) {
          return word;
        } else {
          if(word.toUpperCase() != 'TO'){
            if(word.toUpperCase() != 'LAB'){
              return word[0];
            }else{
              return ` ${word}`;
            }
          }
        }
      })).join('');
    }
    courseName = `${courseName} [${courseInfo['section']}]`;

    ctx.fillText(
      courseName,
      xCord + radius * Math.cos((startAngle + endAngle) / 2),
      yCord + radius * Math.sin((startAngle + endAngle) / 2)
    );

    if (courseInfo) {
      ctx.fillText(
        `Room: ${courseInfo['room']} [${courseInfo['type']}]`,
        xCord + radius * Math.cos((startAngle + endAngle) / 2),
        yCord + radius * Math.sin((startAngle + endAngle) / 2)  + font_size / 2
      );
    }

    const timeStart = Time.split('-')[0];
    const timeEnd = Time.split('-')[1];

    ctx.fillText(
      timeStart,
      xCord + radius * Math.cos(startAngle),
      yCord + radius * Math.sin(startAngle)
    );

    ctx.fillText(
      timeEnd,
      xCord + radius * Math.cos(endAngle),
      yCord + radius * Math.sin(endAngle)
    );
  }

  let username;
  let password;

  function handleEnter(event) {
    if (event.key === "Enter") {
      login();
    }
  }

  function sanitizeInput(username, password) {
    //username: example 22-49355-3
    //password: any valid
    const usernameRegex = /^\d{2}-\d{5}-\d$/;
    const passwordRegex = /^.{1,}$/;
    if (!usernameRegex.test(username)) {
      errLog("Invalid Username");
      return false;
    }
    if (!passwordRegex.test(password)) {
      errLog("Invalid Password");
      return false;
    }
    return true;
  }

  function login(){

    //check if offline
    if (!navigator.onLine) {
      errLog("You are offline!\nPlease connect to the internet first.");
      return;
    }

    if (!username) {
      errLog("Please provide username");
      return;
    }

    if (!password) {
      errLog("Please provide password");
      return;
    }

    else if(sanitizeInput(username, password)){

      loadingMessage = "Authenticating...";
      
      fetch('https://proxy-server-el2s.onrender.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'access-control-allow-origin': '*', // Required for CORS support to work'
        },
        credentials: 'include',
        body: `UserName=${username}&Password=${password}`,
      })
        .then((r) => {
          if (r.status === 200) {
            r.json().then(data => {
              loadingMessage = "";
              LOGGED_IN = true;
              SELECTION_PANEL = true;
              const user_name = titleCase(data.user);
              const user_name_arranged = `${user_name.split(',')[1]} ${user_name.split(',')[0]}`;
              User = `${user_name_arranged}`;
              document.title = `Welcome ${user_name_arranged}`;
              __DATA__ = data.data;
              //localStorage.setItem("data", btoa(JSON.stringify(__DATA__)) + '|' + btoa(User));
              window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
              window.requestFileSystem(window.PERSISTENT, 1024 * 1024, function (fs) {
                fs.root.getFile('data', { create: true }, function (fileEntry) {
                  fileEntry.createWriter(function (fileWriter) {
                    fileWriter.onwriteend = function (e) {
                      console.log('Write completed.');
                    };
                    fileWriter.onerror = function (e) {
                      console.log('Write failed: ' + e.toString());
                    };
                    const blob = new Blob([JSON.stringify(__DATA__)], { type: 'text/plain' });
                    fileWriter.write(blob);
                  }, errorHandler);
                }, errorHandler);
              }, errorHandler);

              username = '';
              password = '';
              errorText = '';
              errorClass = '';
            }).catch(err => {
              console.log(err);
              errLog("Something went wrong reading response");
              loadingMessage = "";
            });
          } else {
            r.text().then(data => {
              errLog(data);
              loadingMessage = "";
            }).catch(err => {
              console.log(err);
              errLog("Something went wrong reading response");
              loadingMessage = "";
            });
          }
        })
        .catch((err) => {
          console.log(err);
          errLog("Something went wrong");
          loadingMessage = "";
        });
        
    }
  }

  function clear(){
    //localStorage.removeItem("sm");
    //localStorage.removeItem("data");

    window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
    window.requestFileSystem(window.PERSISTENT, 1024 * 1024, function (fs) {
      fs.root.getFile('data', { create: false }, function (fileEntry) {
        fileEntry.remove(function () {
          console.log('File removed.');
        }, errorHandler);
      }, errorHandler);
    }, errorHandler);

    User = '';
    __DATA__ = {};
    SELECTION_PANEL = false;
    LOGGED_IN = false;
    document.title = "Login";
    
    while(charts.firstChild){
      charts.removeChild(charts.firstChild);
    }
  }

  /**
 * @param {string} str
 * @returns {string}
 */
function titleCase(str) {
    const temp = str.toLowerCase().split(' ');
    for (var i = 0; i < temp.length; i++) {
        temp[i] = temp[i].charAt(0).toUpperCase() + temp[i].slice(1); 
    }
    return temp.join(' ');
}

</script>

{#if loadingMessage}
  <div class="load-message">
    <div class="text">{loadingMessage}</div>
    <i class="fa-solid fa-circle-notch fa-spin"></i>
  </div>
{/if}

<div class="container">

{#if LOGGED_IN}
<div class="header">
    <div class="sem">
      <i class="fa-solid fa-tree"></i> {selectedSemester} <button on:click={()=>{
        SELECTION_PANEL = true;
      }}><i class="fa-solid fa-caret-down"></i></button>
    </div>
    <div class="user">
      <i class="fa-solid fa-user"></i> {User}
    </div>
</div>
{/if}

<div id="charts" bind:this={charts}></div>

{#if !LOGGED_IN}
  <div class="form login-form" in:fly={{ y: 50, duration: 300}}>
    <div class="errLog {errorClass}">{errorText}</div>
    <div class="title mid">
      <Logo/> Login with AIUB id <i class="fa-solid fa-id-card"></i>
    </div>

    <div class="form-field">
      <input
        type="text"
        id="username"
        name="UserName"
        placeholder="Username"
        bind:value={username}
        on:keydown={handleEnter}
      />
    </div>

    <div class="form-field">
      <input
        type="password"
        id="password"
        name="Password"
        placeholder="Password"
        bind:value={password}
        on:keydown={handleEnter}
      />
    </div>

    <button type="submit" on:click={login} class="btn">
      Login <i class="fa-solid fa-sign-in" />
    </button>

  </div>
  {/if}
  {#if SELECTION_PANEL}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <div class="selection-container" on:click={(evt) => {
    if (evt.target.classList.contains("selection-container")){
      if (charts.childNodes.length != 0){
        SELECTION_PANEL = false;
      }
    }
  }}>
    <div class="form" id="selection-panel" in:fly={{ y: 50, duration: 300}}>
      <div class="title after-login">
        <i class="fa-solid fa-user"></i> {User}
      </div>
      <div class="form-field">
        <!--Select semester-->
        <select name="semester" id="semester" bind:value={selectedSemester}>
          {#each Object.keys(__DATA__) as semester }
            <option value="{semester}">{semester}</option>
          {/each}
        </select>
      </div>
      <div class="button-group">
        <button id="show-graph" on:click={loadData}>Show Classes</button>
        <button class="clear-data" on:click={clear}>Clear Data</button>
      </div>
    </div>
  </div>
  {/if}
</div>

<a href="https://github.com/itsfuad/ClassSchedule">
  <!-- Github Link -->
  Source Code <i class="fa-solid fa-code-branch"></i>
</a>
  
<style>

  .login-form .title{
    font-size: 1.2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    flex-direction: row;
  }

  select{
    width: 100%;
    height: 35px;
    background: rgb(26, 121, 209);
    outline: none;
    border: none;
    border-radius: 5px;
    color: aliceblue;
    text-align: center;
  }

  .button-group{
    display: flex;
    flex-direction: row;
    gap: 20px;
  }

  .header{
    position: sticky;
    top: 0;
    width: 100%;
    padding: 10px;
    z-index: 10;
    background: rgb(13 40 58);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .sem{
    color: #10ffbd;
  }

  .sem button{
    margin: 0;
    padding: 2px 5px;
    background: rgb(33 75 104);
  }

  .selection-container{
    position: fixed;
    top: 0;
    left: 0;
    background: #0d283ac7;
    width: 100%;
    height: 100%;
    z-index: 100;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(2px);
  }

  .title.after-login{
    color: #bdcddf;
    font-size: 0.9rem;
  }

  input[type="text"], input[type="password"] {
    width: 100%;
    padding: 10px;
    border: none;
    background: none;
    color: rgb(233, 233, 233);
    border-bottom: rgb(26, 121, 209) 2px solid;
    font-size: 1em;
    outline: none;
  }

  input:-webkit-autofill,
  input:-webkit-autofill:hover,
  input:-webkit-autofill:focus,
  textarea:-webkit-autofill,
  textarea:-webkit-autofill:hover,
  textarea:-webkit-autofill:focus,
  select:-webkit-autofill,
  select:-webkit-autofill:hover,
  select:-webkit-autofill:focus {
    -webkit-text-fill-color: aliceblue;
    -webkit-box-shadow: 0 0 0rgb(255, 255, 255)00px transparent inset;
    transition: background-color 5000s ease-in-out 0s;
    caret-color: aliceblue;
  }

    
  #charts{
    overflow: scroll;
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    padding: 20px;
    gap: 40px;
    min-height: 80vh;
    width: 100%;
    position: relative;
  }

  #charts:empty{
    display: none;
  }

  button{
    margin-top: 20px;
    padding: 10px 15px;
    font-size: 0.9rem;
    border: none;
    border-radius: 5px;
    background: rgb(26, 121, 209);
    color: aliceblue;
    cursor: pointer;
  }
  button:hover{
      filter: brightness(0.95);
  }

  .clear-data{
    background: rgb(226, 6, 6);
  }

  .course {
    color: rgb(233, 233, 233);
  }

  .errLog {
    font-size: 0.7em;
    color: orangered;
    width: 100%;
    word-wrap: break-word;
    white-space: break-spaces;
    position: relative;
  }

  .load-message{
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: row;
    gap: 10px;
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 100;
    height: 100%;
    width: 100%;
    border-radius: 10px;
    backdrop-filter: blur(5px);
    color: aliceblue;
    white-space: break-spaces;
  }

  .shake {
    animation: shake 300ms;
  }

  .success{
    color : limegreen;
  }

  .form {
    position: relative;
    width: 90%;
    max-width: 400px;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    background: rgb(21 49 68);
    border-radius: 10px;
    padding: 20px;
    z-index: 10;
    gap: 10px;
    box-shadow: 3px 3px 5px #00000030;
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

  .or::before {
    left: unset;
    right: -110px;
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
