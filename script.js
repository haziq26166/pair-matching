(function () {
  "use strict";

  // Content from ICT654 Chapter 4: Service Validation and Testing.
  // kind "term" = a concept, "step" = a step in the testing process.

  // Used in both levels.
  var BASE_PAIRS = [
    { kind: "term", term: "Service validation and testing",
      meaning: "Makes sure new or changed services are fit for purpose and fit for use" },
    { kind: "term", term: "Service model",
      meaning: "Structure and dynamics of a service provided by service operation" },
    { kind: "term", term: "Test strategy",
      meaning: "The whole testing approach and the resources it needs" },
    { kind: "term", term: "Test model",
      meaning: "A test plan, the object to test, and the scripts that test it" },
    { kind: "term", term: "Test Manager",
      meaning: "Process owner who checks releases meet customer expectations" },
    { kind: "step", term: "Test management",
      meaning: "Coordinates and tracks the testing from start to finish" },
    { kind: "step", term: "Plan and design tests",
      meaning: "Decide what to test and write the test cases" },
    { kind: "step", term: "Verify test plan and test designs",
      meaning: "Double-check the test instructions for gaps" },
    { kind: "step", term: "Prepare test environment",
      meaning: "Set up a safe staging space away from the live system" },
    { kind: "step", term: "Perform tests",
      meaning: "Run the tests and record what happens" },
    { kind: "step", term: "Evaluate exit criteria and report",
      meaning: "Check results, decide if it is safe to release, write the summary" },
    { kind: "step", term: "Test clean up and closure",
      meaning: "Tidy the environment and keep the records for later" }
  ];

  // Extra pairs that only appear in Level 2.
  var EXTRA_PAIRS = [
    { kind: "term", term: "Authorized RFC",
      meaning: "An official, approved request to add or change a service" },
    { kind: "term", term: "Evaluated design",
      meaning: "The plans and specs for how the change is supposed to work" },
    { kind: "term", term: "Service evaluation",
      meaning: "The final judgment on whether the change works and is good enough to launch" },
    { kind: "term", term: "Inputs to testing",
      meaning: "Service Design Package, release and deployment plans, acceptance criteria and RFCs" },
    { kind: "term", term: "Outputs of testing",
      meaning: "Test report, test incidents, test problems, test errors, improvements and updated data" },
    { kind: "step", term: "Revise tests to deliver required results",
      meaning: "Feedback loop: when a bug is found, go back, adjust the tests and try again" }
  ];

  // pairs = how many pairs in the level, extra = how many come from EXTRA_PAIRS.
  var LEVELS = [
    { pairs: 6, extra: 0 },
    { pairs: 8, extra: 4 }
  ];

  var PAIR_COLORS = ["#7be0c3", "#b5ec7a", "#8fd3ff", "#c4a7ff", "#ffe27a", "#9fb4ff", "#6fe0e0", "#d6e86a"];

  var leftList = document.getElementById("left");
  var rightList = document.getElementById("right");
  var levelEl = document.getElementById("level");
  var levelTotalEl = document.getElementById("level-total");
  var movesEl = document.getElementById("moves");
  var foundEl = document.getElementById("found");
  var totalEl = document.getElementById("total");
  var statusEl = document.getElementById("status");
  var restartBtn = document.getElementById("restart");
  var againBtn = document.getElementById("again");
  var winDialog = document.getElementById("win");
  var winTitle = document.getElementById("win-title");
  var winText = document.getElementById("win-text");

  var level = 0;
  var pairsInLevel = 0;
  var selected = null;
  var locked = false;
  var moves = 0;
  var found = 0;
  var colorCount = 0;
  var timers = [];

  function shuffle(list) {
    var a = list.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function later(fn, ms) {
    timers.push(setTimeout(fn, ms));
  }

  function clearTimers() {
    timers.forEach(clearTimeout);
    timers = [];
  }

  function announce(msg) {
    statusEl.textContent = msg;
  }

  function buildTitle() {
    var title = document.getElementById("title");
    var text = title.textContent;
    var colors = ["#ffd23f", "#ff7eb6", "#7be0c3", "#8fd3ff", "#ffa45c", "#c4a7ff"];
    var tilt = [-4, 3, -2, 4, -3, 2];
    title.setAttribute("aria-label", text);
    title.textContent = "";
    for (var i = 0; i < text.length; i++) {
      var s = document.createElement("span");
      s.setAttribute("aria-hidden", "true");
      if (text[i] === " ") {
        s.className = "letter space";
        s.textContent = "\u00a0";
      } else {
        s.className = "letter";
        s.textContent = text[i];
        s.style.setProperty("--c", colors[i % colors.length]);
        s.style.setProperty("--r", tilt[i % tilt.length] + "deg");
      }
      title.appendChild(s);
    }
  }

  function createItem(data) {
    var li = document.createElement("li");
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "item item-" + data.side;
    btn.dataset.pair = data.pairIndex;
    btn.dataset.side = data.side;
    btn.dataset.text = data.text;

    if (data.side === "term") {
      var pill = document.createElement("span");
      pill.className = "kind kind-" + data.kind;
      pill.textContent = data.kind === "step" ? "Process step" : "Term";
      btn.appendChild(pill);
      btn.dataset.kindLabel = pill.textContent;
    } else {
      btn.dataset.kindLabel = "Meaning";
    }

    var label = document.createElement("span");
    label.className = "label";
    label.textContent = data.text;
    btn.appendChild(label);

    li.appendChild(btn);
    return li;
  }

  function pickPairs(cfg) {
    var fromExtra = shuffle(EXTRA_PAIRS).slice(0, cfg.extra);
    var fromBase = shuffle(BASE_PAIRS).slice(0, cfg.pairs - fromExtra.length);
    return fromExtra.concat(fromBase);
  }

  function startLevel(index) {
    clearTimers();
    if (winDialog.open) winDialog.close();

    level = index;
    var cfg = LEVELS[level];
    pairsInLevel = cfg.pairs;

    selected = null;
    locked = false;
    moves = 0;
    found = 0;
    colorCount = 0;
    levelEl.textContent = String(level + 1);
    levelTotalEl.textContent = String(LEVELS.length);
    movesEl.textContent = "0";
    foundEl.textContent = "0";
    totalEl.textContent = String(pairsInLevel);

    var lefts = [];
    var rights = [];
    pickPairs(cfg).forEach(function (p, i) {
      lefts.push({ pairIndex: i, side: "term", kind: p.kind, text: p.term });
      rights.push({ pairIndex: i, side: "meaning", kind: p.kind, text: p.meaning });
    });

    leftList.innerHTML = "";
    rightList.innerHTML = "";
    shuffle(lefts).forEach(function (d) { leftList.appendChild(createItem(d)); });
    shuffle(rights).forEach(function (d) { rightList.appendChild(createItem(d)); });

    announce("Level " + (level + 1) + " started. Match " + pairsInLevel + " pairs.");
  }

  function select(btn) {
    btn.classList.add("selected");
    btn.setAttribute("aria-pressed", "true");
  }

  function deselect(btn) {
    btn.classList.remove("selected", "wrong");
    btn.setAttribute("aria-pressed", "false");
  }

  function finish() {
    var isLast = level === LEVELS.length - 1;
    if (isLast) {
      winTitle.textContent = "All levels complete!";
      winText.textContent = "You matched all " + pairsInLevel + " pairs of Level " +
        (level + 1) + " in " + moves + " moves.";
      againBtn.textContent = "Play again from Level 1";
    } else {
      winTitle.textContent = "Level " + (level + 1) + " complete!";
      winText.textContent = "You matched all " + pairsInLevel + " pairs in " + moves +
        " moves. Level " + (level + 2) + " has " + LEVELS[level + 1].pairs + " pairs.";
      againBtn.textContent = "Start Level " + (level + 2);
    }
    announce(winTitle.textContent + " " + winText.textContent);
    if (typeof winDialog.showModal === "function") {
      winDialog.showModal();
      againBtn.focus();
    }
  }

  function onDialogButton() {
    var next = level < LEVELS.length - 1 ? level + 1 : 0;
    startLevel(next);
  }

  function onClick(e) {
    var btn = e.target.closest(".item");
    if (!btn || locked || btn.classList.contains("matched")) return;

    // Nothing chosen yet: select this one.
    if (!selected) {
      selected = btn;
      select(btn);
      return;
    }

    // Clicked the selected item again: unselect it.
    if (selected === btn) {
      deselect(btn);
      selected = null;
      return;
    }

    // Same column: switch the selection.
    if (selected.dataset.side === btn.dataset.side) {
      deselect(selected);
      selected = btn;
      select(btn);
      return;
    }

    // One from each column: check the pair.
    var other = selected;
    selected = null;
    moves++;
    movesEl.textContent = String(moves);
    select(btn);
    locked = true;

    if (other.dataset.pair === btn.dataset.pair) {
      var color = PAIR_COLORS[colorCount % PAIR_COLORS.length];
      colorCount++;
      later(function () {
        [other, btn].forEach(function (el) {
          el.classList.remove("selected");
          el.classList.add("matched");
          el.style.setProperty("--pair", color);
          el.disabled = true;
          el.setAttribute("aria-pressed", "false");
          el.setAttribute("aria-label", "Matched. " + el.dataset.kindLabel + ": " + el.dataset.text);
        });
        found++;
        foundEl.textContent = String(found);
        announce("Match! " + found + " of " + pairsInLevel + " pairs found.");
        locked = false;
        if (found === pairsInLevel) later(finish, 700);
      }, 250);
    } else {
      later(function () {
        other.classList.remove("selected");
        btn.classList.remove("selected");
        other.classList.add("wrong");
        btn.classList.add("wrong");
        announce("Not a match. Try again.");
      }, 200);
      later(function () {
        deselect(other);
        deselect(btn);
        locked = false;
      }, 900);
    }
  }

  leftList.addEventListener("click", onClick);
  rightList.addEventListener("click", onClick);
  restartBtn.addEventListener("click", function () { startLevel(level); });
  againBtn.addEventListener("click", onDialogButton);
  // If the pop-up is dismissed (for example with Esc) after finishing a level, carry on anyway.
  winDialog.addEventListener("close", function () {
    if (pairsInLevel > 0 && found === pairsInLevel) onDialogButton();
  });

  buildTitle();
  startLevel(0);
})();
