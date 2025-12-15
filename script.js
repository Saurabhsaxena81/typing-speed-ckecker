const typingText = document.querySelector(".text-display p");
const textDisplayBox = document.querySelector(".text-display");
const inpField = document.querySelector(".input-field");
const timeTag = document.querySelector("#time");
const mistakeTag = document.querySelector("#mistakes");
const wpmTag = document.querySelector("#wpm");
const accuracyTag = document.querySelector("#accuracy");
const difficultySelect = document.getElementById("difficulty");
const timeButtons = document.querySelectorAll(".time-btn");
const resetBtn = document.getElementById("reset-btn");
const modalRetryBtn = document.getElementById("modal-retry-btn");
const resultModal = document.getElementById("result-modal");

let timer;
let maxTime = 60;
let timeLeft = maxTime;
let charIndex = (isTyping = 0);
let mistakes = 0;
let errorMap = {};

const dataBanks = {
  easy: [
    "the",
    "and",
    "you",
    "that",
    "was",
    "for",
    "are",
    "with",
    "his",
    "they",
    "this",
    "have",
    "from",
    "one",
    "had",
    "word",
    "but",
    "not",
    "what",
    "all",
    "were",
    "when",
    "your",
    "can",
    "said",
    "there",
    "use",
    "each",
    "which",
    "she",
    "how",
    "their",
    "if",
    "will",
    "up",
    "other",
    "about",
    "out",
    "many",
    "then",
    "them",
    "these",
    "so",
  ],
  medium: [
    "The sun dipped below the horizon painting the sky.",
    "Technology continues to evolve at a rapid pace.",
    "Walking through the forest the leaves crunched.",
    "Music has the ability to transport us to times.",
    "The quick brown fox jumps over the lazy dog.",
    "Coffee is the fuel that powers development.",
    "Logic is crucial for programming success.",
  ],
  hard: [
    "Quantum entanglement implies particles remain connected.",
    "The idiosyncratic nature resulted in latency.",
    "Photosynthesis transforms light into energy.",
    "Cryptocurrency relies on a decentralized ledger.",
    "Epistemological debates center on truth.",
    "The mitochondria is the powerhouse of the cell.",
    "Variable hoisting can lead to reference errors.",
  ],
};

// --- PERFORMANCE OPTIMIZATION: DocumentFragment ---
function generateText() {
  const level = difficultySelect.value;
  let fullText = "";

  // Generate a reasonable amount of text (not too much to lag, not too little to finish)
  const targetLength = 1500;

  while (fullText.length < targetLength) {
    if (level === "easy") {
      for (let i = 0; i < 10; i++) {
        fullText +=
          dataBanks.easy[Math.floor(Math.random() * dataBanks.easy.length)] +
          " ";
      }
    } else {
      const randSentence =
        dataBanks[level][Math.floor(Math.random() * dataBanks[level].length)];
      fullText += randSentence + " ";
    }
  }

  // Create DocumentFragment (Batch Insert)
  const fragment = document.createDocumentFragment();
  fullText.split("").forEach((char) => {
    let span = document.createElement("span");
    span.innerText = char;
    fragment.appendChild(span);
  });

  typingText.innerHTML = "";
  typingText.appendChild(fragment);

  typingText.querySelectorAll("span")[0].classList.add("active");

  // Reset Scroll
  textDisplayBox.scrollTop = 0;
}

// --- CORE GAME ENGINE ---

function initTyping() {
  let characters = typingText.querySelectorAll("span");
  let typedChar = inpField.value.split("")[charIndex];

  if (charIndex < characters.length && timeLeft > 0) {
    if (!isTyping) {
      timer = setInterval(initTimer, 1000);
      isTyping = true;
    }

    if (typedChar == null) {
      // Backspace
      if (charIndex > 0) {
        charIndex--;
        if (characters[charIndex].classList.contains("incorrect")) {
          mistakes--;
        }
        characters[charIndex].classList.remove("correct", "incorrect");
      }
    } else {
      let expectedChar = characters[charIndex].innerText;
      if (expectedChar === typedChar) {
        characters[charIndex].classList.add("correct");
      } else {
        mistakes++;
        characters[charIndex].classList.add("incorrect");
        if (expectedChar !== " ")
          errorMap[expectedChar] = (errorMap[expectedChar] || 0) + 1;
      }
      charIndex++;
    }

    // Active Class Handler
    characters.forEach((span) => span.classList.remove("active"));
    if (characters[charIndex]) {
      characters[charIndex].classList.add("active");

      // Optimized Scroll Logic (Only checks every 10 chars to save resources)
      if (charIndex % 10 === 0) {
        let charOffset = characters[charIndex].offsetTop;
        let containerScroll = textDisplayBox.scrollTop;
        if (charOffset > containerScroll + 120) {
          textDisplayBox.scrollTo({
            top: charOffset - 120,
            behavior: "smooth",
          });
        }
      }
    }

    // Live Stats
    let wpm = Math.round(
      (charIndex - mistakes) / 5 / ((maxTime - timeLeft) / 60)
    );
    wpm = wpm < 0 || !wpm || wpm === Infinity ? 0 : wpm;
    wpmTag.innerText = wpm;
    mistakeTag.innerText = mistakes;
    let acc = Math.round(((charIndex - mistakes) / charIndex) * 100);
    accuracyTag.innerText = (acc || 100) + "%";
  } else if (timeLeft === 0) {
    finishGame();
  }
}

function initTimer() {
  if (timeLeft > 0) {
    timeLeft--;
    timeTag.innerText = timeLeft + "s";
  } else {
    finishGame();
  }
}

// --- ANALYSIS & UX ---

function finishGame() {
  clearInterval(timer);
  inpField.value = "";

  document.getElementById("final-wpm").innerText = wpmTag.innerText;
  document.getElementById("final-acc").innerText = accuracyTag.innerText;

  // Top 5 Error Analysis
  const keysList = document.getElementById("keys-list");
  const analysisText = document.getElementById("analysis-text");
  keysList.innerHTML = "";

  let sortedErrors = Object.keys(errorMap).sort(
    (a, b) => errorMap[b] - errorMap[a]
  );
  let topErrors = sortedErrors.slice(0, 5); // Show Top 5

  if (topErrors.length > 0) {
    topErrors.forEach((key) => {
      // Check for spacebar to give it a proper label
      let displayKey = key === " " ? "␣" : key.toUpperCase();
      keysList.innerHTML += `<span>${displayKey}</span>`;
    });
    analysisText.innerHTML = `Mistakes were frequent on these keys.`;
  } else {
    // Added class "no-error" for blue styling
    keysList.innerHTML = "<span class='no-error'>Perfect</span>";
    analysisText.innerText = "Flawless typing! Keep it up.";
  }

  resultModal.classList.add("show");
  modalRetryBtn.focus(); // Focus the retry button so Enter works
}

function resetGame() {
  // Immediate Visual Reset
  resultModal.classList.remove("show");

  clearInterval(timer);
  timeLeft = maxTime;
  charIndex = mistakes = isTyping = 0;
  errorMap = {};
  inpField.value = "";
  timeTag.innerText = timeLeft + "s";
  wpmTag.innerText = 0;
  mistakeTag.innerText = 0;
  accuracyTag.innerText = "100%";

  generateText();

  // FORCE FOCUS back to input
  setTimeout(() => inpField.focus(), 100);
}

function closeResults() {
  resultModal.classList.remove("show");
}

// --- EVENT LISTENERS ---

// Retry Button (Modal)
modalRetryBtn.addEventListener("click", resetGame);

// Handle Enter key on Modal to Restart
window.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && resultModal.classList.contains("show")) {
    resetGame();
  }
});

// Time Selector
timeButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    timeButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    maxTime = parseInt(btn.getAttribute("data-time"));
    resetGame();
  });
});

difficultySelect.addEventListener("change", resetGame);
resetBtn.addEventListener("click", resetGame);
inpField.addEventListener("input", initTyping);
document.addEventListener("keydown", () => inpField.focus());
typingText.addEventListener("click", () => inpField.focus());

// Start
generateText();
