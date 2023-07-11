/* IMPORT AND CONFIG */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import {
  getAuth,
  signInWithPopup,
  signInAnonymously,
  GoogleAuthProvider,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import {
  getDatabase,
  ref,
  set,
  child,
  get,
  onValue,
  update,
  remove,
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
let USER;
let UPDATE_FREQUENCY = 3000;
const provider = new GoogleAuthProvider();

/* DOM */
const map = document.getElementById("map");
const questionAnswered = document.getElementById("question");
const responseHtml = document.getElementById("response");
const scoreHtml = document.getElementById("score");

/* login */
/* let loginBtn = document.getElementById("logBtn");
loginBtn.addEventListener("click", signIn); */

let resultByTable = {};
let latestQuestion;
let checkForResultsInterval;
let verifiedAnswerInterval;
let allTables = [
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
  "g",
  "h",
  "i",
  "j",
  "k",
  "l",
  "m",
  "n",
  "o",
];
let allTablesClean = {
  a: "a",
  b: "b",
  c: "c",
  d: "d",
  e: "e",
  f: "f",
  g: "g",
  h: "h",
  i: "i",
  j: "j",
  k: "k",
  l: "l",
  m: "m",
  n: "n",
  o: "o",
};
let tableFinalData = {};
let finalScoreSorted = [];

/* Data from DB */
let dataFromDB;

/* AUTH */
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

/* execute when user is sign in */
onAuthStateChanged(auth, (user) => {
  if (user) {
    const user = auth.currentUser;
    USER = user.uid;
    /* start listen to db changes */
    onValue(ref(db, "questions"), (snapshot) => {
      if (snapshot.exists()) {
        console.log("New results from db...");
        latestQuestion = snapshot.val();
        questionAnswered.innerHTML = latestQuestion.question;
        questionAnswered.style.backgroundColor = "#444";
        clearInterval(checkForResultsInterval);
        resetMapColor();
        checkForResultsInterval = setIntervalAndExecute(
          getUsersAnswers,
          UPDATE_FREQUENCY
        );

        /* check if timer exist */
        let timer = latestQuestion.timer;
        if (timer && typeof timer === "number") {
          /* delete existing interval if exist */
          clearInterval(verifiedAnswerInterval);
          /* calculate the remaining time*/
          verifiedAnswerInterval = setIntervalAndExecute(checkForTime, 500);
        } else {
          response.innerHTML = "";
          response.style.backgroundColor = "transparent";
        }
      } else {
        console.log("No question found in db");
      }
    });

    onValue(ref(db, "final"), (snapshot) => {
      if (snapshot.exists()) {
        if (snapshot.val().showScore) {
          scoreHtml.classList.remove("hidden");
          map.classList.add("hidden");
        } else {
          scoreHtml.classList.add("hidden");
          map.classList.remove("hidden");
        }
      } else {
        console.log("fianl set up");
      }
    });
  }
});

function checkForTime() {
  let timer = latestQuestion.timer;
  let timeUntilEnd = Math.round((timer - Date.now()) / 1000);
  if (timeUntilEnd > 0) {
    response.innerHTML = "";
    response.style.backgroundColor = "transparent";
  } else {
    if (latestQuestion.verifiedAnswer) {
      response.innerHTML = latestQuestion.verifiedAnswer;
      response.style.backgroundColor = "#a2c61c";
    }
    clearInterval(verifiedAnswerInterval);
  }
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
          let numbOfUsers = Object.keys(dataFromDB).length;
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
  colorTheMap(tableFinalData[latestQuestion.id]);
  calcTotal(tableFinalData);
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
  removeAllChildNodes(scoreHtml);
  let entries = Object.entries(scoreTotal);
  finalScoreSorted = entries.sort((a, b) => b[1] - a[1]);
  console.log(finalScoreSorted);
  let winner = document.createElement("h1");
  winner.innerHTML = allTablesClean[finalScoreSorted[0][0]];
  winner.classList.add("table-score");
  winner.style.color = "#b20067";
  let second = document.createElement("h1");
  second.innerHTML = allTablesClean[finalScoreSorted[1][0]];
  second.classList.add("table-score");
  second.style.color = "#0088c6";
  let third = document.createElement("h1");
  third.innerHTML = allTablesClean[finalScoreSorted[2][0]];
  third.classList.add("table-score");
  third.style.color = "#d5091c";
  scoreHtml.appendChild(winner);
  scoreHtml.appendChild(second);
  scoreHtml.appendChild(third);
}

function verifyResults_old() {
  /* always check for last question */
  const questionTxt = latestQuestion.question;
  const questionId = latestQuestion.id;
  const possiblesAnswers = latestQuestion.answers;
  const verifiedAnswer = latestQuestion.verifiedAnswer;

  console.log(
    "%cla question posée est : " + questionTxt,
    "color: white; font-style: italic; background-color: blue;padding: 2px"
  );
  console.log(
    "%cla bonne réponse est : " + verifiedAnswer,
    "color: white; font-style: italic; background-color: green;padding: 2px"
  );
  /* check if it's a true question (not for the starting sentence) */
  if (possiblesAnswers) {
    for (const table in resultByTable) {
      let AnswersForCurrentQuestion = resultByTable[table][questionId];
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
            /* if we have a draw between two answer... */
            /*             console.log(
              "%cit's a draw",
              "color: white; font-style: italic; background-color: green;padding: 2px"
            ); */
            /* we will take the verified answer if possible */
            if (key === verifiedAnswer) {
              /* console.log("best answer is taken in the draw"); */
              tableAnswerData.answer = key;
              tableAnswerData.count = value;
            }
          }
          /* we add to the total */
          tableAnswerData.count_all_players += value;
        }

        tableAnswerData.percent =
          (tableAnswerData.count * 100) / tableAnswerData.count_all_players;
        /*         console.log(
          "%c" + table + "%c final answer is " + tableBiggestAnswer.answer,
          "color: white; font-style: italic; background-color: green;padding: 2px"
        );
        console.log("detailed answers :");
        console.log(AnswersForCurrentQuestion);
        console.log("/////");
        */

        if (!(questionId in tableFinalData)) {
          tableFinalData[questionId] = {};
        }

        //check if answer table is true or false
        if (tableAnswerData.answer === verifiedAnswer) {
          tableFinalData[questionId][table] = {
            answer: true,
            numPlayer: tableAnswerData.count_all_players,
            percent: tableAnswerData.percent,
          };
        } else {
          tableFinalData[questionId][table] = {
            answer: false,
            numPlayer: tableAnswerData.count_all_players,
            percent: tableAnswerData.percent,
          };
        }
      }
    }
    console.log(tableFinalData);
    /* if table has no key add one and set value to null */
    for (const reg of allTables) {
      if (tableFinalData[questionId]) {
        if (!(reg in tableFinalData[questionId])) {
          tableFinalData[questionId][reg] = null;
        }
      }
    }
    console.log("Réponse des régions");
    console.log(tableFinalData);

    colorTheMap(tableFinalData[questionId]);
  } else {
    console.log("Pas de question possée");
  }
  //color the map in grey here
}

async function colorTheMap(response) {
  console.log(response)
  for (const table in response) {
    const svgTable = document.getElementById(table).firstElementChild;
    if (svgTable) {
      if (response[table]) {
        if (response[table].answer) {
          svgTable.style.fill = "#a2c61c";
        } else if (response[table].answer === false) {
          svgTable.style.fill = "#e10f21";
        }
      } else {
        svgTable.style.fill = "#EDEDED";
      }
    }
    /* fake a delay when painting the tables */
    await timer(50);
  }
}

function resetMapColor() {

  for (const table in resultByTable) {

    const svgTable = document.getElementById(table).firstElementChild;
    if (svgTable) {
      svgTable.style.fill = "#EDEDED";
    }
  }
}

function removeAllChildNodes(parent) {
  while (parent.firstChild) {
    parent.removeChild(parent.firstChild);
  }
}

function setIntervalAndExecute(fn, t) {
  fn();
  return setInterval(fn, t);
}

// Returns a Promise that resolves after "ms" Milliseconds
const timer = (ms) => new Promise((res) => setTimeout(res, ms));
