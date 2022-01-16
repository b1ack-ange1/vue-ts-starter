import {Component, UI} from "../app/ui";
import axios from "axios";

export interface Event {
  type: string,
  checked: boolean,
  totalAmount: string,
}

@Component({
    // language=Vue
    template: `
        <v-container fluid class="selectable">
          main page
          events size: {{ events.length }}
          <div class="table-info">
            <table>
              <tr>
                <th>Дата</th>
                <th>Сумма</th>
                <th>Количество</th>
                <th>Название</th>
                <th>Комментарий</th>
                <th>Период</th>
                <th>Выбор</th>
              </tr>
                <tr v-for='event,index in events' :key="index">
                  <div class="table-info__row-wrapper"  @click='openEvent(event)'>
                    <td>{{event.date}}</td>
                    <td>{{event.totalAmount}}</td>
                    <td>{{event.quantity}}</td>
                    <td>{{event.label}}</td>
                    <td>{{event.comment}}</td>
                    <td>{{event.period}}</td>
                  </div>
                  <td class="table-info__checkbox-row" @click='event.checked=!event.checked'>
                    <input type="checkbox" v-model="event.checked">
                  </td>
              </tr>
            </table>
            
            <button @click="showSumAll" class="table-info__button" type="button">Показать выбранное</button>

            <p class="table-info__checked">{{show_all_message}}</p>
          </div>
        </v-container>
    `
})

export class MainPage extends UI {

    private events: Array<Event> = [];
    private show_all_message:  string = '';
    
    async created(): Promise<void> {
      this.events = (await axios.get('http://localhost:3004/events')).data;
    }

    showSumAll() {
      const sumOfTypes: any = {};

      for (const event of this.events) {
        if (event.checked) {
          sumOfTypes[event.type] = (Number(sumOfTypes[event.type]) || 0) + Number(event.totalAmount.slice(4));
        }
      }

      this.show_all_message = Object.keys(sumOfTypes).map( function(key){ return key + ": " + sumOfTypes[key] }).join(", ");
    }
    openEvent(event: Event) {
      const params: any = event
      let routeData = this.$router.resolve({ path: 'event', query: params})
      window.open(routeData.href, '_blank');

    }
}
