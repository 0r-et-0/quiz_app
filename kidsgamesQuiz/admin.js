/* IMPORT AND CONFIG */
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import {
  getDatabase,
  ref,
  set,
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyD3ccrB_rquaD6Fs6fgyuvt8W-lMCcBv_Q",
  authDomain: "kidsgames-quiz.firebaseapp.com",
  projectId: "kidsgames-quiz",
  storageBucket: "kidsgames-quiz.appspot.com",
  messagingSenderId: "371626728077",
  appId: "1:371626728077:web:5d100065bc868727b760c4",
  measurementId: "G-20ZE6HZ84D",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase();
const auth = getAuth(app);
const TIMER = 30000;
let countDownInterval;
const timerSpan = document.getElementById("timer-span");
let timeUntilEnd;

/* onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("signed in");
    const uid = user.uid;
  } else {
    console.log("signed out");
  }
}); */

const provider = new GoogleAuthProvider();
/* global */
let selectedQuestion;
const sendBtn = document.getElementById("send-question");

/* event listener */
sendBtn.addEventListener("click", () => {
  const radioButtons = document.querySelectorAll("input[name='question']");
  for (let i = 0; i < radioButtons.length; i++) {
    if (radioButtons[i].checked) {
      selectedQuestion = radioButtons[i].id;
      break;
    }
  }
  sendQuestion();
  /* cleanAnswers(); */
});

/* login */
const loginBtn = document.getElementById("logBtn");
loginBtn.addEventListener("click", signIn);

function createQuestions() {
  const fieldset = document.getElementById("questions");
  console.log(questionsData);
  for (const question in questionsData) {
    console.log(question);
    const input = document.createElement("input");
    input.id = question;
    input.type = "radio";
    input.name = "question";
    input.value = questionsData[question].question;
    const label = document.createElement("label");
    label.setAttribute("for", question);
    label.innerHTML = questionsData[question].question;

    fieldset.appendChild(input);
    fieldset.appendChild(label);
  }
}

function sendQuestion() {
  console.log(questionsData[selectedQuestion]);

  timeUntilEnd = Math.round(TIMER / 1000);
  const currentQuestion = questionsData[selectedQuestion];

  set(ref(db, "questions"), {
    question: currentQuestion.question,
    id: currentQuestion.id,
    timer: currentQuestion.answers ? Date.now() + TIMER : null,
    answers: currentQuestion.answers || null,
    verifiedAnswer: currentQuestion.verifiedAnswer || null,
  })
    .then(() => {
      /* alert("question envoyée avec succès"); */
      clearInterval(countDownInterval);
      if (selectedQuestion !== 0) {
        countDownInterval = setIntervalAndExecute(updateCountDown, 1000);
      }
    })
    .catch((error) => {
      alert("error: " + error);
    });
}

function signIn() {
  signInWithPopup(auth, provider)
    .then((result) => {
      // The signed-in user info.
      console.log("login succed");
      removeLoginBtn();
      createQuestions();
      // ...
    })
    .catch((error) => {
      // Handle Errors here.
      const errorCode = error.code;
      const errorMessage = error.message;
      console.log(errorCode, errorMessage);
    });
}

function removeLoginBtn() {
  /* remove login btn */
  const loginBtn = document.getElementById("inputs");
  loginBtn.classList.add("hidden");
  const adminDash = document.getElementById("admin-dashboard");
  adminDash.classList.remove("hidden");
}

function updateCountDown() {
  timerSpan.innerHTML = secondsToMin(timeUntilEnd);
  if (timeUntilEnd > 0) {
    // so it doesn't go to -1
    timeUntilEnd--;
  } else {
    clearInterval(countDownInterval);
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
