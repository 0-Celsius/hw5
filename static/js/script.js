/*
    Filename: script.js
    Desc:
    - generates a board and a rack
    - board is 1 x 14 
      - allows for tiles to be drag on
        - error handles spacing ; prevents it and error msg
        - prevent submitting empty board; error msg
        - prevents overlapping tiles on top of each other; no error msg
    - rack generates 7 tiles
      - based off the distruibuation given 
    - has a score updater
      - for both current and total games score
    - working reset button to reset rack, board, and score
*/

let tileData = {};
let rack = [];
let placedTiles = [];
let totalScore = 0;

// init everything 
$(document).ready(function () {
  $.getJSON("./static/graphics_data/pieces.json", function (data) {
    tileData = generateTileBag(data.pieces);
    generateBoard();
    refillRack();
  });


  // buttton functions to update based off what they say
  $("#submit").click(submitWord);
  $("#restart").click(() => location.reload());
});

// generate bag, basically struct to hold our proper distributions of letters
function generateTileBag(pieces) {
  let bag = [];
  pieces.forEach(p => {
    for (let i = 0; i < p.amount; i++) {
      bag.push({ letter: p.letter, value: p.value });
    }
  });
  return bag;
}

function getRandomTile() {
  const index = Math.floor(Math.random() * tileData.length);
  return tileData.splice(index, 1)[0];
}

function refillRack() {
  const $rack = $("#rack").empty();
  rack = [];

  while (rack.length < 7 && tileData.length > 0) {
    const tile = getRandomTile();
    rack.push(tile);
    const $tile = $("<div>")
      .addClass("tile")
      .css("background-image", `url('./static/css/images/Scrabble_Tiles/Scrabble_Tile_${tile.letter}.jpg')`)
      .attr("data-letter", tile.letter)
      .attr("data-value", tile.value);
    $tile.draggable({
      revert: "invalid",
      helper: "clone"
    });
    $rack.append($tile);
  }
}

function causesGap(newIndex) {
  const allIndices = placedTiles.map(t => t.index).concat(newIndex).sort((a, b) => a - b);

  for (let i = 1; i < allIndices.length; i++) {
    if (allIndices[i] !== allIndices[i - 1] + 1) {
      return true; // Found a gap
    }
  }
  return false;
}


function generateBoard() {
  const $board = $("#board");
  $board.empty();

  for (let i = 0; i < 15; i++) {
    // basically in generated all the tiles as a div, and added a texture/image overlay to it
    const $slot = $("<div>")
      .addClass("tile-slot")
      .attr("data-index", i);

    let label = "";

    // board with the special cases; bg is set in css
    if (i === 2 || i === 12) {
      $slot.addClass("double-word");
      label = "Double Word";
    } else if (i === 6 || i === 8) {
      $slot.addClass("double-letter");
      label = "Double Letter";
    } else {
      $slot.css("background-image", "url('./static/css/images/Scrabble_Tiles/Scrabble_Tile_Blank.jpg')");
      $slot.css("background-size", "cover");
    }

    // labels
    if (label !== "") {
      const $text = $("<div>").addClass("bonus-label").text(label);
      $slot.append($text);
    }

    // allows the dragablity
    $slot.droppable({
      accept: ".tile",
      drop: function (event, ui) {
        const letter = ui.helper.attr("data-letter");
        const value = parseInt(ui.helper.attr("data-value"));
        const index = $(this).data("index");

        if ($(this).children(".tile").length > 0) return;

        if (causesGap(index)) {
          // Show error and return tile to rack
          $("#error-msg").text("No spacing allowed please!");

          // Append it back to the rack
          const $tile = ui.draggable.clone();
          $tile.draggable({
            revert: "invalid",
            helper: "clone"
          });
          $("#rack").append($tile);
          ui.draggable.remove(); // remove dropped tile
          return;
        }

        // Valid drop
        $("#error-msg").text(""); // clear any previous error
        const $placed = ui.helper.clone().css({
          top: 0,
          left: 0,
          position: "absolute"
        });

        $(this).append($placed);
        placedTiles.push({
          index,
          letter,
          value,
          bonus: $(this).attr("class")
        });

        // Remove from rack data and DOM
        rack = rack.filter(t => !(t.letter === letter && t.value === value));
        ui.draggable.remove();

        updateScore();
      }
    });

  $board.append($slot);
}

}

// math handler for updating the score based off the characters
function updateScore() {
  let wordScore = 0;
  let wordMultiplier = 1;

  placedTiles.forEach(tile => {
    let letterScore = tile.value;
    if (tile.bonus.includes("double-letter")) letterScore *= 2;
    if (tile.bonus.includes("triple-letter")) letterScore *= 3;
    wordScore += letterScore;

    if (tile.bonus.includes("double-word")) wordMultiplier *= 2;
    if (tile.bonus.includes("triple-word")) wordMultiplier *= 3;
  });

  $("#score-display").text(`Score: ${wordScore * wordMultiplier}`);
}

// sub updates the values of the score
function submitWord() {
  // credit: https://stackoverflow.com/questions/14439700/convert-complicates-string-into-integer
  // string to int functions
  const currentScore = parseInt($("#score-display").text().replace(/\D/g, '')) || 0;
  totalScore += currentScore;

  if (placedTiles.length === 0) {
    $("#error-msg").text("At least one tile on board please!");
    return;
  }

  $("#error-msg").text(""); // Clear error message
  $("#score-total").text(`Total Score: ${totalScore}`); // updates total score
  $("#score-display").text("Score: 0"); // updates current score == 0 

  // Remove only the placed tiles (keep bonus pts text)
  $(".tile-slot .tile").remove();

  placedTiles = [];
  refillRack();
}
