/* IMPORT AND CONFIG */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import {
  getDatabase,
  ref,
  set,
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-database.js";

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
const auth = getAuth(app);
const TIMER = 30000;
let countDownInterval;
const timerSpan = document.getElementById("timer-span");
let timeUntilEnd;


const provider = new GoogleAuthProvider();
/* global */
let selectedQuestion;
const sendBtn = document.getElementById("send-question");
const finalBtnTrue = document.getElementById("final-true");
const finalBtnFalse = document.getElementById("final-false");

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

finalBtnTrue.addEventListener("click", () => {
  set(ref(db, "final"), {
    showScore: true,
  });
});

finalBtnFalse.addEventListener("click", () => {
  set(ref(db, "final"), {
    showScore: false,
  });
});

/* login */
const loginBtn = document.getElementById("logBtn");
loginBtn.addEventListener("click", signIn);

function createQuestions() {
  const fieldset = document.getElementById("questions");
  console.log(QUESTION_DATA);
  for (const question in QUESTION_DATA) {
    console.log(question);
    const input = document.createElement("input");
    input.id = question;
    input.type = "radio";
    input.name = "question";
    input.value = QUESTION_DATA[question].question;
    const label = document.createElement("label");
    label.setAttribute("for", question);
    label.innerHTML = QUESTION_DATA[question].question;

    fieldset.appendChild(input);
    fieldset.appendChild(label);
  }
}

function sendQuestion() {
  console.log(QUESTION_DATA[selectedQuestion]);

  timeUntilEnd = Math.round(TIMER / 1000);
  const currentQuestion = QUESTION_DATA[selectedQuestion];

  set(ref(db, "questions"), {
    question: currentQuestion.question,
    id: currentQuestion.id,
    timer: currentQuestion.answers ? Date.now() + TIMER : null,
    answers: currentQuestion.answers || null,
    verifiedAnswer: currentQuestion.verifiedAnswer || null,
  })
    .then(() => {
      console.log('salut')
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
      set(ref(db, "final"), {
        showScore: false,
      });
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
