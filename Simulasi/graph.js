// Graph visualization using vis.js
class GraphVisualizer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.network = null;
        this.nodes = new vis.DataSet([]);
        this.edges = new vis.DataSet([]);
    }

    initialize() {
        const data = {
            nodes: this.nodes,
            edges: this.edges
        };

        const options = {
            nodes: {
                shape: 'box',
                margin: 10,
                widthConstraint: {
                    minimum: 100,
                    maximum: 150
                },
                font: {
                    size: 14,
                    face: 'Arial'
                },
                borderWidth: 2,
                shadow: true
            },
            edges: {
                arrows: {
                    to: {
                        enabled: true,
                        scaleFactor: 1
                    }
                },
                smooth: {
                    type: 'cubicBezier',
                    forceDirection: 'horizontal',
                    roundness: 0.4
                },
                width: 2
            },
            layout: {
                hierarchical: {
                    direction: 'LR',
                    sortMethod: 'directed',
                    levelSeparation: 200,
                    nodeSpacing: 150
                }
            },
            physics: {
                enabled: false
            },
            interaction: {
                dragNodes: true,
                dragView: true,
                zoomView: true
            }
        };

        this.network = new vis.Network(this.container, data, options);
    }

    updateGraph(processes, deadlockNodes = []) {
        this.nodes.clear();
        this.edges.clear();

        processes.forEach(process => {
            const isDeadlocked = deadlockNodes.includes(process.id);
            let color = this.getStatusColor(process.status);
            
            if (isDeadlocked) {
                color = {
                    background: '#fee2e2',
                    border: '#ef4444',
                    highlight: {
                        background: '#fecaca',
                        border: '#dc2626'
                    }
                };
            }

            this.nodes.add({
                id: process.id,
                label: process.name || process.id,
                color: color,
                font: {
                    color: isDeadlocked ? '#991b1b' : '#0f172a'
                }
            });

            process.dependencies.forEach(depId => {
                this.edges.add({
                    from: depId,
                    to: process.id,
                    color: isDeadlocked ? '#ef4444' : '#64748b'
                });
            });
        });
    }

    getStatusColor(status) {
        const colors = {
            'WAITING': {
                background: '#f3f4f6',
                border: '#9ca3af'
            },
            'READY': {
                background: '#fef3c7',
                border: '#fbbf24'
            },
            'RUNNING': {
                background: '#dbeafe',
                border: '#3b82f6'
            },
            'COMPLETED': {
                background: '#d1fae5',
                border: '#10b981'
            }
        };

        return colors[status] || colors['WAITING'];
    }

    clear() {
        this.nodes.clear();
        this.edges.clear();
    }
}