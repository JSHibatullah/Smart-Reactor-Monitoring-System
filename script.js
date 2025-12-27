// =======================================
// STATE SISTEM (MENYERUPAI STEADY-STATE)
// =======================================
let state = {
    pressure: 80, // bar
    reactorTemp: 230, // °C
    soecTemp: 800, // °C
    ratio: 3.0, // H2/CO2
    catalyst: 720 // kg atau arbitrary unit
};

// =======================================
// HELPER FUNCTIONS
// =======================================
function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
}

function calculatePerformance(conversion, selectivity) {
    // Yield-based performance index
    return clamp(
        (conversion / 100) * (selectivity / 100) * 100,
        0,
        100
    );
}

function smoothRandom(current, step, min, max, decimals = 1) {
    let delta = (Math.random() * 2 - 1) * step;
    let next = current + delta;
    return parseFloat(clamp(next, min, max).toFixed(decimals));
}

function updateBar(barId, value, min, max, optMin = null, optMax = null) {
    const bar = document.getElementById(barId);
    let percent = ((value - min) / (max - min)) * 100;
    percent = clamp(percent, 0, 100);
    bar.style.width = percent + "%";

    if (optMin !== null && optMax !== null) {
        bar.style.background =
            value >= optMin && value <= optMax ? "#2ecc71" : "#f1c40f";
    } else {
        bar.style.background = "#3498db";
    }
}

function estimateConversion(P, T, ratio) {

    let conv = 90; // BASELINE TINGGI (industrial recycle system)

    // === PRESSURE EFFECT (OPTIMUM 80–95 bar) ===
    if (P >= 80 && P <= 95) {
        conv += 6;
    } else if (P > 95 && P <= 100) {
        conv += 3 - (P - 95) * 0.5;
    } else {
        conv -= (80 - P) * 0.4;
    }

    // === TEMPERATURE EFFECT (OPTIMUM ~230 °C) ===
    conv -= Math.abs(T - 230) * 0.4;

    // === RATIO EFFECT (OPTIMUM ~3.0) ===
    conv -= Math.abs(ratio - 3.0) * 8;

    // === SMALL PROCESS NOISE ===
    conv += (Math.random() - 0.5) * 0.8;

    // 🚨 KUNCI UTAMA DI SINI
    return clamp(conv, 90, 98);
}


function estimateSelectivity(T, ratio, P) {

    let sel = 90;

    // === TEMPERATURE EFFECT (optimum ~230 °C) ===
    sel -= Math.abs(T - 230) * 0.35;

    // === RATIO EFFECT (optimum ~3.0) ===
    sel -= Math.abs(ratio - 3.0) * 12;

    // === PRESSURE EFFECT (KEY PART) ===
    if (P >= 75 && P <= 90) {
        sel += 6; // zona emas MeOH
    } else if (P > 90 && P <= 100) {
        sel += 2; // masih baik, tapi mulai stress
    } else if (P < 65) {
        sel -= (65 - P) * 0.4; // RWGS dominan
    }

    return clamp(sel, 70, 99);
}


function determineStatus(state) {
    if (
        state.pressure < 75 ||
        state.reactorTemp < 210 ||
        state.soecTemp < 720
    ) return "STARTUP";

    if (
        state.reactorTemp > 245 ||
        state.soecTemp > 880 ||
        state.ratio < 2.7 ||
        state.ratio > 3.3
    ) return "CRITICAL";

    if (
        state.ratio < 2.8 ||
        state.ratio > 3.2
    ) return "WARNING";

    return "STEADY";
}

// =======================================
// MAIN UPDATE LOOP (PROCESS LOGIC)
// =======================================
setInterval(() => {

    // 1️⃣ PRESSURE (MASTER VARIABLE)
    state.pressure = smoothRandom(state.pressure, 2.0, 50, 100);
    document.getElementById("pressureVal").innerText = state.pressure;
    updateBar("pressureBar", state.pressure, 50, 100);

    // 2️⃣ REACTOR TEMPERATURE
    // Dipengaruhi tekanan (P↑ → T↑ sedikit)
    let targetReactorT = 210 + (state.pressure - 50) * 0.8;
    state.reactorTemp = smoothRandom(
        state.reactorTemp,
        2,
        targetReactorT - 5,
        targetReactorT + 5
    );
    document.getElementById("reactorTempVal").innerText = state.reactorTemp;
    updateBar("reactorTempBar", state.reactorTemp, 200, 250);

    // 3️⃣ H2 : CO2 RATIO
    // Dikoreksi otomatis seperti di solver Python
    state.ratio = smoothRandom(state.ratio, 0.08, 2.7, 3.3, 2);

    if (state.ratio < 2.8) state.ratio += 0.05;
    if (state.ratio > 3.2) state.ratio -= 0.05;

    state.ratio = parseFloat(state.ratio.toFixed(2));

    document.getElementById("ratioVal").innerText = state.ratio;
    updateBar("ratioBar", state.ratio, 2.6, 3.4, 2.8, 3.2);

    // 4️⃣ SOEC TEMPERATURE
    // Bergantung kebutuhan H2 (ratio ↑ → SOEC ↑)
    let targetSOEC = 750 + (state.ratio - 2.8) * 200;
    state.soecTemp = smoothRandom(state.soecTemp, 8, targetSOEC - 20, targetSOEC + 20);

    document.getElementById("soecTempVal").innerText = state.soecTemp;
    updateBar("soecTempBar", state.soecTemp, 700, 900);

    // 5️⃣ CATALYST LOADING
    // Stabil, fluktuasi kecil (industrial reality)
    state.catalyst = smoothRandom(state.catalyst, 5, 650, 800, 0);
    document.getElementById("catalystVal").innerText = state.catalyst;
    updateBar("catalystBar", state.catalyst, 600, 1800, 700, 750);

    // === PERFORMANCE INDEX (PHYSICS-BASED) ===
    state.performance = calculatePerformance(
        parseFloat(state.conversion),
        parseFloat(state.selectivity)
    ).toFixed(1);

    document.getElementById("performanceVal").innerText =
        state.performance + " %";

    // === PERFORMANCE ESTIMATION ===
    state.conversion = estimateConversion(
        state.pressure,
        state.reactorTemp,
        state.ratio
    ).toFixed(1);

    state.selectivity = estimateSelectivity(
        state.reactorTemp,
        state.ratio,
        state.pressure
    ).toFixed(1);

    document.getElementById("conversionVal").innerText =
        state.conversion + " %";

    document.getElementById("selectivityVal").innerText =
        state.selectivity + " %";

    // === SYSTEM STATUS ===
    state.status = determineStatus(state);
    const statusEl = document.getElementById("statusVal");

    statusEl.innerText = state.status;
    statusEl.style.color =
        state.status === "STEADY" ? "#2ecc71" :
        state.status === "WARNING" ? "#f1c40f" :
        state.status === "CRITICAL" ? "#e74c3c" :
        "#3498db";
    const perfEl = document.getElementById("performanceVal");
    perfEl.className = "";

    if (state.performance > 80) perfEl.classList.add("performance-good");
    else if (state.performance > 60) perfEl.classList.add("performance-mid");
    else perfEl.classList.add("performance-bad");

}, 2000);
