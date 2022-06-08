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
const getResultBtn = document.getElementById("getResultBtn");
getResultBtn.addEventListener("click", getUsersAnswers);
const map = document.getElementById("map");
const questionAnswered = document.getElementById("question");
/* login */
let loginBtn = document.getElementById("logBtn");
loginBtn.addEventListener("click", signIn);

let resultByRegion = {};
let latestQuestion;

/* Data from DB */
let dataFromDB;

function signIn() {
  signInWithPopup(auth, provider)
    .then((result) => {
      /* start listen to db changes */
      onValue(ref(db, "questions"), (snapshot) => {
        latestQuestion = snapshot.val();
        questionAnswered.innerHTML = latestQuestion.question;
        getUsersAnswers();
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
  get(child(ref(db), "users"))
    .then((snapshot) => {
      if (snapshot.exists()) {
        dataFromDB = snapshot.val();
        console.log(dataFromDB);
        console.log("nombre de users :" + Object.keys(dataFromDB).length);
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
  for (const user in dataFromDB) {
    let region = dataFromDB[user].region;
    let questionAndAnswers = dataFromDB[user].answers;
    if (region !== undefined || region !== null) {
      if (!resultByRegion[region]) {
        resultByRegion[region] = {};
      }
      if (questionAndAnswers !== undefined || region !== null) {
        for (const question in questionAndAnswers) {
          let answers = questionAndAnswers[question];
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
  const questionId = latestQuestion.id;
  const possiblesAnswers = latestQuestion.answers;
  const verifiedAnswer = latestQuestion.verifiedAnswer;

  let regionFinalAnswers = {};
  console.log(questionId, possiblesAnswers, verifiedAnswer);
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
            console.log(
              "%cit's a draw",
              "color: white; font-style: italic; background-color: green;padding: 2px"
            );
            /* we will take the verified answer if possible */
            if (key === verifiedAnswer) {
              console.log("best answer is taken in the draw");
              regionBiggestAnswer.answer = key;
              regionBiggestAnswer.count = value;
            }
          }
        }
        console.log(
          "%c" + region + "%c final answer is " + regionBiggestAnswer.answer,
          "color: white; font-style: italic; background-color: green;padding: 2px"
        );
        console.log("detailed answers :");
        console.log(AnswersForCurrentQuestion);
        console.log("/////");
        //check if answer region is true or false
        if (regionBiggestAnswer.answer === verifiedAnswer) {
          regionFinalAnswers[region] = true;
        } else {
          regionFinalAnswers[region] = false;
        }
      }
    }
    console.log("final results for each region :");
    console.log(regionFinalAnswers);

    colorTheMap(regionFinalAnswers);
  }
  //color the map in grey here
}
// Returns a Promise that resolves after "ms" Milliseconds
const timer = (ms) => new Promise((res) => setTimeout(res, ms));

async function colorTheMap(response) {
  for (const region in response) {
    const svgRegion = document.getElementById(region).firstElementChild;
    if (svgRegion) {
      if (response[region]) {
        svgRegion.style.fill = "green";
      } else {
        svgRegion.style.fill = "red";
      }
    }
    await timer(50);
  }
}

function removeAllChildNodes(parent) {
  while (parent.firstChild) {
    parent.removeChild(parent.firstChild);
  }
}
