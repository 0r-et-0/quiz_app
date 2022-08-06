// si la question n'a pas de answers elle s'affichera comme un message

const QUESTION_DATA = {
  q0: {
    question: "Bienvenue au quiz des kidsgames",
    id: "q0",
  },
  q1: {
    question:
      "En quelle année a eu lieu la première édition des Kidsgames en suisse romande ?",
    id: "q1",
    answers: ["2002", "2004", "2010", "2012"],
    verifiedAnswer: "2004",
  },
  q2: {
    question: "Quel sport n’a jamais été joué officiellement aux Kidsgames ?",
    id: "q2",
    answers: ["Tchoukball", "Kinball", "Basketball", "Poullball"],
    verifiedAnswer: "Basketball",
  },
  q3: {
    question: "Quel est le thème des Kidsgames 2016 ?",
    id: "q3",
    answers: ["Choisis la vie", "Relève le défi", "Sois un vrai héros"],
    verifiedAnswer: "Sois un vrai héros",
  },
  q4: {
    question:
      "Qui a gagné la coupe du Fair Play lors de la cérémonie de clôture de 2012 ?",
    id: "q4",
    answers: ["Jura-Bernois", "Echallens", "La Côte"],
    verifiedAnswer: "Jura-Bernois",
  },
  q5: {
    question: "Combien de “Béatitudes” sont mentionnées par Jésus ?",
    id: "q5",
    answers: ["10", "8", "7"],
    verifiedAnswer: "8",
  },
  q6: {
    question: "Quel est le diamètre du ballon de KinBall",
    id: "q6",
    answers: ["132 cm", "112 cm", "122 cm"],
    verifiedAnswer: "122 cm",
  },
  q7: {
    question: "Quelles couleurs sont sur le logo des KidsGames ?",
    id: "q7",
    answers: [
      "bleu / rouge / vert / rose / jaune",
      "bleu / orange / vert / violet / jaune",
      "bleu / rouge / noir / rose / orange",
    ],
    verifiedAnswer: "bleu / rouge / vert / rose / jaune",
  },
  q8: {
    question: "Que représente la mascotte de l’édition 2022 ?",
    id: "q8",
    answers: ["Monsieur Loyal", "Chef d’orchestre", "Clown"],
    verifiedAnswer: "Chef d’orchestre",
  },
  q9: {
    question: "Comment s’appellent nos deux maîtres de cérémonie ?",
    id: "q9",
    answers: ["Joyce & Alexandre", "Alexandre & Simon", "Emmanuel & Joyce"],
    verifiedAnswer: "Joyce & Alexandre",
  },
};
