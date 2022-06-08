// si la question n'a pas de answers elle s'affichera comme un message

let questionsData = {
  q0: {
    question: "Bienvenue au quiz des kidsgames",
    id: "q0",
  },
  q1: {
    question:
      "Combien de régions et d’enfants ont participé à la 1ère édition en 2004 ?",
    id: "q1",
    answers: [
      "5 régions, 500 enfants",
      "9 régions, 1450 enfants",
      "15 régions, 1000 enfants",
    ],
    verifiedAnswer: "9 régions, 1450 enfants",
  },
  q2: {
    question: "Les 3 sports phares dans l’ordre avec ballons depuis 2004 ?",
    id: "q2",
    answers: [
      "Kinball, football, Tchoukball",
      "Kinball, Poullball, basket",
      "Tchoukball, Kinball, Poullball",
    ],
    verifiedAnswer: "Tchoukball, Kinball, Poullball",
  },
  q3: {
    question:
      "Où a eu lieu la dernière cérémonie d’ouverture romande en 2018 ?",
    id: "q3",
    answers: ["Fribourg", "Bulle", "Neuchâtel"],
    verifiedAnswer: "Bulle",
  },
};
