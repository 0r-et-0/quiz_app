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
let USER, REGION;
const provider = new GoogleAuthProvider();
const getResultBtn = document.getElementById("getResultBtn");
getResultBtn.addEventListener("click", getResult);
const resultDiv = document.getElementById("showResults");
/* login */
let loginBtn = document.getElementById("logBtn");
loginBtn.addEventListener("click", signIn);

let resultByRegion = {};

/* Data from DB */
let dataFromDB;

function signIn() {
  signInWithPopup(auth, provider)
    .then((result) => {
      console.log(result);
      // This gives you a Google Access Token. You can use it to access the Google API.
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential.accessToken;
      // The signed-in user info.
      const user = result.user;
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
  const resultSection = document.getElementById("result");
  resultSection.classList.remove("hidden");
}

function getResult() {
  const dbref = ref(db);

  get(child(dbref, "users"))
    .then((snapshot) => {
      if (snapshot.exists()) {
        /* console.log(snapshot.val()); */
        dataFromDB = snapshot.val();
        generateResults();
      } else {
        console.log("No data available");
      }
    })
    .catch((error) => {
      console.error(error);
    });
}

function generateResults() {
  resultByRegion = {};
  for (const [key, value] of Object.entries(dataFromDB)) {
    let reg = value.region;
    let ans = value.answer;
    if (reg !== undefined && ans !== undefined) {
      console.log(key);
      if (resultByRegion.hasOwnProperty(reg)) {
        if (resultByRegion[reg].hasOwnProperty(ans)) {
          let count = resultByRegion[reg][ans];
          resultByRegion[reg][ans] = count + 1;
        } else {
          resultByRegion[reg][ans] = 1;
        }
      } else {
        resultByRegion[reg] = {};
        resultByRegion[reg][ans] = 1;
      }
    }
  }
  console.log(resultByRegion);
  showResuts();
}

function showResuts() {
  removeAllChildNodes(resultDiv);
  for (const [regionKey, resultValue] of Object.entries(resultByRegion)) {
    const regionDiv = document.createElement("div");
    const regionTitle = document.createElement("h2");
    regionTitle.innerHTML = regionKey;
    regionDiv.appendChild(regionTitle);
    resultDiv.appendChild(regionDiv);
    for (const [key, value] of Object.entries(resultValue)) {
      console.log(key, value);
      const resultKey = document.createElement("span");
      const resultVal = document.createElement("span");
      const br = document.createElement("br");
      resultKey.classList = "resultKey";
      resultVal.classList = "resultVal";
      resultKey.innerHTML = key;
      resultVal.innerHTML = value;
      regionDiv.appendChild(resultKey);
      regionDiv.appendChild(resultVal);
      regionDiv.appendChild(br);
    }
  }
}

function removeAllChildNodes(parent) {
  while (parent.firstChild) {
    parent.removeChild(parent.firstChild);
  }
}
