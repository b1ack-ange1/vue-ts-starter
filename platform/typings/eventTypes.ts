export interface IEvents {
	amountPerShare: string;
	cleanAmount: string;
	cleanAmountPerShare: string | null
	comment: string | null
	date: string
	executed: boolean
	label: string
	period: string | null
	portfolioId: number
	quantity: string
	tax: string | null
	totalAmount: string
	totalAmountOriginal: string
	type: string
}