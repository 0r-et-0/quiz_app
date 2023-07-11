/* IMPORT AND CONFIG */
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
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
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
const auth = getAuth(app);
let USER;
let UPDATE_FREQUENCY = [2000, 5000, 60000];
const provider = new GoogleAuthProvider();

/* global variables */
let latestQuestion;
let checkForResultsInterval;
let resultByTable = {};
let tableFinalData = {};
let frequencyMode = 0;
let verifiedAnswerInterval;
let allTables = [
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
let allTablesClean = {
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
const responseHtml = document.getElementById("response");
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

          /* check if timer exist */
          let timer = latestQuestion.timer;
          if (timer && typeof timer === "number") {
            /* delete existing interval if exist */
            clearInterval(verifiedAnswerInterval);
            /* calculate the remaining time*/
            verifiedAnswerInterval = setIntervalAndExecute(checkForTime, 500);
          }
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

function checkForTime() {
  let timer = latestQuestion.timer;
  let timeUntilEnd = Math.round((timer - Date.now()) / 1000);
  if (timeUntilEnd > 0) {
    responseHtml.innerHTML = "";
    responseHtml.style.backgroundColor = "white";
  } else {
    if (latestQuestion.verifiedAnswer) {
      responseHtml.innerHTML = latestQuestion.verifiedAnswer;
      responseHtml.style.backgroundColor = "#4c4";
    }
    clearInterval(verifiedAnswerInterval);
  }
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
  }
}

function generateResults() {
  resultByTable = {};
  for (const user in dataFromDB) {
    let table = dataFromDB[user].table;
    let userAnswers = dataFromDB[user].answers;
    if (table !== undefined && table !== null) {
      if (!resultByTable[table]) {
        resultByTable[table] = {};
      }
      if (userAnswers !== undefined && userAnswers !== null) {
        for (const question in userAnswers) {
          let answers = userAnswers[question];
          if (!resultByTable[table][question]) {
            resultByTable[table][question] = {};
          }
          if (!resultByTable[table][question][answers]) {
            resultByTable[table][question][answers] = 0;
          }
          resultByTable[table][question][answers] += 1;
        }
      } else {
        //console.log("answer for user " + user + " is undefined !");
      }
    } else {
      //console.log("table for user " + user + " is undefined !");
    }
  }
  console.log(resultByTable);
  verifyResults();
}

function verifyResults() {
  for (const table in resultByTable) {
    //console.log("-----------------" + table + "-----------------------");
    for (const q in resultByTable[table]) {
      let AnswersForCurrentQuestion = resultByTable[table][q];
      let tableAnswerData = {
        answer: "",
        count: 0,
        count_all_players: 0,
        percent: 0,
      };
      /* only if table has at least one response */
      if (AnswersForCurrentQuestion) {
        /* browse all answer and find the most answered answer for each table */
        for (const [key, value] of Object.entries(AnswersForCurrentQuestion)) {
          /* if answer if most answered that the last we update */
          if (value > tableAnswerData.count) {
            tableAnswerData.answer = key;
            tableAnswerData.count = value;
          } else if (value === tableAnswerData.count) {
            /* draw */
            if (key === QUESTION_DATA[q].verifiedAnswer) {
              /* console.log("best answer is taken in the draw"); */
              tableAnswerData.answer = key;
              tableAnswerData.count = value;
            }
          }
          /* we add to the total */
          tableAnswerData.count_all_players += value;
        }
        /* adding percentage of the biggest answer */
        let per =
          (tableAnswerData.count * 100) / tableAnswerData.count_all_players;
        let rounded_per = Math.round(per);
        tableAnswerData.percent = rounded_per;

        /* if question id does not exist in tableFinalData we add it */
        if (!(q in tableFinalData)) {
          tableFinalData[q] = {};
        }
        //check if answer table is true or false
        if (tableAnswerData.answer === QUESTION_DATA[q].verifiedAnswer) {
          tableFinalData[q][table] = {
            answer: true,
            numPlayer: tableAnswerData.count_all_players,
            percent: tableAnswerData.percent,
          };
        } else {
          tableFinalData[q][table] = {
            answer: false,
            numPlayer: tableAnswerData.count_all_players,
            percent: tableAnswerData.percent,
          };
        }
      }
    }
  }
  /* if table has no key add one and set value to null */
  for (const reg of allTables) {
    for (const q_id in tableFinalData) {
      if (!(reg in tableFinalData[q_id])) {
        tableFinalData[q_id][reg] = null;
      }
    }
  }
  console.log("Réponses des régions");
  console.log(tableFinalData);
  printTable(tableFinalData);
  calcTotal(tableFinalData);
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

  for (const table in results[latestQuestion.id]) {
    /* créer la row */
    let row = table.insertRow(1);
    let obj = results[latestQuestion.id][table];
    if (obj) {
      let cell_1 = row.insertCell(0);
      cell_1.innerHTML = allTablesClean[table];
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
  for (const table of allTables) {
    scoreTotal[table] = 0;
    for (const question in results) {
      if (results[question][table]) {
        if (results[question][table].answer === true) {
          const per = results[question][table].percent;
          scoreTotal[table] += per;
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

  for (const table of sorted) {
    /* créer la row */
    let row = tableFinal.insertRow(1);
    let cell_1 = row.insertCell(0);
    cell_1.innerHTML = allTablesClean[table[0]];
    cell_1.style.fontWeight = "bolder";
    let cell_2 = row.insertCell(1);
    cell_2.innerHTML = table[1];
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
