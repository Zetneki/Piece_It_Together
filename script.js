let start_time;
let timer_interval;

let elapsed_seconds = 0;

let timer;

let menu_area;

let start_button;
let continue_button;
let difficulty_select;
let help_button;

let game_area;
let area_width, area_height;

let pieces_area;

let number_of_pieces;
let piece_size;
let pieces = [];
let solution = [];

let chosen_image_data;
let chosen_image;

let sound_effect;

let empty_spot;

$(function () {
  menu_area = $("#menu");
  game_area = $("#gamearea");

  game_area.hide();

  menu();
});

function menu() {
  start_button = $("#start-button");
  continue_button = $("#continue-button");
  difficulty_select = $("#difficulty-select");
  help_button = $("#help");

  choose_image_button = $("#choose-image-button");
  image_input = $("#image-input");
  image_preview = $("#image-preview");

  choose_image(choose_image_button, image_input, image_preview);

  number_of_pieces = parseInt(difficulty_select.val());
  empty_spot = { row: number_of_pieces - 1, col: number_of_pieces - 1 };

  difficulty_select.on("change", function () {
    number_of_pieces = parseInt(difficulty_select.val());
    empty_spot = { row: number_of_pieces - 1, col: number_of_pieces - 1 };
  });

  continue_button.on("click", function () {
    let saved_game_state = localStorage.getItem("game_state");

    if (saved_game_state) {
      let state = JSON.parse(saved_game_state);
      pieces = state.pieces;
      solution = state.solution;
      empty_spot = state.empty_spot;
      number_of_pieces = state.number_of_pieces;
      chosen_image_data = state.chosen_image_data;
      elapsed_seconds = state.elapsed_seconds;

      start_time = Date.now();

      let minutes = Math.floor(elapsed_seconds / 60);
      let seconds = elapsed_seconds % 60;

      timer = $(
        `<div id='timer'>Time: ${minutes}:${
          seconds < 10 ? "0" + seconds : seconds
        }</div>`
      );

      $("#menu").hide();
      $("#gamearea").show();
      game(true);
      return;
    }
  });

  start_button.on("click", function () {
    if ($("#image-preview").attr("src") !== "") {
      $("#menu").hide();
      $("#gamearea").show();
      game();
      return;
    }
  });

  help_button.on("click", function () {
    alert(
      "Welcome to 'Piece It Together'!\n\n" +
        "Choose an image you like and a difficulty level (3x3, 4x4, or 5x5), then click Start to begin.\n" +
        "Your goal is to arrange the shuffled pieces back into the original image.\n" +
        "Click on a tile next to the empty space to move it.\n\n" +
        "Good luck!"
    );
  });
}

function choose_image(choose_image_button, image_input, image_preview) {
  choose_image_button.on("click", function () {
    image_input.click();
  });

  image_input.on("change", function () {
    let file = image_input[0].files[0];
    if (file) {
      let reader = new FileReader();
      reader.onload = function (e) {
        chosen_image_data = e.target.result;
        image_preview.attr("src", chosen_image_data);
        image_preview.addClass("show");
      };
      reader.readAsDataURL(file);
    }
  });
}

function game(restore = false) {
  game_area.css({
    width: 600 + number_of_pieces,
    height: 640 + number_of_pieces,
    backgroundColor: "rgb(0, 0, 0)",
  });

  pieces_area = $("<div id='pieces_area'></div>");
  pieces_area.css({
    position: "absolute",
    top: 0,
    left: 0,
    width: 600,
    height: 600,
  });
  game_area.append(pieces_area);

  area_width = parseInt(game_area.css("width"));
  area_height = parseInt(game_area.css("height"));

  piece_size = Math.floor(area_width / number_of_pieces);

  chosen_image = new Image();
  chosen_image.onload = function () {
    if (!restore) {
      start_time = Date.now();

      let canvas = document.createElement("canvas");
      let ctx = canvas.getContext("2d");

      let ratio = Math.min(
        area_width / chosen_image.width,
        area_height / chosen_image.height
      );
      let newWidth = chosen_image.width * ratio;
      let newHeight = chosen_image.height * ratio;

      let offsetX = (area_width - newWidth) / 2;
      let offsetY = (area_height - newHeight) / 2;

      canvas.width = area_width;
      canvas.height = area_height;
      ctx.drawImage(chosen_image, offsetX, offsetY, newWidth, newHeight);

      slice_image(canvas);
      solution = [...pieces];
      shuffle_pieces();
      timer = $("<div id='timer'>Time: 0:00</div>");
    }
    timer_interval = setInterval(update_timer, 1000);
    draw_pieces();
    console.log(JSON.stringify(pieces));
    game_area.append(pieces_area);
    ui_elements();
  };
  chosen_image.src = chosen_image_data;
}

function slice_image(image) {
  let canvas = document.createElement("canvas");
  let ctx = canvas.getContext("2d");

  for (let i = 0; i < number_of_pieces; i++) {
    for (let j = 0; j < number_of_pieces; j++) {
      canvas.width = piece_size;
      canvas.height = piece_size;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(
        image,
        j * piece_size,
        i * piece_size,
        piece_size,
        piece_size,
        0,
        0,
        piece_size,
        piece_size
      );

      let pieceData = canvas.toDataURL();
      pieces.push(pieceData);
    }
  }
}

function shuffle_pieces() {
  let directions = [
    { row: -1, col: 0 },
    { row: 1, col: 0 },
    { row: 0, col: -1 },
    { row: 0, col: 1 },
  ];

  let moves = 1000;

  for (let m = 0; m < moves; m++) {
    let valid_moves = [];

    for (let dir of directions) {
      let newRow = empty_spot.row + dir.row;
      let newCol = empty_spot.col + dir.col;

      if (
        newRow >= 0 &&
        newRow < number_of_pieces &&
        newCol >= 0 &&
        newCol < number_of_pieces
      ) {
        valid_moves.push({ row: newRow, col: newCol });
      }
    }

    if (valid_moves.length > 0) {
      let move = valid_moves[Math.floor(Math.random() * valid_moves.length)];

      let emptyIndex = empty_spot.row * number_of_pieces + empty_spot.col;
      let moveIndex = move.row * number_of_pieces + move.col;

      let temp = pieces[emptyIndex];
      pieces[emptyIndex] = pieces[moveIndex];
      pieces[moveIndex] = temp;

      empty_spot = { row: move.row, col: move.col };
    }
  }
}

function draw_pieces() {
  pieces_area.empty();
  for (let i = 0; i < pieces.length; i++) {
    if (i !== empty_spot.row * number_of_pieces + empty_spot.col) {
      let img = $("<img class='piece'></img>");
      img.attr("src", pieces[i]);
      img.css({
        position: "absolute",
        width: piece_size,
        height: piece_size,
        left: (i % number_of_pieces) * piece_size,
        top: Math.floor(i / number_of_pieces) * piece_size,
        border: "1px solid rgb(0, 0, 0)",
      });

      img.on("click", function () {
        handle_piece_click(i);
      });

      pieces_area.append(img);
    }
  }
}

function ui_elements() {
  timer.css({
    position: "absolute",
    top: game_area.height() - 20,
    left: 1,
    color: "white",
    fontSize: "18px",
    fontWeight: "bold",
  });
  game_area.append(timer);

  let back_to_menu = $("<button>Back to menu</button>");
  back_to_menu.css({
    position: "absolute",
    top: game_area.height() - 20,
    left: game_area.width() - 100,
    backgroundColor: "rgb(0, 0, 0)",
    color: "rgb(255, 255, 255)",
    border: "1px solid rgb(255, 255, 255)",
  });
  game_area.append(back_to_menu);

  back_to_menu.on("click", function () {
    if (timer_interval) {
      clearInterval(timer_interval);
      timer_interval = null;
    }
    location.reload();
  });
}

function handle_piece_click(i) {
  let clicked_row = Math.floor(i / number_of_pieces);
  let clicked_col = i % number_of_pieces;

  if (is_adjacent(clicked_row, clicked_col)) {
    swap_pieces(clicked_row, clicked_col);
  }
}

function is_adjacent(row, col) {
  return (
    (row === empty_spot.row && col === empty_spot.col - 1) ||
    (row === empty_spot.row && col === empty_spot.col + 1) ||
    (row === empty_spot.row - 1 && col === empty_spot.col) ||
    (row === empty_spot.row + 1 && col === empty_spot.col)
  );
}

function swap_pieces(row, col) {
  let move_piece = $(".piece")
    .toArray()
    .find((img) => {
      let top = parseInt($(img).css("top"));
      let left = parseInt($(img).css("left"));
      return top === row * piece_size && left === col * piece_size;
    });

  let sound = $(
    "<audio id='sound_effect' src='sound_effects/slide_sound_effect.mp3' preload='auto'></audio>"
  );
  game_area.append(sound);

  sound_effect = sound.get(0);

  sound_effect.currentTime = 0;
  sound_effect.play();

  $(move_piece).animate(
    {
      top: empty_spot.row * piece_size,
      left: empty_spot.col * piece_size,
    },
    200,
    function () {
      let temp = pieces[row * number_of_pieces + col];
      pieces[row * number_of_pieces + col] =
        pieces[empty_spot.row * number_of_pieces + empty_spot.col];
      pieces[empty_spot.row * number_of_pieces + empty_spot.col] = temp;

      empty_spot.row = row;
      empty_spot.col = col;

      save_game_state();
      draw_pieces();

      check_win();
    }
  );
}

function update_timer() {
  let current_time = Math.floor((Date.now() - start_time) / 1000);
  let time = elapsed_seconds + current_time;
  let minutes = Math.floor(time / 60);
  let seconds = time % 60;
  $("#timer").text(
    `Time: ${minutes}:${seconds < 10 ? "0" + seconds : seconds}`
  );

  save_game_state();
}

function save_game_state() {
  let current_elapsed =
    Math.floor((Date.now() - start_time) / 1000) + elapsed_seconds;

  let game_state = {
    pieces: pieces,
    solution: solution,
    empty_spot: empty_spot,
    number_of_pieces: number_of_pieces,
    chosen_image_data: chosen_image_data,
    elapsed_seconds: current_elapsed,
  };

  try {
    localStorage.setItem("game_state", JSON.stringify(game_state));
  } catch (e) {
    alert(
      "Saving game state failed. The image was too large. Please try a smaller image."
    );
    localStorage.removeItem("game_state");
    location.reload();
  }
}

function check_win() {
  let won = true;

  for (let i = 0; i < pieces.length; i++) {
    if (pieces[i] !== solution[i]) {
      won = false;
      break;
    }
  }

  let time = Math.floor((Date.now() - start_time) / 1000);
  let minutes = Math.floor(time / 60);
  let seconds = time % 60;

  if (won) {
    alert(
      "You won! Time: " +
        minutes +
        ":" +
        (seconds < 10 ? "0" + seconds : seconds)
    );
    if (timer_interval) {
      clearInterval(timer_interval);
      timer_interval = null;
    }
    localStorage.removeItem("game_state");
    setTimeout(function () {
      location.reload();
    }, 3000);
  }
}
