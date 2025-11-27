// Simulation engine for concurrent process execution
class ProcessSimulator {
    constructor() {
        this.processes = [];
        this.isRunning = false;
        this.isPaused = false;
        this.speed = 1;
        this.currentTime = 0;
        this.interval = null;
        this.onUpdate = null;
    }

    setProcesses(processes) {
        this.processes = processes.map(p => ({
            ...p,
            status: 'WAITING',
            startTime: null,
            endTime: null
        }));
    }

    start() {
        if (this.isRunning && !this.isPaused) return;

        if (!this.isPaused) {
            this.currentTime = 0;
            this.resetProcesses();
        }

        this.isRunning = true;
        this.isPaused = false;

        this.interval = setInterval(() => {
            this.tick();
        }, 100);
    }

    pause() {
        this.isPaused = true;
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    reset() {
        this.isRunning = false;
        this.isPaused = false;
        this.currentTime = 0;
        
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }

        this.resetProcesses();
        
        if (this.onUpdate) {
            this.onUpdate(this.processes);
        }
    }

    resetProcesses() {
        this.processes = this.processes.map(p => ({
            ...p,
            status: 'WAITING',
            startTime: null,
            endTime: null
        }));
    }

    setSpeed(speed) {
        this.speed = speed;
    }

    tick() {
        this.currentTime += (100 * this.speed);
        this.updateProcessStates();

        if (this.onUpdate) {
            this.onUpdate(this.processes);
        }

        const allCompleted = this.processes.every(p => p.status === 'COMPLETED');
        if (allCompleted) {
            this.isRunning = false;
            this.isPaused = false;
            if (this.interval) {
                clearInterval(this.interval);
                this.interval = null;
            }
        }
    }

    updateProcessStates() {
    // 1️⃣ Update WAITING → READY
    this.processes.forEach(process => {
        if (process.status === 'COMPLETED') return;

        const dependenciesMet = process.dependencies.every(depId => {
            const dep = this.processes.find(p => p.id === depId);
            return dep && dep.status === 'COMPLETED';
        });

        if (process.status === 'WAITING' && dependenciesMet) {
            process.status = 'READY';
        }

        // RUNNING selesai → COMPLETED
        if (process.status === 'RUNNING' && this.currentTime >= process.endTime) {
            process.status = 'COMPLETED';
        }
    });

    // 2️⃣ READY scheduler — hanya 1 proses yang berjalan
    const runningList = this.processes.filter(p => p.status === 'RUNNING');
    if (runningList.length === 0) {
        const readyList = this.processes.filter(p => p.status === 'READY');
        if (readyList.length > 0) {
            const next = readyList[0];
            next.status = 'RUNNING';
            next.startTime = this.currentTime;
            next.endTime = this.currentTime + 2000;
        }
    }
}


    getProcesses() {
        return this.processes;
    }
}