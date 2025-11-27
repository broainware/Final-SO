// Statement parser for automatic dependency detection
class StatementParser {
    static parseStatement(statement) {
        const trimmed = statement.trim();
        
        if (!trimmed.includes('=')) {
            return null;
        }

        const [left, right] = trimmed.split('=').map(s => s.trim());
        
        if (!left || !right) {
            return null;
        }

        const dependencies = this.extractVariables(right);

        return {
            id: `stmt_${left}`,
            variable: left,
            expression: right,
            dependencies: dependencies.filter(dep => dep !== left)
        };
    }

    static extractVariables(expression) {
        const matches = expression.match(/[A-Z]/g);
        return matches ? [...new Set(matches)] : [];
    }

    static parseStatements(statements) {
        return statements
            .map(stmt => this.parseStatement(stmt))
            .filter(stmt => stmt !== null);
    }

    static statementsToProcesses(statements) {
        return statements.map(stmt => ({
            id: stmt.id,
            name: stmt.variable,
            expression: stmt.expression,
            dependencies: stmt.dependencies.map(dep => `stmt_${dep}`),
            status: 'WAITING'
        }));
    }

    static validateStatements(statements) {
        const errors = [];
        const variables = new Set(statements.map(s => s.variable));

        statements.forEach(stmt => {
            stmt.dependencies.forEach(dep => {
                if (!variables.has(dep)) {
                    errors.push(`Statement "${stmt.variable} = ${stmt.expression}" depends on undefined variable "${dep}"`);
                }
            });
        });

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}