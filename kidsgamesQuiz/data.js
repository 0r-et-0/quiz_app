/* IMPORT AND CONFIG */
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import {
  getAuth,
  signInWithPopup,
  signInAnonymously,
  GoogleAuthProvider,
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
let USER;
let UPDATE_FREQUENCY = 60000;
const provider = new GoogleAuthProvider();

/* global variables */
let latestQuestion;
let checkForResultsInterval;
let resultByRegion = {};
let regionFinalData = {};
let allRegions = [
  "lausanne",
  "cote",
  "palezieux",
  "riviera",
  "neuchatel_val_de_ruz",
  "neuchatel_val_de_travers",
  "chablais",
  "valais",
  "morges",
  "echallens",
  "fribourg",
  "ouest_lausannois",
  "orbe_chavornay",
  "neuchatel_montagnes",
  "neuchatel_littoral",
  "broye",
  "jura",
  "yverdon",
];

/* Data from DB */
let dataFromDB;

/* DOM */
const questionHtml = document.getElementById("question");
const num = document.getElementById("num-of-user");
const table = document.getElementById("table-results");

/* login */
const loginBtn = document.getElementById("logBtn");
loginBtn.addEventListener("click", signIn);

function signIn() {
  signInWithPopup(auth, provider)
    .then((result) => {
      // The signed-in user info.
      console.log("login succed");
      removeLoginBtn();
      onValue(ref(db, "questions"), (snapshot) => {
        if (snapshot.exists()) {
          console.log("New results from db...");
          latestQuestion = snapshot.val();
          questionHtml.innerHTML = latestQuestion.question;
          clearInterval(checkForResultsInterval);
          checkForResultsInterval = setIntervalAndExecute(
            getUsersAnswers,
            UPDATE_FREQUENCY
          );
        } else {
          console.log("No question found in db");
        }
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
  const adminDash = document.getElementById("dashboard");
  adminDash.classList.remove("hidden");
}

function getUsersAnswers() {
  if (
    latestQuestion.verifiedAnswer !== undefined &&
    latestQuestion.answers !== undefined &&
    latestQuestion.timer !== undefined
  ) {
    get(child(ref(db), "users"))
      .then((snapshot) => {
        if (snapshot.exists()) {
          dataFromDB = snapshot.val();
          num.innerHTML = Object.keys(dataFromDB).length;
          generateResults();
        } else {
          console.log("No data available");
        }
      })
      .catch((error) => {
        console.error(error);
      });
  } else {
    clearInterval(checkForResultsInterval);
    console.log("pas de question");
    resetMapColor();
  }
}

function generateResults() {
  resultByRegion = {};
  for (const user in dataFromDB) {
    let region = dataFromDB[user].region;
    let userAnswers = dataFromDB[user].answers;
    if (region !== undefined && region !== null) {
      if (!resultByRegion[region]) {
        resultByRegion[region] = {};
      }
      if (userAnswers !== undefined && userAnswers !== null) {
        for (const question in userAnswers) {
          let answers = userAnswers[question];
          if (!resultByRegion[region][question]) {
            resultByRegion[region][question] = {};
          }
          if (!resultByRegion[region][question][answers]) {
            resultByRegion[region][question][answers] = 0;
          }
          resultByRegion[region][question][answers] += 1;
        }
      } else {
        console.log("answer for user " + user + " is undefined !");
      }
    } else {
      console.log("region for user " + user + " is undefined !");
    }
  }
  console.log(resultByRegion);
  verifyResults();
}

function verifyResults() {
  /* always check for last question */
  const questionTxt = latestQuestion.question;
  const questionId = latestQuestion.id;
  const possiblesAnswers = latestQuestion.answers;

  /* check if it's a true question (not for the starting sentence) */

  for (const region in resultByRegion) {
    //console.log("-----------------" + region + "-----------------------");
    for (const q in resultByRegion[region]) {
      let AnswersForCurrentQuestion = resultByRegion[region][q];
      let regionAnswerData = {
        answer: "",
        count: 0,
        count_all_players: 0,
        percent: 0,
      };
      /* only if region has at least one response */
      if (AnswersForCurrentQuestion) {
        /* browse all answer and find the most answered answer for each region */
        //console.log("Answer for question " + q);

        for (const [key, value] of Object.entries(AnswersForCurrentQuestion)) {
          /* if answer if most answered that the last we update */
          if (value > regionAnswerData.count) {
            regionAnswerData.answer = key;
            regionAnswerData.count = value;
          } else if (value === regionAnswerData.count) {
            /* draw */
            if (key === QUESTION_DATA[q].verifiedAnswer) {
              /* console.log("best answer is taken in the draw"); */
              regionAnswerData.answer = key;
              regionAnswerData.count = value;
            }
          }
          /* we add to the total */
          regionAnswerData.count_all_players += value;
        }

        regionAnswerData.percent =
          (regionAnswerData.count * 100) / regionAnswerData.count_all_players;

        /* if question id does not exist in regionFinalData we add it */
        if (!(q in regionFinalData)) {
          regionFinalData[q] = {};
        }

        //check if answer region is true or false
        if (regionAnswerData.answer === QUESTION_DATA[q].verifiedAnswer) {
          regionFinalData[q][region] = {
            answer: true,
            numPlayer: regionAnswerData.count_all_players,
            percent: regionAnswerData.percent,
          };
        } else {
          regionFinalData[q][region] = {
            answer: false,
            numPlayer: regionAnswerData.count_all_players,
            percent: regionAnswerData.percent,
          };
        }
      }
    }
  }
  /* if region has no key add one and set value to null */
  for (const reg of allRegions) {
    for (const q_id in regionFinalData) {
      if (!(reg in regionFinalData[q_id])) {
        regionFinalData[q_id][reg] = null;
      }
    }
  }
  console.log("Réponse des régions");
  console.log(regionFinalData);
  printTable(regionFinalData);
}

function printTable(results) {
  removeAllChildNodes(table);
  for (const region in results[latestQuestion.id]) {
    /* créer la row */
    let row = table.insertRow(0);
    let cel_count = 0;
    let obj = results[latestQuestion.id][region];
    if (obj) {
      let cell_reg = row.insertCell(cel_count);
      cell_reg.innerHTML = region;
      for (const [key, value] of Object.entries(obj)) {
        console.log(key, value);
        /* mettre les colonnes */
        let cell = row.insertCell(cel_count);
        cell.innerHTML = value;
        cel_count += 1;
      }
    }
  }
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
