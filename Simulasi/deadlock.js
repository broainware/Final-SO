// Deadlock detection using DFS cycle detection
class DeadlockDetector {
    static detectDeadlock(processes) {
        const visited = new Set();
        const recStack = new Set();
        const cycleNodes = [];

        const dfs = (processId) => {
            visited.add(processId);
            recStack.add(processId);

            const process = processes.find(p => p.id === processId);
            if (!process) return false;

            for (const depId of process.dependencies) {
                if (!visited.has(depId)) {
                    if (dfs(depId)) {
                        cycleNodes.push(processId);
                        return true;
                    }
                } else if (recStack.has(depId)) {
                    cycleNodes.push(processId);
                    cycleNodes.push(depId);
                    return true;
                }
            }

            recStack.delete(processId);
            return false;
        };

        for (const process of processes) {
            if (!visited.has(process.id)) {
                if (dfs(process.id)) {
                    return {
                        hasDeadlock: true,
                        cycleNodes: [...new Set(cycleNodes)]
                    };
                }
            }
        }

        return {
            hasDeadlock: false,
            cycleNodes: []
        };
    }
}