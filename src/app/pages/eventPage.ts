import {Component, UI} from "../app/ui";

@Component({
    // language=Vue
    template: `
        <v-container fluid class="selectable">
          <table>
            <tr v-for="value, key in choosen_event">
              <td>{{key}}</td>
              <td>{{value}}</td>
            </tr>
          </table>
        </v-container>
    `
})


export class EventPage extends UI {
  
  private choosen_event: any;

  async created(): Promise<void> {
    this.choosen_event = this.$route.query;
  }
}
