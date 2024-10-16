const rotorOptions = document.getElementsByClassName('rotor-option');
const installedRotors = document.getElementsByClassName('r-installed');
const plugs = document.getElementsByClassName('plugs');
const initialSet = document.getElementsByClassName('initial-set');
const debug = document.getElementById('debug');
const machineSection = document.getElementById('machine');
const defaultDisplay = machineSection.cloneNode();

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
let unselectedRotors = Array.from(rotorOptions)

let cfg = {
    "rotors": [],
    "initial": [1, 1, 1],
    "pairs": [Array(10), Array(10)]
}
let isPlugboardSet = false;
let isRotorInstalled = false;
let isReconfigured = true;

// Rotors selection
for (let rotor of rotorOptions) {
    rotor.addEventListener('click', () => {
        let value = rotor.value;
        rotor.classList.toggle('selected');
        if (rotor.classList.contains('selected')) {
            // update cfg
            cfg.rotors.push(value);
            // label installed rotor
            unselectedRotors.splice(unselectedRotors.indexOf(rotor), 1);
            updaterotorLabels();
        } else if (cfg.rotors.includes(value)) {
            // update cfg
            cfg.rotors.splice(cfg.rotors.indexOf(value), 1);
            // label installed rotor
            unselectedRotors.push(rotor);
            updaterotorLabels();

            // reactivate disabled rotor option
            for (let option of unselectedRotors) {
                option.removeAttribute('disabled');
            }

            // reset state
            isRotorInstalled = false
        }

        if (cfg.rotors.length >= 3) {
            // rotors set properly
            isRotorInstalled = true
            // disable another rotor options when selected = 3
            for (let option of unselectedRotors) {
                option.setAttribute('disabled', true);
            }
        }

        // update machine
        reconfigure()
    })
}

function updaterotorLabels() {
    for (let i = 0; i < installedRotors.length; i++) {
        if (i < cfg.rotors.length) {
            // update installed rotors labels with selected rotors
            installedRotors[i].innerHTML = cfg.rotors[i]
        } else {
            installedRotors[i].innerHTML = "#"
        }
    }
}

//  Window initial index configuration 
Array.from(initialSet).forEach((select, index) => {
    // set option for window 01-26 (A-Z)
    for (let i = 1; i <= 26; i++) {
        label = i > 9 ? "" + i : "0" + i;
        const option = document.createElement("option");
        option.value = label;
        option.textContent = label;
        select.appendChild(option);
    }

    // window update event listener
    select.addEventListener("change", () => {
        cfg.initial[index] = Number.parseInt(select.value);
        reconfigure();
    })
})


// Plugboard 
Array.from(plugs).forEach((select, index) => {
    // set option for plugs select (A-Z)
    alphabet.forEach((letter, index) => {
        const option = document.createElement("option");
        option.value = index;
        option.textContent = letter;
        select.appendChild(option);
    });


    let i = index == 0 ? index : Math.floor(index / 2);  // index of plugs pairs
    // add event listener 
    select.addEventListener("change", () => {
        debug.innerHTML = ""
        if (select.value != "-" && select.classList.contains("plug-A")) {
            cfg.pairs[0][i] = Number.parseInt(select.value); // plug source
        } else if (select.value != "-" && select.classList.contains("plug-B")) {
            cfg.pairs[1][i] = Number.parseInt(select.value); // plug destination
        }

        // check if plugboard is set correctly  (no undefined or empty values)
        cfg.pairs.map(x => x.includes(undefined) || x.includes("")).includes(true) ? isPlugboardSet = false : isPlugboardSet = true

        updateOptions()
        reconfigure();
    });
});

function updateOptions() {
    const selectedValues = Array.from(plugs).map(select => select.value);

    Array.from(plugs).forEach(select => {
        const options = select.querySelectorAll("option");
        options.forEach(option => {
            if (option.value && selectedValues.includes(option.value) && option.value !== select.value) {
                option.disabled = true;
            } else {
                option.disabled = false;
            }
        });
    });
}


function reconfigure() {
    isReconfigured = true;
    debug.innerHTML = ""
    plainteks.innerHTML = ""
}