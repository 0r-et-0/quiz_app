/* IMPORT AND CONFIG */

// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-analytics.js";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import {
  getDatabase,
  ref,
  set,
  child,
  get,
  update,
  remove,
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-database.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
const analytics = getAnalytics(app);
const db = getDatabase();
const auth = getAuth(app);

onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("signed in");
    // User is signed in, see docs for a list of available properties
    // https://firebase.google.com/docs/reference/js/firebase.User
    const uid = user.uid;
    // ...
  } else {
    console.log("signed out");
    // User is signed out
    // ...
  }
});

let USER, REGION;
const provider = new GoogleAuthProvider();
/* global */
let selectedQuestion;
let questionFromJson;
var sendBtn = document.getElementById("send-question");

/* event listener */
sendBtn.addEventListener("click", () => {
  let radioButtons = document.querySelectorAll('input[name="question"]');
  for (let i = 0; i < radioButtons.length; i++) {
    if (radioButtons[i].checked) {
      selectedQuestion = i;
      break;
    }
  }
  cleanAnswers();
});

/* login */
let loginBtn = document.getElementById("logBtn");
loginBtn.addEventListener("click", signIn);

function fetchQuestions() {
  /* generer les questions depuis le fichier json */
  fetch("./questions.json")
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      questionFromJson = data;
      console.log(questionFromJson);
      createQuestions();
    });
}

function createQuestions() {
  const fieldset = document.getElementById("questions");
  let index = 0;
  for (const question of questionFromJson) {
    index += 1;
    /*     const div = document.createElement("div"); */
    const input = document.createElement("input");
    input.id = "q" + index;
    input.type = "radio";
    input.name = "question";
    input.value = question.question;
    const label = document.createElement("label");
    label.setAttribute("for", "q" + index);
    label.innerHTML = question.question;

    fieldset.appendChild(input);
    fieldset.appendChild(label);
    /* 
    fieldset.appendChild(div); */
  }
}

function sendQuestion() {
  set(ref(db, "questions"), {
    end_time: "1min",
    question: questionFromJson[selectedQuestion].question,
    answers: questionFromJson[selectedQuestion].answers
      ? questionFromJson[selectedQuestion].answers
      : null,
  })
    .then(() => {
      alert("question envoyée avec succès");
    })
    .catch((error) => {
      console.log(USER);
      alert("error: " + error + "\n" + USER);
    });
}

function cleanAnswers() {
  remove(ref(db, "users/"))
    .then(() => {
      sendQuestion();
    })
    .catch((error) => {
      console.log(USER);
      alert("error: " + error + "\n" + USER);
    });
}

function signIn() {
  signInWithPopup(auth, provider)
    .then((result) => {
      // This gives you a Google Access Token. You can use it to access the Google API.
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential.accessToken;
      // The signed-in user info.
      USER = result.user;
      console.log("login succed");
      setupDashboard();
      // ...
    })
    .catch((error) => {
      // Handle Errors here.
      const errorCode = error.code;
      const errorMessage = error.message;
      // The email of the user's account used.
      const email = error.email;
      // The AuthCredential type that was used.
      const credential = GoogleAuthProvider.credentialFromError(error);
      console.log(errorCode, errorMessage);
      // ...
    });
}

function setupDashboard() {
  /* remove login btn */
  const loginBtn = document.getElementById("inputs");
  loginBtn.classList.add("hidden");
  const adminDash = document.getElementById("admin-dashboard");
  adminDash.classList.remove("hidden");
}

window.onload = fetchQuestions();
