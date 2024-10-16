const input = document.getElementById('input');
const output = document.getElementById('output');
const plugDisplay = document.getElementById('plug-display');
const etwDisplay = document.getElementById('etw-display');
const r1Display = document.getElementById('r1-display');
const r2Display = document.getElementById('r2-display');
const r3Display = document.getElementById('r3-display');
const ukwDisplay = document.getElementById('ukw-display');
const nodes = document.getElementsByClassName("node")
const plainteks = document.getElementById('plainteks');
const debugPanel = document.getElementsByClassName('debug-panel')[0];

const plugCanvas = document.createElement("canvas")
const etwCanvas = document.createElement("canvas")
const r1Canvas = document.createElement("canvas")
const r2Canvas = document.createElement("canvas")
const r3Canvas = document.createElement("canvas")
const ukwCanvas = document.createElement("canvas")

let machine;

const mod = (n, m) => (n % m + m) % m;

class Display {

    fontSize = 10;
    yGap = 20;
    xOutput = this.fontSize / 1;
    xInput = 140;

    constructor(canvas) {
        this.canvas = canvas
    }

    displayInit(displayType = "default") {
        this.displayType = displayType;
        const ctx = this.canvas.getContext("2d");

        this.canvas.height = this.alphabet.length * this.yGap + this.fontSize;
        this.canvas.width = this.xInput + this.fontSize;

        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.alphabet.forEach((letter, index) => {
            this.drawConnection(index)
        });
    }

    drawText(alphabetIndex, x, isActive = false) {
        const ctx = this.canvas.getContext("2d")
        const y = this.yGap * (alphabetIndex + 1);
        const text = this.alphabet[alphabetIndex];

        // rect 
        ctx.strokeStyle = "black"; // Warna outline
        ctx.lineWidth = 2; // Ketebalan outline
        ctx.strokeRect(x - this.fontSize / 2, y - this.yGap / 2, this.fontSize, this.yGap);

        // fill
        ctx.fillStyle = isActive? "yellow": "lightgray";
        ctx.fillRect(x - this.fontSize / 2, y - this.yGap / 2, this.fontSize, this.yGap);

        // text
        ctx.fillStyle = "black";
        ctx.font = this.fontSize + 'px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = "middle"
        ctx.fillText(text, x, y);
    }


    drawConnectionLine(inputIndex, activeLine=false) {
        const yInput = (inputIndex + 1) * this.yGap
        const yOutput = (this.load(inputIndex) + 1) * this.yGap

        const ctx = this.canvas.getContext("2d")
        ctx.beginPath();
        if (this.displayType == "default") {
            ctx.moveTo(this.xInput - this.fontSize / 2, yInput);
            ctx.lineTo(this.xOutput + this.fontSize / 2, yOutput);
        } else if (this.displayType == "single column") {
            const top = yInput < yOutput ? yInput : yOutput
            const bottom = yInput > yOutput ? yInput : yOutput
            const distance = bottom - top
            const maxDistance = this.alphabet.length * this.yGap
            const cpx = this.xInput - this.xInput * distance / maxDistance

            ctx.moveTo(this.xInput - this.fontSize / 2, yInput);
            ctx.quadraticCurveTo(cpx - this.fontSize / 2, top + distance / 2, this.xInput - this.fontSize / 2, yOutput);
        } else {
            console.error("Invalid drawing type : " + this.displayType)
            return
        }
        ctx.strokeStyle = activeLine? "yellow" : "gray";
        ctx.lineWidth = activeLine? 3 :1;
        ctx.stroke();
    }

    drawConnection(inputIndex, isActive=false) {
        const outputIndex = this.load(inputIndex)

        this.drawText(inputIndex, this.xInput, isActive)

        if (this.displayType == "default") {
            this.drawText(outputIndex, this.xOutput, isActive)
        } else if (this.displayType == "single column") {
            this.drawText(outputIndex, this.xInput, isActive)
        }

        this.drawConnectionLine(inputIndex, isActive)
    }

}

class CipherComponent extends Display {
    constructor(canvas){
        super(canvas)
    }
    load(inputIndex, drawConnection=false) {
        const out = this.wiring[inputIndex]
        const outputIndex = this.alphabet.indexOf(out);
        if (drawConnection) {
            this.drawConnection(inputIndex, true)
        }
        return outputIndex;
    }

    loadBackward(outputIndex, drawConnection=false) {
        // const i = this.wiring.indexOf(letter); // index of letter in gear wiring
        const out = this.alphabet[outputIndex]
        const inputIndex = this.wiring.indexOf(out)

        if(drawConnection){
            this.drawConnection(inputIndex, true)
        }
        return inputIndex;
    }

}

class Plugboard extends CipherComponent {
    constructor(pairs, canvas) {
        super(canvas)
        this.alphabet = alphabet.slice();
        
        this.wiring = alphabet.slice(); // initial value
        pairs[0].forEach( (letterIndexA, index) => {
            const letterIndexB = pairs[1][index]
            this.wiring[letterIndexA] = alphabet[letterIndexB]
            this.wiring[letterIndexB] = alphabet[letterIndexA]
        })
    } 
}

class Rotor extends CipherComponent{
    rotors_cfg = {
        "ETW": {
            "wiring": "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
            "notch": "",
            "turnover": ""
        },
        "I": {
            "wiring": "EKMFLGDQVZNTOWYHXUSPAIBRCJ",
            "notch": "Y",
            "turnover": "Q"
        },
        "II": {
            "wiring": "AJDKSIRUXBLHWTMCQGZNPYFVOE",
            "notch": "M",
            "turnover": "E"
        },
        "III": {
            "wiring": "BDFHJLCPRTXVZNYEIWGAKMUSQO",
            "notch": "D",
            "turnover": "V"
        },
        "IV": {
            "wiring": "ESOVPZJAYQUIRHXLNFTGKDCMWB",
            "notch": "R",
            "turnover": "J"
        },
        "V": {
            "wiring": "VZBRGITYUPSDNHLXAWMJQOFECK",
            "notch": "H",
            "turnover": "Z"
        },
        "UKW": {
            "wiring": "YRUHQSLDPXNGOKMIEBFZCWVJAT",
            "notch": "",
            "turnover": ""
        } // UKW-B
    }

    constructor(rotor_id, initial_pos = 1, position = 0, canvas = null) {
        super(canvas)
        const wiringStr = (this.rotors_cfg[rotor_id].wiring);
        this.wiring = wiringStr.split("");
        this.turnover = this.rotors_cfg[rotor_id].turnover;
        this.ofset = initial_pos - 1;
        this.position = position
        this.alphabet = alphabet
    }

    spin() {
        this.ofset = this.ofset < 26 ? this.ofset + 1 : 1;
        // update index window element
        initialSet[this.position - 1].value = this.ofset > 9 ? "" + this.ofset : "0" + this.ofset;
        // shift alphabet and wiring to match rotor's movement 
        this.alphabet = this.alphabet.slice(1, this.alphabet.length).concat(this.alphabet.slice(0, 1));
        this.wiring = this.wiring.slice(1, this.wiring.length).concat(this.wiring.slice(0, 1));
        this.displayInit(this.displayType)
    }
}

class Machine {

    constructor(config) {
        this.plugboard = new Plugboard(cfg.pairs, plugCanvas);
        this.etw = new Rotor("ETW", 1, 0, etwCanvas)
        this.rotor_1 = new Rotor(config.rotors[0], config.initial[0], 1, r1Canvas)
        this.rotor_2 = new Rotor(config.rotors[1], config.initial[1], 2, r2Canvas)
        this.rotor_3 = new Rotor(config.rotors[2], config.initial[2], 3, r3Canvas)
        this.ukw = new Rotor("UKW", 1, 4, ukwCanvas, "single column")
    }

    load(letter) {
        this.spin();

        // remove rotor visualization
        Array.from(nodes).forEach(node => {
            node.innerHTML = ""
        })

        this.plugboard.displayInit()
        this.etw.displayInit()
        this.rotor_1.displayInit()
        this.rotor_2.displayInit()
        this.rotor_3.displayInit()
        this.ukw.displayInit("single column")

        // encrypting letter
        let outputPl, outputEtw, outputR1, outputR2, outputR3, outputUkw, inputPl, inputEtw, inputR1, inputR2, inputR3;
        const letterIndex = alphabet.indexOf(letter)

        outputPl = this.plugboard.load(letterIndex, true)
        outputEtw = this.etw.load(outputPl, true) // no offset (etw is not rotated)
        outputR1 = this.rotor_1.load(outputEtw, true) // no offset (etw is not rotated)
        outputR2 = this.rotor_2.load(outputR1, true)
        outputR3 = this.rotor_3.load(outputR2, true)
        outputUkw = this.ukw.load(outputR3, true)
        inputR3 = this.rotor_3.loadBackward(outputUkw, true) // no offset (ukw is not rotated)
        inputR2 = this.rotor_2.loadBackward(inputR3, true)
        inputR1 = this.rotor_1.loadBackward(inputR2, true)
        inputEtw = this.etw.loadBackward(inputR1, true)
        inputPl = this.plugboard.loadBackward(inputEtw, true)


        // display visualization

        input.innerText = letter
        output.innerText = alphabet[inputPl]

        plugDisplay.appendChild(this.plugboard.canvas)
        etwDisplay.appendChild(this.etw.canvas)
        r1Display.appendChild(this.rotor_1.canvas)
        r2Display.appendChild(this.rotor_2.canvas)
        r3Display.appendChild(this.rotor_3.canvas)
        ukwDisplay.appendChild(this.ukw.canvas)

        return inputPl
    }

    spin() {

        if (this.rotor_1.ofset == alphabet.indexOf(this.rotor_1.turnover) + 1) {
            this.rotor_2.spin()
            if (this.rotor_2.ofset == alphabet.indexOf(this.rotor_2.turnover) + 1) {
                this.rotor_3.spin()
            }
        }
        this.rotor_1.spin()
    }
}


// Encryption Process
document.addEventListener("keydown", e => {
    if (e.key.match(/^[a-z]$/)) {
        debug.classList.remove("text-danger")
        if (isRotorInstalled && isPlugboardSet) {
            if (!machine || isReconfigured) {
                machine = new Machine(cfg);
                isReconfigured = false;
            }
            const letterIndex = machine.load(e.key.toUpperCase())
            debug.innerHTML = debug.innerHTML + alphabet[letterIndex]
            plainteks.innerHTML = plainteks.innerHTML + e.key
            debugPanel.scrollLeft = debugPanel.scrollWidth;
        } else {
            if (!isRotorInstalled) {
                debug.innerHTML = "Rotors is not installed yet!"
                debug.classList.add("text-danger")
            } else if (!isPlugboardSet) {
                debug.innerHTML = "Plugboard does not set correctly!"
                debug.classList.add("text-danger")
            }
        }
    }

    if (e.key == "Backspace") {
        debug.innerHTML = debug.innerHTML.slice(0, -1);
        plainteks.innerHTML = plainteks.innerHTML.slice(0, -1);
    } else if (e.key == " ") {
        debug.innerHTML = debug.innerHTML + " "
        plainteks.innerHTML = plainteks.innerHTML + " "
        e.preventDefault();
    }
});
