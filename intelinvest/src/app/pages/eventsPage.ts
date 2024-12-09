import {Component, UI} from "@intelinvest/platform/src/app/ui";
import { IEvents } from "@intelinvest/platform/typings/eventTypes";
import Vue from 'vue';
@Component({
    // language=Vue	
	template: `
		<div class='event-page'>
			<div>
				<button class='event-page__action' @click='toggleShowTotalAmount'>
					Показать выбранные
				</button>
			</div>
			<table class='event-page__table'>
				<thead>
					<tr>
						<th v-for="header in headers" :key='header.displayName'>
							{{header.displayName}}
						</th>
						<th>
							Выбор
						</th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="(item, idx) in events" :key='idx' class='event-page__body-row' >
						<td v-for="col in headers" :key='col.fieldName'>
							<router-link
								:to="{name: 'aboutEvent', params: {id: idx}}"
								target='_blank'
								class='event-page__body-row-link'
							>
								{{item[col.fieldName]}}
							</router-link>
						</td>
						<td>
							<router-link
								:to="{name: 'aboutEvent', params: {id: idx}}"
								target='_blank' class='event-page__body-row-link'
							>
								<input
									type='checkbox'
									class='event-page__body-row-checkbox'
									@change="(event) => countTotalAmount(item, event)"
								>
							</router-link>
						</td>
					</tr>	
				</tbody>
			</table>
			<div
				v-if="isShowTotalCount"
				class='event-page__total-count'
				:class="{'event-page__total-count--empty': !Object.keys(totalAmountStore).length}"
			>
				{{totalAmount}}
			</div>
		</div>
	`
})
	
export class EventsPage extends UI {
	 /**
     * флаг, показывать или нет сумму вычисленных строк
     */
	isShowTotalCount = false
	 /**
     * храннит ключ (type) и значение (сумма totalAmount)
     */
	totalAmountStore: { [key: string]: number } = Vue.observable({})
	
	 /**
     * храннит данные, полученные из 'http://localhost:3004/events'
     */
	events: IEvents[] = [];

	 /**
     * Заголовки для таблицы
     */
	headers: {fieldName: string, displayName: string}[] = [
		{ fieldName: 'date', displayName: 'Дата' },
		{ fieldName: 'totalAmount', displayName: 'Сумма' },
		{ fieldName: 'quantity', displayName: 'Количество' },
		{ fieldName: 'label', displayName: 'Название' },
		{ fieldName: 'comment', displayName: 'Комментарий' },
		{ fieldName: 'period', displayName: 'Период' },
	]

    async created(): Promise<void> {
        const params = {
            method: "GET",
            headers: {
                "Content-Type": "application/json;charset=UTF-8"
            }
        };
        const response = await fetch("http://localhost:3004/events", params);
		this.events = await response.json();
	}

	 /**
     * сложение/вычитание значений
     */
	countTotalAmount(data: IEvents, event: Event) {

		const totalAmount = Number(data.totalAmount.replace(/[^\d.]/gi, ''))
		const target = event.target as HTMLInputElement



		if (!target.checked) {
			this.totalAmountStore[data.type] = +(this.totalAmountStore[data.type] - totalAmount).toFixed(2)

			if (this.totalAmountStore[data.type] === 0) {
				Vue.delete(this.totalAmountStore, data.type);
			}

			return 
		}

		if (!this.totalAmountStore[data.type]) {
			Vue.set(this.totalAmountStore, data.type, +totalAmount.toFixed(2));
			return 
		}

		this.totalAmountStore[data.type] = +(this.totalAmountStore[data.type] + totalAmount).toFixed(2)
		
	};

	/**
     * Переключает отображение общей суммы
     */
	 toggleShowTotalAmount() {
		this.isShowTotalCount = !this.isShowTotalCount
	 }
	
	 /**
     * Вычисленная сумма строк в нужном формате (DIVIDEND: 100, COUPON: 56), либо подпись, что строка не выбрана
     */
	get totalAmount() {	

		return Object.keys(this.totalAmountStore).length
			? Object.entries(this.totalAmountStore)
					.map(([key, item]) => `${key}: ${item}`)
					.join(', ')
			: 'Не выбрана ни одна строка'
	}
}
