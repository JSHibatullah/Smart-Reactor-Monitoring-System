// =======================================
// STATE SISTEM (MENYERUPAI STEADY-STATE)
// =======================================
let state = {
    pressure: 65, // bar
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
    let conv = 65;
    conv += (P - 50) * 0.6;
    conv -= Math.abs(T - 230) * 0.8;
    conv -= Math.abs(ratio - 3.0) * 25;
    return clamp(conv, 10, 95);
}

function estimateSelectivity(T, ratio) {
    let sel = 90;
    sel -= Math.abs(T - 230) * 0.5;
    sel -= Math.abs(ratio - 3.0) * 20;
    return clamp(sel, 60, 98);
}

function determineStatus(state) {
    if (
        state.pressure < 55 ||
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
    state.pressure = smoothRandom(state.pressure, 1.5, 50, 80);
    document.getElementById("pressureVal").innerText = state.pressure;
    updateBar("pressureBar", state.pressure, 50, 80);

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

    // === PERFORMANCE ESTIMATION ===
    state.conversion = estimateConversion(
        state.pressure,
        state.reactorTemp,
        state.ratio
    ).toFixed(1);

    state.selectivity = estimateSelectivity(
        state.reactorTemp,
        state.ratio
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

}, 2000);