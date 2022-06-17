/* IMPORT AND CONFIG */
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
const provider = new GoogleAuthProvider();
/* DOM */
const map = document.getElementById("map");
const questionAnswered = document.getElementById("question");
/* login */
let loginBtn = document.getElementById("logBtn");
loginBtn.addEventListener("click", signIn);

let resultByRegion = {};
let latestQuestion;
let checkForResultsInterval;
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

function signIn() {
  signInWithPopup(auth, provider)
    .then((result) => {
      /* start listen to db changes */
      onValue(ref(db, "questions"), (snapshot) => {
        latestQuestion = snapshot.val();
        questionAnswered.innerHTML = latestQuestion.question;
        clearInterval(checkForResultsInterval);
        resetMapColor();
        checkForResultsInterval = setIntervalAndExecute(getUsersAnswers, 5000);
      });
      setupDashboard();
    })
    .catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
      console.log(errorCode, errorMessage);
    });
}

function setupDashboard() {
  /* remove login btn */
  const loginBtn = document.getElementById("inputs");
  loginBtn.classList.add("hidden");
  const resultSection = document.getElementById("result");
  resultSection.classList.remove("hidden");
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
          document.getElementById("numbersOfUser").innerHTML =
            "nombre de participants: " + numbOfUsers;
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
  const verifiedAnswer = latestQuestion.verifiedAnswer;

  let regionFinalAnswers = {};

  console.log(
    "%cla question posée est : " + questionTxt,
    "color: white; font-style: italic; background-color: blue;padding: 2px"
  );
  console.log(
    "%cla bonne réponse est : " + verifiedAnswer,
    "color: white; font-style: italic; background-color: green;padding: 2px"
  );
  /* check if it's a true question (not the starting sentence) */
  if (possiblesAnswers) {
    for (const region in resultByRegion) {
      let AnswersForCurrentQuestion = resultByRegion[region][questionId];
      let regionBiggestAnswer = { answer: "", count: 0 };
      /* only if region has at least one response */
      if (AnswersForCurrentQuestion) {
        /* browse all answer and find the most answered answer for each region */
        for (const [key, value] of Object.entries(AnswersForCurrentQuestion)) {
          /* if answer if most answered that the last we update */
          if (value > regionBiggestAnswer.count) {
            regionBiggestAnswer.answer = key;
            regionBiggestAnswer.count = value;
          } else if (value === regionBiggestAnswer.count) {
            /* if we have a draw between two answer... */
            /*             console.log(
              "%cit's a draw",
              "color: white; font-style: italic; background-color: green;padding: 2px"
            ); */
            /* we will take the verified answer if possible */
            if (key === verifiedAnswer) {
              /* console.log("best answer is taken in the draw"); */
              regionBiggestAnswer.answer = key;
              regionBiggestAnswer.count = value;
            }
          }
        }
        /*         console.log(
          "%c" + region + "%c final answer is " + regionBiggestAnswer.answer,
          "color: white; font-style: italic; background-color: green;padding: 2px"
        ); 
        console.log("detailed answers :");
        console.log(AnswersForCurrentQuestion);
        console.log("/////");
        */

        //check if answer region is true or false
        if (regionBiggestAnswer.answer === verifiedAnswer) {
          regionFinalAnswers[region] = true;
        } else {
          regionFinalAnswers[region] = false;
        }
      }
    }
    for (const reg of allRegions) {
      if (!(reg in regionFinalAnswers)) {
        regionFinalAnswers[reg] = null;
      }
    }
    console.log("Réponse des régions");
    console.table(regionFinalAnswers);

    colorTheMap(regionFinalAnswers);
  } else {
    console.log("ce n'est pas la question");
  }
  //color the map in grey here
}

async function colorTheMap(response) {
  for (const region in response) {
    const svgRegion = document.getElementById(region).firstElementChild;
    if (svgRegion) {
      if (response[region]) {
        svgRegion.style.fill = "#a2c61c";
      } else if (response[region] === false) {
        svgRegion.style.fill = "#e10f21";
      } else {
        svgRegion.style.fill = "#EDEDED";
      }
    }
    /* fake a delay when painting the regions */
    await timer(50);
  }
}

function resetMapColor() {
  for (const region in resultByRegion) {
    const svgRegion = document.getElementById(region).firstElementChild;
    if (svgRegion) {
      svgRegion.style.fill = "#EDEDED";
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
