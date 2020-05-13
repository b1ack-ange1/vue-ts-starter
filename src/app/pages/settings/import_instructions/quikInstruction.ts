import Component from "vue-class-component";
import {UI} from "../../../app/ui";

@Component({
    // language=Vue
    template: `
        <div>
            Отчеты из терминала QUIK это универсальный вариант, подходящий к разным<br>
            брокерам, которые дают возможность загрузить отчет через терминал.
            <div class="import-default-text-margin-t">Для получения файла импорта в терминале QUIK</div>
            <v-img :src="IMAGES[0]" max-width="948" class="grey darken-4 image"></v-img>
            Перейдите в меню "Расширения" -> "Отчеты" -> "Отчет по всем сделкам клиента".
            <v-img :src="IMAGES[1]" max-width="622.5" class="grey darken-4 image"></v-img>
            Сформируйте отчет за требуемый вам период.
            <v-img :src="IMAGES[2]" max-width="279" class="grey darken-4 image"></v-img>
            Полученный файл используйте для импорта.
        </div>
    `
})
export class QuikInstruction extends UI {

    private IMAGES: string[] = [
        "./img/import_instructions/quik/1.png",
        "./img/import_instructions/quik/2.png",
        "./img/import_instructions/quik/3.png"
    ];

}
