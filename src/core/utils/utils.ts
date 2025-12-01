export const aplicarOperacion = (base: number, op: string, val: number): number => {
	switch (op) {
		case '+':
			return base + val;
		case '-':
			return base - val;
		case '*':
			return base * val;
		case '/':
			return val === 0 ? base : base / val;
		case '=':
			return val;
		default:
			return base;
	}
};
