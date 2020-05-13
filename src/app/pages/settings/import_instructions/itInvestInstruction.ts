import Component from "vue-class-component";
import {UI} from "../../../app/ui";

@Component({
    // language=Vue
    template: `
        <div>
            В электронном кабинете выберите вкладку ОТЧЕТЫ, затем подпункт ОТЧЕТЫ БРОКЕРА ЗА ОПРЕДЕЛЕННЫЙ ПЕРИОД.<br>
            Выберите период и поставьте две галочки - "Отчет в формате XML" и "Показывать сделки".<br>
            Полученный файл необходимо открыть в Excel и сохранить в формате CSV. Используйте этот CSV-файл для импорта.
        </div>
    `
})
export class ItInvestInstruction extends UI {
}
