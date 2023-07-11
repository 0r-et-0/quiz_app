// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import {
  getDatabase,
  ref,
  get,
  onValue,
  update,
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-database.js";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAw5MfHfJTgnYD3osV8XoNrll6n73LBCpo",
  authDomain: "mariage-cj.firebaseapp.com",
  databaseURL: "https://mariage-cj-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "mariage-cj",
  storageBucket: "mariage-cj.appspot.com",
  messagingSenderId: "21886820069",
  appId: "1:21886820069:web:e094719131e6fc9a5abe0c",
  measurementId: "G-NS0EMLM3PH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase();

/* REFERENCE */
const output = document.getElementById("question-place");
const timerDiv = document.getElementById("timer");
const answerBtn = document.getElementById("answersBtn");
const timerSpan = document.getElementById("timer-span");
const spinner = document.getElementById("spinner");
const tableInput = document.getElementById("Table");
const table = document.getElementById("table");
const questions = document.getElementById("questions-to-show");
const inputs = document.getElementById("inputs");
const SendTableBtn = document.getElementById("sendTable");
SendTableBtn.addEventListener("click", storeTable);

/* variables */
let countDownInterval;
let timeUntilEnd;
let USER, TABLE;
const TOO_LATE = "TOO_LATE";
const WAITING = "WAITING";
const SUCCESS = "SUCCESS";
const TOO_LATE_MESSAGE =
  "Désolé mais tu n'as pas répondu assez vite, attends la prochaine question !";
const CHOOSE_ANSWER_MESSAGE = "Choisis ta réponse";
const WAITING_MESSAGE =
  "Attendez sur cette page, la prochaine question va s'afficher ici";
const SUCCESS_MESSAGE =
  "Votre réponse a été envoyée avec succès, attendez la prochaine question";

/* AUTH */
const auth = getAuth();

signInAnonymously(auth)
  .then(() => {
    // Signed in..
  })
  .catch((error) => {
    const errorCode = error.code;
    const errorMessage = error.message;
    // ...
    alert(errorCode, errorMessage);
  });

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      USER = user.uid;
      try {
        await IsUserInDB();
        /* start listening to db changes */
        onValue(ref(db, "questions"), (snapshot) => {
          console.log("getting data from Firebase...");
          if (snapshot.exists()) {
            console.log(snapshot.val());
            revealQuestion(snapshot.val());
          } else {
            console.log("no snapshot");
          }
        });
      } catch (error) {
        console.error(error);
        // Handle the error appropriately
      }
    } else {
      // User is signed out
    }
  });

  async function IsUserInDB() {
    console.log(USER);
    console.log("check if user is in db");
    try {
      const snapshot = await get(ref(db, "users/" + USER));
      if (snapshot.exists()) {
        console.log("user is already registered in db");
        if (snapshot.val().table) {
          TABLE = snapshot.val().table;
          showQuestions();
        } else {
          console.log("user already registered in db but has no table");
          showTable();
        }
      } else {
        console.log("user is not already registered in db");
        showTable();
      }
      // Clear spinner
      spinner.classList.add("hidden");
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

/* INSERT DATA */
function storeTable() {
  TABLE = tableInput.value;
  sendData({ table: TABLE }, "");
  showQuestions();
}

function showTable() {
  table.classList.remove("hidden");
  table.classList.add("flex");
}

function showQuestions() {
  table.classList.add("hidden");
  table.classList.remove("flex");
  questions.classList.remove("hidden");
  inputs.classList.remove("hidden");
  inputs.classList.add("flex");
  timerDiv.classList.remove("hidden");
}

function revealQuestion(data) {
  /* delete all answer button if they exists on the DOM */
  clear();
  /* removeAllChildNodes(answerBtn); */
  output.innerHTML = data.question;
  /* parse data received form db */
  const questionId = data.id;
  const answersArray = data.answers;
  const timer = data.timer;
  /* delete existing interval if exists */
  if (countDownInterval) {
    clearInterval(countDownInterval);
  }
  /* check if timer exist */
  if (timer && typeof timer === "number") {
    /* calculate the remaining time*/
    timeUntilEnd = Math.round((timer - Date.now()) / 1000);
    /* if there is time left and question has answers -> show answers btn */
    if (timeUntilEnd > 0 && answersArray) {
      timerDiv.classList.remove("hidden");
      countDownInterval = setIntervalAndExecute(updateCountDown, 1000);
      const h3 = document.createElement("h3");
      h3.innerHTML = CHOOSE_ANSWER_MESSAGE;
      answerBtn.appendChild(h3);
      let index = 0;
      for (const answer of answersArray) {
        index++;
        const input = document.createElement("input");
        input.type = "radio";
        input.id = "a" + index;
        input.value = answer;
        // function call when user click on answer btn
        input.addEventListener(
          "click",
          () => sendAnswer(answer, questionId),
          false
        );
        const label = document.createElement("label");
        label.setAttribute("for", "a" + index);
        label.innerHTML = answer;
        answerBtn.appendChild(input);
        answerBtn.appendChild(label);
      }
    } else {
      clear();
      showMessage(TOO_LATE);
    }
  } else {
    clear();
    showMessage(WAITING);
  }
}

function clear() {
  removeAllChildNodes(answerBtn);
  timerDiv.classList.add("hidden");
  spinner.classList.add("hidden");
}

function showMessage(status) {
  const messageToUser = document.createElement("span");
  let message;
  if (status === SUCCESS) {
    messageToUser.classList.add("success");
    message = SUCCESS_MESSAGE;
  } else if (status === TOO_LATE) {
    messageToUser.classList.add("fail");
    message = TOO_LATE_MESSAGE;
  } else {
    messageToUser.classList.add("waiting");
    message = WAITING_MESSAGE;
  }
  messageToUser.innerHTML = message;
  answerBtn.appendChild(messageToUser);
  spinner.classList.remove("hidden");
}

function sendAnswer(answer, id) {
  clearInterval(countDownInterval);
  const dataToSend = { [id]: answer };
  sendData(dataToSend, "/answers");
  clear();
  showMessage(SUCCESS);
}

function sendData(dataToSend, path) {
  /* update data with new one if already exist or create new if not */
  update(ref(db, "users/" + USER + path), dataToSend)
    .then(() => {
      /* data has been send */
      console.log("data sended");
    })
    .catch((error) => {
      alert("error: " + error);
    });
}

function updateCountDown() {
  console.log("update countdown");
  timerSpan.innerHTML = secondsToMin(timeUntilEnd);
  if (timeUntilEnd > 0) {
    // so it doesn't go to -1
    timeUntilEnd--;
  } else {
    clearInterval(countDownInterval);
    clear();
    showMessage(TOO_LATE);
  }
}

/* UTILS */
function secondsToMin(s) {
  return (s - (s %= 60)) / 60 + (9 < s ? ":" : ":0") + s;
}

function setIntervalAndExecute(fn, t) {
  fn();
  return setInterval(fn, t);
}

function removeAllChildNodes(parent) {
  while (parent.firstChild) {
    parent.removeChild(parent.firstChild);
  }
}
