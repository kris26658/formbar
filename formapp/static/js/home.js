//This code is used in advanced.html, basic.html, and mobile.html

let thumbs = ["up", "wiggle", "down"];
let letters = ["a", "b", "c", "d"];
let thumbButtons = Array.from(document.querySelectorAll(".thumbButton"));
let letterButtons = Array.from(document.querySelectorAll(".letterButton"));
let chosenThumb = false;
let chosenLetter = false;
let newMessages = 0;
let permsError = "You do not have high enough permissions to do this right now.";
let bgm;
let sfx;
let segment;
let gradient;
let barpix;
let meRes;
let bgmRes;
let modeRes;
let permsRes;
let pixRes;
let studentsRes;
let removeFocus;

async function getApiData(first) {
  let apiData = await Promise.all([
    getResponse("/getme"),
    getResponse("/getbgm"),
    getResponse("/getmode"),
    getResponse("/getpermissions"),
    getResponse("/getpix"),
    getResponse("/getstudents")
  ]);
  //Save every response to a variable
  meRes = apiData[0];
  bgmRes = apiData[1];
  modeRes = apiData[2];
  permsRes = apiData[3];
  pixRes = apiData[4];
  studentsRes = apiData[5];
  //Each homepage has its own init and update functions
  if (first) init();
  else update();
}

thumbButtons.forEach((button, i) => {
  button.addEventListener("keydown", event => {
    if (event.code == "Enter") thumbsVote(i);
  });
});

letterButtons.forEach((button, i) => {
  button.addEventListener("keydown", event => {
    if (event.code == "Enter") {
      letterVote(i);
    }
  });
});

function checkIfRemoved() {
  //If the user is removed by the teacher, send them back to the login page
  if (meRes.error == "You are not logged in.") window.location = "/login?alert=You have been logged out.";
}

thumbButtons.concat(letterButtons).forEach(el => {
  el.onfocus = () => {
    clearTimeout(removeFocus);
    //Remove focus from the button after 1 second so votes can be updated again
    removeFocus = setTimeout(() => document.activeElement.blur(), 1000);
  }
});


function thumbsVote(thumb) {
  if (chosenThumb === thumb) {
    chosenThumb = false;
    removeHighlight("thumbButton" + thumb);
    request.open("GET", "/tutd?thumb=oops");
  } else {
    chosenThumb = thumb;
    request.open("GET", "/tutd?thumb=" + thumbs[thumb]);
    //Highlight selected button and reset others
    thumbButtons.forEach((button, i) => {
      i == thumb ? highlight("thumbButton" + thumb) : removeHighlight("thumbButton" + i);
    });
  }
  request.send();
}

function letterVote(letter) {
  if (chosenLetter === letter) {
    chosenLetter = false;
    removeHighlight("letterButton" + letter);
    request.open("GET", "/abcd?vote=oops");
  } else {
    chosenLetter = letter;
    request.open("GET", "/tutd?thumb=" + letters[letter]);
    //Highlight selected button and reset others
    letterButtons.forEach((button, i) => {
      i == letter ? highlight("letterButton" + letter) : removeHighlight("letterButton" + i);
    });
  }
  request.send();
}

function updateVotes() {
  //Make sure a thumb/letter button is not currently active (to prevent immediately reverting a vote)
  if (!thumbButtons.includes(document.activeElement) && !letterButtons.includes(document.activeElement)) {
    //Make sure displayed vote matches actual vote, for example if new poll is started or page is reloaded
    let thumb = meRes.thumb ? thumbs.indexOf(meRes.thumb) : false;
    let letter = meRes.letter ? letters.indexOf(meRes.letter) : false;
    if (thumb === false && chosenThumb !== false) thumbsVote(chosenThumb); //Remove the vote
    else if (thumb !== chosenThumb) thumbsVote(thumb);
    if (letter === false && chosenLetter !== false) thumbsVote(chosenLetter); //Remove the vote
    else if (letter !== chosenLetter) letterVote(letter);
  }

  let textResEl = document.getElementById("response");
  let response = meRes.textRes;
  if (response && !textResEl.value) {
    textResEl.value = response;
    checkResponse();
    responseSubmitted();
  }
  if (!response && textResEl.value) responseUnsubmitted();
}

function highlight(image) {
  let button = document.getElementById(image);
  button.src = button.src.replace(".png", "-highlight.png");
  button.classList.add("highlight");
  button.title = "Remove";
}

function removeHighlight(image) {
  let button = document.getElementById(image);
  button.src = button.src.replace("-highlight", "");
  button.classList.remove("highlight");
  switch (image) {
    case "thumbButton0":
      button.title = "Up";
      break;
    case "thumbButton1":
      button.title = "Wiggle";
      break;
    case "thumbButton2":
      button.title = "Down";
      break;
    case "letterButton0":
      button.title = "Vote A";
      break;
    case "letterButton1":
      button.title = "Vote B";
      break;
    case "letterButton2":
      button.title = "Vote C";
      break;
    case "letterButton3":
      button.title = "Vote D";
      break;
  }
}

function checkResponse() {
  let box = document.getElementById("response");
  let button = document.getElementById("submitResponse");
  if (box.value) {
    button.classList.remove("unselectable");
    button.onclick = submitResponse;
  } else {
    button.classList.add("unselectable");
    button.onclick = null;
  }
}

function submitResponse() {
  let box = document.getElementById("response");
  request.open("GET", "/textresponse?response=" + box.value);
  request.send();
  responseSubmitted();
}

function responseSubmitted() {
  let box = document.getElementById("response");
  let button = document.getElementById("submitResponse");
  box.disabled = true;
  box.classList.add("unselectable");
  button.innerText = "Unsubmit";
  button.onclick = unsubmitResponse;
}

function unsubmitResponse() {
  let box = document.getElementById("response");
  request.open("GET", "/textresponse?response=");
  request.send();
  responseUnsubmitted();
}

function responseUnsubmitted() {
  let box = document.getElementById("response");
  let button = document.getElementById("submitResponse");
  box.disabled = false;
  box.classList.remove("unselectable");
  button.innerText = "Submit";
  button.onclick = submitResponse;
}

function shorten(container, maxHeight, text, maxWidth) {
  //Set title to original string
  let original = text.innerText;
  //Remove characters while string is too long
  while (container.clientHeight > maxHeight || container.clientWidth > maxWidth) text.innerText = text.innerText.substring(0, text.innerText.length - 2) + "…";
  text.title = original;
  text.style.cursor = "help";
}

function listSounds(files) {
  sfx = eval(files.replaceAll("&#39;", "'"));
  sfx = sfx.filter(file => !file.startsWith("sfx_"));
  sfx.forEach(sound => document.getElementById("sfxFiles").innerHTML += "<option value='" + sound + "'></option>");
}

async function sendSound() {
  let soundFile = document.getElementById("sound").value;
  let res = await getResponse("/sfx?file=" + soundFile, false);
  if (sfx.includes(soundFile)) res == permsError ? alert(res) : document.getElementById("sound").value = null;
  else alert("File does not exist");
}

document.getElementById("sound").addEventListener("keydown", event => {
  if (event.code == "Enter") sendSound();
});

document.getElementById("volume").addEventListener("input", () => {
  let volume = document.getElementById("volume").value;
  if (volume == 1) volume += ".0";
  document.getElementById("volNumber").innerText = volume;
});

document.getElementById("volume").addEventListener("change", () => {
  let volume = document.getElementById("volume").value;
  if (volume == 1) volume += ".0";
  request.open("GET", "/bgm?voladj=" + volume);
  request.send();
});

function disableVolume() {
  let el = document.getElementById("volume");
  meRes.perms > permsRes.bgm ? el.disabled = true : el.disabled = false;
}

function listMusic(files) {
  bgm = eval(files.replaceAll("&#39;", "'"));
  bgm.forEach(song => document.getElementById("bgmFiles").innerHTML += "<option value='" + song + "'></option>");
}

function randomBGM() {
  document.getElementById("music").value = bgm[Math.floor(Math.random() * bgm.length)];
}

async function sendMusic() {
  let musicFile = document.getElementById("music").value;
  let volume = document.getElementById("volume").value;
  if (volume == 1) volume = "1.0";
  let res = await getResponse("/bgm?file=" + musicFile + "&volume=" + volume, false);
  if (bgm.includes(musicFile)) {
    (res.startsWith("It has only been") || res == permsError) ? alert(res) : document.getElementById("music").value = null;
  } else {
    alert("File does not exist");
  }
}

document.getElementById("music").addEventListener("keydown", event => {
  if (event.code == "Enter") sendMusic();
});

function nowPlaying() {
  //Get current song from server
  let songName = bgmRes.bgm;
  let paused = bgmRes.paused;

  let md = document.getElementById("musicDiv");
  let np = document.getElementById("nowPlaying");
  let npTitle = document.getElementById("nowPlayingTitle");
  let controls = document.getElementById("musicControls");
  let playPause = document.getElementById("playPauseMusic");

  //If a song is currently playing
  if (songName) {
    //Show "Now Playing"
    if (songName != npTitle.innerText) {
      np.classList.remove("hidden");
      let oldHeight = np.clientHeight;
      let oldWidth = md.clientWidth;
      npTitle.innerText = songName;
      if (np.clientHeight > oldHeight || md.clientWidth > oldWidth) {
        shorten(np, oldHeight, npTitle, oldWidth);
      } else {
        np.removeAttribute("title");
        np.cursor = null;
      }
      controls.classList.remove("hidden");
    }
  } else {
    //If no song is playing, hide
    np.classList.add("hidden");
    controls.classList.add("hidden");
  }

  if (paused) {
    playPause.title = "Play";
  } else {
    playPause.title = "Pause";
  }
}

function updateVolume() {
  if (document.getElementById("volume") != document.activeElement) {
    let volume = bgmRes.volume;
    document.getElementById("volume").value = volume;
    document.getElementById("volNumber").innerText = volume;
  }
}

async function playPauseMusic() {
  let res = await getResponse("/bgm?playpause=true", false);
  if (res == permsError) alert(res);
}

async function restartMusic() {
  let res = await getResponse("/bgm?rewind=true", false);
  if (res == permsError) alert(res);
}

async function stopMusic() {
  let res = await getResponse("/bgmstop", false);
  if (res == permsError) alert(res);
}

async function sendText() {
  let text = document.getElementById("text").value;
  let fg = document.getElementById("fgColor").value.slice(1);
  let bg = document.getElementById("bgColor").value.slice(1);
  //If input is blank, replace with underscore
  text ||= "_";
  let res = await getResponse("/say?phrase=" + text + "&fg=" + fg + "&bg=" + bg, false);
  res == permsError ? alert(res) : document.getElementById("text").value = null;
}

document.getElementById("text").addEventListener("keydown", event => {
  if (event.code == "Enter") sendText();
});

function segmentNumbers() {
  barpix = eval(pixRes.pixels);
  document.getElementById("segmentStart").max = barpix.length;
  document.getElementById("segmentEnd").max = barpix.length;
  document.getElementById("segmentEnd").value = barpix.length;
}

function hideSegment() {
  segment = false;
  document.getElementById("segment").classList.add("hidden");
}

function showSegment() {
  segment = true;
  document.getElementById("segment").classList.remove("hidden");
}

function validNumber(el) {
  //Convert value to integer within range
  let number = parseInt(el.value);
  if (number < el.min || isNaN(number)) el.value = el.min;
  else if (number > el.max) el.value = el.max;
  else el.value = number;
}

function hideColor2() {
  gradient = false;
  document.getElementById("color1Heading").classList.add("hidden");
  document.getElementById("color2Div").classList.add("hidden");
}

function showColor2() {
  gradient = true;
  document.getElementById("color1Heading").classList.remove("hidden");
  document.getElementById("color2Div").classList.remove("hidden");
}

async function sendColor() {
  let start = document.getElementById("segmentStart").value;
  let end = document.getElementById("segmentEnd").value;
  let hex1 = document.getElementById("color1").value.slice(1);
  let hex2 = document.getElementById("color2").value.slice(1);
  if (!segment) {
    start = 0;
    end = barpix.length;
  }
  if (!gradient) hex2 = hex1;
  let res = await getResponse("/segment?start=" + start + "&end=" + end + "&hex=" + hex1 + "&hex2=" + hex2, false);
  if (res == permsError) alert(res);
}

function ticketsText() {
  let users = Object.values(studentsRes);
  let helpTickets = users.filter(user => user.help);
  let breakRequests = users.filter(user => user.breakReq);
  let el = document.getElementById("ticketsText");
  let helpText = helpTickets.length == 1 ? "There is currently 1 help ticket in." : `There are currently ${helpTickets.length} tickets in.`
  let breakText = breakRequests.length == 1 ? "1 student has requested a bathroom break." : `${breakRequests.length} students have requested bathroom breaks.`;
  el.innerHTML = helpText + "<br>" + breakText;
}

function usersText() {
  let users = Object.values(studentsRes);
  let students = users.filter(user => user.perms == permsRes.student);
  let el = document.getElementById("usersText");
  el.innerText = users.length == 1 ? "You are the only one logged in right now." : `${users.length} people are logged in, including ${students.length} students.`;
}

function checkForHelpTicket() {
  if (meRes.help) {
    ticketSent("help");
  } else if (meRes.breakReq) {
    ticketSent("break");
  } else {
    document.getElementById("help").onclick = requestHelp;
    document.getElementById("break").onclick = requestBreak;
  }
}

function ticketSent(type) {
  let sentEl;
  let otherEl;
  if (type == "help") {
    sentEl = document.getElementById("help");
    otherEl = document.getElementById("break");
  } else if (type == "break") {
    sentEl = document.getElementById("break");
    otherEl = document.getElementById("help");
  }
  sentEl.onclick = null;
  otherEl.onclick = null;
  sentEl.classList.add("pressed");
  sentEl.classList.add("unselectable");
  sentEl.innerText = "Ticket sent";
  otherEl.classList.add("unselectable");
}

function requestHelp() {
  let el = document.getElementById("help");
  request.open("GET", "/help?action=send");
  request.send();
  ticketSent("help");
}

function requestBreak() {
  let el = document.getElementById("break");
  request.open("GET", "/break?action=request");
  request.send();
  ticketSent("break");
}