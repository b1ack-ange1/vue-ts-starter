import {Component, UI} from "@intelinvest/platform/src/app/ui";



@Component({
    // language=Vue
	template: `
			<div class='about-event-page'>
				<table class='about-event-page__table'>
					<thead>
						<tr>
							<th v-for='key in Object.keys(event)':key='key'>
								<td>
									{{key}}
								</td>
							</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td v-for='(item, idx) in event' :key='idx'>
								{{item ?? '—'}}
							</td>
						</tr>
					</tbody>
					</table>
				</div>
	`
})
	
	
	
export class AboutEventPage extends UI {
	
	event: { [key: string]: number } = {}
	
	async created(): Promise<void> {
		
		const router = this.$route
		
        const params = {
            method: "GET",
            headers: {
                "Content-Type": "application/json;charset=UTF-8"
            }
        };
		const response = await fetch("http://localhost:3004/events", params);
		const event = await response.json() 
		this.event =  event[router.params.id]
	}
}
