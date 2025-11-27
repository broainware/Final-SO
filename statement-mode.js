
// Statement mode main logic
let processes = [];
let statements = [];
let simulator = new ProcessSimulator();
let graph = new GraphVisualizer('graph');
let currentTab = 'statement';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    graph.initialize();
    setupEventListeners();
});

function setupEventListeners() {
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            switchTab(btn.dataset.tab);
        });
    });

    // Statement form
    document.getElementById('statement-form').addEventListener('submit', (e) => {
        e.preventDefault();
        generateFromStatements();
    });

    document.getElementById('clear-statements').addEventListener('click', clearStatements);

    // Process form (manual tab)
    document.getElementById('process-form-statement').addEventListener('submit', (e) => {
        e.preventDefault();
        addProcess();
    });

    // Simulation controls
    document.getElementById('start-btn').addEventListener('click', startSimulation);
    document.getElementById('pause-btn').addEventListener('click', pauseSimulation);
    document.getElementById('reset-btn').addEventListener('click', resetSimulation);
    
    // Speed slider
    const speedSlider = document.getElementById('speed-slider');
    speedSlider.addEventListener('input', (e) => {
        const speed = parseFloat(e.target.value);
        document.getElementById('speed-value').textContent = `${speed.toFixed(1)}x`;
        simulator.setSpeed(speed);
    });

    // Simulator callback
    simulator.onUpdate = (updatedProcesses) => {
        processes = updatedProcesses;
        updateUI();
        updateStatementList();
        updateConcurrencyInfo();
        updateReadyQueue();
        updateWaitingReason();

    };
}

function switchTab(tab) {
    currentTab = tab;
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === `${tab}-tab`);
    });
}

function generateFromStatements() {
    const textarea = document.getElementById('statements');
    const lines = textarea.value
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

    const errorsDiv = document.getElementById('statement-errors');
    
    if (lines.length === 0) {
        showError('Masukkan minimal satu statement');
        return;
    }

    statements = StatementParser.parseStatements(lines);

    if (statements.length === 0) {
        showError('Tidak ada statement yang valid. Format: VARIABLE = EXPRESSION');
        return;
    }

    const validation = StatementParser.validateStatements(statements);

    if (!validation.isValid) {
        showError(validation.errors.join('<br>'));
        return;
    }

    errorsDiv.style.display = 'none';
    processes = StatementParser.statementsToProcesses(statements);
    
    checkDeadlock();
    updateUI();
    updateStatementList();
    
}

function showError(message) {
    const errorsDiv = document.getElementById('statement-errors');
    errorsDiv.innerHTML = `<strong>Error:</strong><br>${message}`;
    errorsDiv.style.display = 'block';
}

function clearStatements() {
    document.getElementById('statements').value = '';
    document.getElementById('statement-errors').style.display = 'none';
    statements = [];
    processes = [];
    updateUI();
    document.getElementById('statement-list-container').style.display = 'none';
}

function addProcess() {
    const nameInput = document.getElementById('process-name-statement');
    const name = nameInput.value.trim();
    
    if (!name) return;

    const dependencies = [];
    document.querySelectorAll('#dependencies-list-statement input[type="checkbox"]:checked').forEach(checkbox => {
        dependencies.push(checkbox.value);
    });

    const newProcess = {
        id: `p${Date.now()}`,
        name: name,
        dependencies: dependencies,
        status: 'WAITING'
    };

    processes.push(newProcess);
    nameInput.value = '';
    
    checkDeadlock();
    updateUI();
}

function removeProcess(id) {
    processes = processes.filter(p => p.id !== id);
    processes = processes.map(p => ({
        ...p,
        dependencies: p.dependencies.filter(depId => depId !== id)
    }));
    
    checkDeadlock();
    updateUI();
}

function checkDeadlock() {
    const result = DeadlockDetector.detectDeadlock(processes);
    
    const alert = document.getElementById('deadlock-alert');
    const message = document.getElementById('deadlock-message');
    
    if (result.hasDeadlock) {
        const nodeNames = result.cycleNodes
            .map(id => {
                const stmt = statements.find(s => s.id === id);
                return stmt?.variable || processes.find(p => p.id === id)?.name || id;
            })
            .join(' → ');
        
        message.textContent = `Terdapat circular dependency pada proses: ${nodeNames}`;
        alert.style.display = 'block';
        document.getElementById('start-btn').disabled = true;
    } else {
        alert.style.display = 'none';
        document.getElementById('start-btn').disabled = processes.length === 0;
    }
    
    graph.updateGraph(processes, result.cycleNodes);
}

function updateUI() {
    if (currentTab === 'manual') {
        updateProcessList();
        updateDependenciesList();
    }
    
    graph.updateGraph(processes, []);
    
    const hasProcesses = processes.length > 0;
    document.getElementById('start-btn').disabled = !hasProcesses || simulator.isRunning;
}

function updateProcessList() {
    const listContainer = document.getElementById('process-list-statement');
    
    if (processes.length === 0) {
        listContainer.innerHTML = '<p class="text-muted">Belum ada proses</p>';
        return;
    }

    listContainer.innerHTML = processes.map(process => {
        const deps = process.dependencies.length > 0
            ? process.dependencies.map(id => processes.find(p => p.id === id)?.name || id).join(', ')
            : 'none';
        
        return `
            <div class="process-item">
                <div class="process-info">
                    <div class="status-dot ${process.status.toLowerCase()}"></div>
                    <div>
                        <div class="process-name">${process.name}</div>
                        <div class="process-deps">Dependencies: ${deps}</div>
                    </div>
                </div>
                <button class="btn-remove" onclick="removeProcess('${process.id}')">Remove</button>
            </div>
        `;
    }).join('');
}

function updateDependenciesList() {
    const container = document.getElementById('dependencies-list-statement');
    
    if (processes.length === 0) {
        container.innerHTML = '<p class="text-muted">Belum ada proses lain</p>';
        return;
    }

    container.innerHTML = processes.map(process => `
        <div class="checkbox-item">
            <input type="checkbox" id="dep-stmt-${process.id}" value="${process.id}">
            <label for="dep-stmt-${process.id}">${process.name}</label>
        </div>
    `).join('');
}

function updateStatementList() {
    const container = document.getElementById('statement-list-container');
    const list = document.getElementById('statement-list');
    
    if (statements.length === 0) {
        container.style.display = 'none';
        return;
    }

    container.style.display = 'block';
    
    list.innerHTML = statements.map(stmt => {
        const process = processes.find(p => p.id === stmt.id);
        const status = process?.status || 'WAITING';
        const deps = stmt.dependencies.length > 0 
            ? `depends on: ${stmt.dependencies.join(', ')}`
            : 'no dependencies';
        
        return `
            <div class="statement-item">
                <div class="status-dot ${status.toLowerCase()}"></div>
                <div class="statement-expression">
                    <span class="statement-variable">${stmt.variable}</span>
                    <span class="text-muted"> = </span>
                    <span>${stmt.expression}</span>
                </div>
                <div class="statement-deps">${deps}</div>
                <div class="statement-status">
                 <span class="badge ${status.toLowerCase()}">${status}</span></div>
            </div>
        `;
    }).join('');
}

function startSimulation() {
    simulator.setProcesses(processes);
    simulator.start();
    
    document.getElementById('start-btn').style.display = 'none';
    document.getElementById('pause-btn').style.display = 'block';
}

function pauseSimulation() {
    simulator.pause();
    
    document.getElementById('start-btn').style.display = 'block';
    document.getElementById('start-btn').textContent = '▶ Resume';
    document.getElementById('pause-btn').style.display = 'none';
}

function resetSimulation() {
    simulator.reset();
    
    document.getElementById('start-btn').style.display = 'block';
    document.getElementById('start-btn').textContent = '▶ Mulai';
    document.getElementById('pause-btn').style.display = 'none';
    
    if (statements.length > 0) {
        updateStatementList();
    }
}
function updateConcurrencyInfo() {
    // CPU
    const running = processes.find(p => p.status === "RUNNING");
    document.getElementById("cpu-running").textContent = running ? running.name : "-";

    // Ready Queue
    const ready = processes.filter(p => p.status === "READY").map(p => p.name);
    document.getElementById("ready-queue").textContent = ready.length ? ready.join(", ") : "-";

    // Waiting Reason
    const container = document.getElementById("waiting-reason");
    let html = "";
    processes.filter(p => p.status === "WAITING").forEach(p => {
        const deps = p.dependencies.filter(d => {
            const target = processes.find(x => x.name === d);
            return target && target.status !== "COMPLETED";
        });
        html += `<li>${p.name} menunggu ${deps.join(", ")}</li>`;
    });
    container.innerHTML = html;
}

function updateReadyQueue() {
    const ready = processes.filter(p => p.status === "READY").map(p => p.name);
    const elem = document.getElementById("ready-queue");
    elem.textContent = ready.length ? ready.join(", ") : "-";
}

function updateWaitingReason() {
    const elem = document.getElementById("waiting-reason");
    elem.innerHTML = "";

    processes.filter(p => p.status === "WAITING").forEach(p => {
        // proses menunggu dependency yang belum completed
        const deps = p.dependencies.filter(d => {
            const depProcess = processes.find(x => x.name === d);
            return depProcess && depProcess.status !== "COMPLETED";
        });

        const helpBubble = document.getElementById('help-bubble');
const helpPopup = document.getElementById('help-popup');
const helpClose = document.getElementById('help-close');

helpBubble.addEventListener('click', () => {
  helpPopup.classList.toggle('show');
});

helpClose.addEventListener('click', () => {
  helpPopup.classList.remove('show');
});

window.addEventListener('click', (e) => {
  if (
    helpPopup.classList.contains('show') &&
    !helpPopup.contains(e.target) &&
    e.target !== helpBubble
  ) {
    helpPopup.classList.remove('show');
  }
});

        const li = document.createElement("li");
        li.textContent = `${p.name} menunggu ${deps.join(", ")}`;
        elem.appendChild(li);
    });
    
}

