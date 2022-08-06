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
let UPDATE_FREQUENCY = [10000, 2000, 5000, 60000];
const provider = new GoogleAuthProvider();

/* global variables */
let latestQuestion;
let checkForResultsInterval;
let resultByRegion = {};
let regionFinalData = {};
let frequencyMode = 0;
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
let allRegionsClean = {
  lausanne: "Lausanne",
  cote: "La Côte",
  palezieux: "Palézieux",
  riviera: "Riviera",
  neuchatel_val_de_ruz: "Neuchâtel - Val-de-Ruz",
  neuchatel_val_de_travers: "Neuchâtel - Val-de-Travers",
  chablais: "Chablais",
  valais: "Valais",
  morges: "Morges",
  echallens: "Echallens",
  fribourg: "Fribourg - La Gruyère",
  ouest_lausannois: "Ouest-Lausannois",
  orbe_chavornay: "Orbe-Chavornay",
  neuchatel_montagnes: "Neuchâtel - Montagnes",
  neuchatel_littoral: "Neuchâtel - Littoral",
  broye: "La Broye",
  jura: "Jura bernois - Jura",
  yverdon: "Yverdon-les-Bains",
};

/* Data from DB */
let dataFromDB;

/* DOM */
const questionHtml = document.getElementById("question");
const num = document.getElementById("num-of-user");
const table = document.getElementById("table-results");
const tableFinal = document.getElementById("table-results-final");
const stopBtn = document.getElementById("stop-btn");
stopBtn.innerHTML = UPDATE_FREQUENCY[frequencyMode % UPDATE_FREQUENCY.length];
stopBtn.addEventListener("click", () => {
  clearInterval(checkForResultsInterval);
  frequencyMode += 1;
  stopBtn.innerHTML = UPDATE_FREQUENCY[frequencyMode % UPDATE_FREQUENCY.length];
  checkForResultsInterval = setIntervalAndExecute(
    getUsersAnswers,
    UPDATE_FREQUENCY[frequencyMode % UPDATE_FREQUENCY.length]
  );
});
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
            UPDATE_FREQUENCY[frequencyMode % UPDATE_FREQUENCY.length]
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
  console.log(UPDATE_FREQUENCY[frequencyMode % UPDATE_FREQUENCY.length]);
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
        //console.log("answer for user " + user + " is undefined !");
      }
    } else {
      //console.log("region for user " + user + " is undefined !");
    }
  }
  console.log(resultByRegion);
  verifyResults();
}

function verifyResults() {
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
        /* adding percentage of the biggest answer */
        let per =
          (regionAnswerData.count * 100) / regionAnswerData.count_all_players;
        let rounded_per = Math.round(per);
        regionAnswerData.percent = rounded_per;

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
  console.log("Réponses des régions");
  console.log(regionFinalData);
  printTable(regionFinalData);
  calcTotal(regionFinalData);
}

function printTable(results) {
  removeAllChildNodes(table);
  let header = table.insertRow(0);
  let header_cel = header.insertCell(0);
  let header_cel_2 = header.insertCell(1);
  let header_cel_3 = header.insertCell(2);
  let header_cel_4 = header.insertCell(3);
  header_cel.innerHTML = "Région";
  header_cel_2.innerHTML = "Réponse";
  header_cel_3.innerHTML = "Nbr de participants";
  header_cel_4.innerHTML = "Pourcentage";

  for (const region in results[latestQuestion.id]) {
    /* créer la row */
    let row = table.insertRow(1);
    let obj = results[latestQuestion.id][region];
    if (obj) {
      let cell_1 = row.insertCell(0);
      cell_1.innerHTML = allRegionsClean[region];
      cell_1.style.fontWeight = "bolder";
      let cell_2 = row.insertCell(1);
      cell_2.innerHTML = obj.answer;
      if (obj.answer) {
        cell_2.style.backgroundColor = "#4aed88";
      } else {
        cell_2.style.backgroundColor = "#eb717d";
      }
      let cell_3 = row.insertCell(2);
      cell_3.innerHTML = obj.numPlayer;
      let cell_4 = row.insertCell(3);
      cell_4.innerHTML = obj.percent;
    }
  }
}

function calcTotal(results) {
  let scoreTotal = {};
  for (const region of allRegions) {
    scoreTotal[region] = 0;
    for (const question in results) {
      if (results[question][region]) {
        if (results[question][region].answer === true) {
          const per = results[question][region].percent;
          scoreTotal[region] += per;
        }
      }
    }
  }
  printTableCal(scoreTotal);
}

function printTableCal(results) {
  removeAllChildNodes(tableFinal);
  let header = tableFinal.insertRow(0);
  let header_cel = header.insertCell(0);
  let header_cel_2 = header.insertCell(1);
  header_cel.innerHTML = "Région";
  header_cel_2.innerHTML = "Score";

  let entries = Object.entries(results);
  let sorted = entries.sort((a, b) => a[1] - b[1]);

  for (const region of sorted) {
    /* créer la row */
    let row = tableFinal.insertRow(1);
    let cell_1 = row.insertCell(0);
    cell_1.innerHTML = allRegionsClean[region[0]];
    cell_1.style.fontWeight = "bolder";
    let cell_2 = row.insertCell(1);
    cell_2.innerHTML = region[1];
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
