

// Отправка запросов
async function sendRequest(url, method, data) {
    url = `https://tg-api.tehnikum.school/tehnikum_course/minesweeper/${url}`;

    if (method === "POST") {
        let response = await fetch(url, {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        response = await response.json();
        return response;
    } else if (method === "GET") {
        url = url + "?" + new URLSearchParams(data);
        let response = await fetch(url, {
            method: "GET",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        response = await response.json();
        return response;
    }
}

let username;
let balance;
let points = 1000;
let game_id;

checkUser();

let autorizationForm = document.getElementById("autorization");
autorizationForm.addEventListener("submit", autorization);

async function autorization(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    username = formData.get('username');

    let response = await sendRequest("user", "GET", { username });
    if (response.error) {
        // Пользователь не найден, регистрируем
        let regResponse = await sendRequest("user", "POST", { username });
        if (regResponse.error) {
            alert(regResponse.message);
        } else {
            balance = regResponse.balance;
            showUser();
        }
    } else {
        // Пользователь найден
        balance = response.balance;
        showUser();
    }
}

function showUser() {
    let popUpSection = document.querySelector('section');
    popUpSection.style.display = "none";
    let userInfo = document.querySelector("header span");
    userInfo.innerHTML = `[${username}, ${balance}]`;

    localStorage.setItem("username", username);

    if (localStorage.getItem("game_id")) {
        gameButton.setAttribute("data-game", "stop");
    } else {
        gameButton.setAttribute("data-game", "start");
    }
}

document.querySelector(".exit").addEventListener("click", exit);

function exit() {
    let popUpSection = document.querySelector('section');
    popUpSection.style.display = "flex";
    let userInfo = document.querySelector("header span");
    userInfo.innerHTML = `[]`;

    localStorage.removeItem("username");
}

async function checkUser() {
    if (localStorage.getItem("username")) {
        username = localStorage.getItem("username");
        let response = await sendRequest("user", "GET", { username });
        if (response.error) {
            alert(response.message);
        } else {
            balance = response.balance;
            showUser();
        }
    } else {
        let popUpSection = document.querySelector('section');
        popUpSection.style.display = "flex";
    }
}

let pointBtns = document.getElementsByName("point");
pointBtns.forEach((elem) => {
    elem.addEventListener('input', setPoints);
});

function setPoints() {
    let checkedBtn = document.querySelector("input:checked");
    if (checkedBtn) {
        points = +checkedBtn.value;
        console.log(points);
    } else {
        console.log("No point button is checked");
    }
}

let gameButton = document.getElementById("gameButton");
gameButton.addEventListener("click", startOrStopGame);

function startOrStopGame() {
    let option = gameButton.getAttribute("data-game");
    if (option === "start") {
        if (points >= 0) {
            startGame();
        } else {
            alert("Points must be 0 or greater to start the game.");
        }
    } else if (option === "stop") {
        stopGame();
    }
}

function activateArea() {
    let cell = document.querySelectorAll(".cell");
    let columns = 10; 
    let rows = 8
    cell.forEach((cell, i) => {
        setTimeout(() => {
            let row = Math.floor(i / columns);
            let column = i - row*columns;

            cell.setAttribute('data-row', row);
            cell.setAttribute('data-column', column);
            cell.classList.add("active");
            cell.addEventListener("contextmenu", setFlag);
            cell.addEventListener("click", makeStep);
        }, 30 * i);
    });
}

function setFlag() {
    event.preventDefault();
    let cell = event.target;
    cell.classList.toggle("flag");
}

async function makeStep() {
    let cell = event.target
    let row = +cell.getAttribute("data-row");
    let column = +cell.getAttribute("data-column");

    let response = await sendRequest("game_step", "POST", { game_id, row, column });
    if (response.error) {
        alert(response.message);
    } else {
        if (response.status == "Won") {
            updateArea(response.table)

            balance = response.balance;
            showUser();
            clearArea();
            gameButton.setAttribute("data-game", "start");
            gameButton.innerHTML = "Играть";
            alert("Ты выиграл!")

        } else if (response.status == "Failed") {
            updateArea(response.table)

            balance = response.balance;
            showUser();
            clearArea();
            gameButton.setAttribute("data-game", "start");
            gameButton.innerHTML = "Играть";
            alert("Ты проиграл:(")
        } else if (response.status == "Ok") {
            updateArea(response.table);

        }
    }

    console.log(cell, row, column);
}

function updateArea(table) {
    let cells = document.querySelectorAll(".cell");
    let j = 0
    for(let row = 0; row < table.length; row++){
        for (let column = 0; column < table[row].length; column++){
            let value = table[row][column]
            if(value === 0) {
                cells[j].classList.remove("active")
                cells[j].classList.remove("flag")
            } else if (value >= 1) {
                cells[j].classList.remove("active")
                cells[j].classList.remove("flag")
                cells[j].innerHTML = value
            } else if (value == "BOMB") {
                cells[j].classList.remove("active")
                cells[j].classList.remove("flag")
                cells[j].classList.add("bomb")
            }
            j++
        }
    }
}

async function startGame() {
    let response = await sendRequest("new_game", "POST", { username, points });
    if (response.error) {
        alert(response.message);
    } else {
        game_id = response.game_id;
        gameButton.setAttribute("data-game", "stop");
        gameButton.innerHTML = "Завершить игру";
        clearArea();
        activateArea();
    }
}

async function stopGame() {
    let response = await sendRequest("stop_game", "POST", { username, game_id });
    if (response.error) {
        alert(response.message);
    } else {
        balance = response.balance;
        showUser();
        game_id = "";
        gameButton.setAttribute("data-game", "start");
        gameButton.innerHTML = "Играть";
        clearArea();
    }
}

function clearArea() {
    let area = document.querySelector(".area");
    area.innerHTML = "";
    for (let i = 0; i < 80; i++) {
        area.innerHTML += `<div class="cell"></div>`;
    }
}
