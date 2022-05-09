/* IMPORT AND CONFIG */

// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-analytics.js";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import {
  getDatabase,
  ref,
  set,
  child,
  get,
  onValue,
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
let USER, REGION;

/* SIGN IN */

//TODO
// check if user alerady add is region or not

function signIn() {
  signInAnonymously(auth)
    .then(() => {
      // Signed in..
      console.log(USER);
    })
    .catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
      console.log(errorCode, errorMessage);
    });
  onAuthStateChanged(auth, (user) => {
    if (user) {
      // User is signed in, see docs for a list of available properties
      // https://firebase.google.com/docs/reference/js/firebase.User
      USER = user.uid;
      console.log(USER);
    }
  });
}

/* REFERENCE */
let nameInput = document.getElementById("Name");
let regionInput = document.getElementById("Region");
let answerInput = document.getElementById("Answer");
let welcome = document.getElementById("welcome");
let questions = document.getElementById("questions-to-show");
let inputs = document.getElementById("inputs");
const output = document.getElementById("question-place");
const answerBtn = document.getElementById("answersBtn");

let SendRegionBtn = document.getElementById("sendRegion");

SendRegionBtn.addEventListener("click", storeRegion);

/* INSERT DATA */

function storeRegion() {
  REGION = regionInput.value;
  showQuestions();
}

function showQuestions() {
  welcome.classList.add("hidden");
  questions.classList.remove("hidden");
  inputs.classList.remove("hidden");
  inputs.classList.add("flex");
}

const starCountRef = ref(db, "questions");
onValue(starCountRef, (snapshot) => {
  const data = snapshot.val();
  if (data) {
    revealQuestion(data);
  }
});

function revealQuestion(data) {
  removeAllChildNodes(answerBtn);
  output.innerHTML = data.question;
  let answersArray = data.answers;
  /* if answers from db exist --> add a btn for each */
  if (answersArray) {
    const h3 = document.createElement("h3");
    h3.innerHTML = "Choisissez votre réponse";
    answerBtn.appendChild(h3);
    let index = 0;
    for (const answer of answersArray) {
      index++;
      const input = document.createElement("input");
      input.type = "radio";
      input.id = "a" + index;
      input.value = answer;
      input.onclick = function () {
        sendData(input.value);
      };
      const label = document.createElement("label");
      label.setAttribute("for", "a" + index);
      label.innerHTML = answer;

      answerBtn.appendChild(input);
      answerBtn.appendChild(label);
    }
  }
}

function sendData(dataToSend) {
  set(ref(db, "users/" + USER), {
    region: REGION,
    answer: dataToSend,
  })
    .then(() => {
      alert("data send successfully");
      removeAllChildNodes(answerBtn);
      const succedMessage = document.createElement("span");
      succedMessage.innerHTML =
        "Votre réponse a été envoyée, attendez la prochaine question";
      answerBtn.appendChild(succedMessage);
    })
    .catch((error) => {
      alert("error: " + error);
    });
}

function removeAllChildNodes(parent) {
  while (parent.firstChild) {
    parent.removeChild(parent.firstChild);
  }
}
/* function getData() {
  const dbref = ref(db);

  get(child(dbref, "users"))
    .then((snapshot) => {
      if (snapshot.exists()) {
        console.log(snapshot.val());
      } else {
        console.log("No data available");
      }
    })
    .catch((error) => {
      console.error(error);
    });
} */

//run script
window.onload = signIn();
