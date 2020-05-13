import {Component, Prop, UI} from "../../../app/ui";
import {PortfolioParams} from "../../../services/portfolioService";

@Component({
    // language=Vue
    template: `
        <div>
            <div v-if="showFixedCommissionInput" class="fs13">
                <div class="mb-2">
                    Отчеты вашего брокера не содержат информацию о комиссиях.
                </div>
                <div class="mb-2">
                    Пожалуйста, укажите процент, который составляет комиссия от суммы сделки.
                </div>
                <div class="mb-2">
                    И мы автоматически рассчитаем комиссию по каждой сделке.
                </div>
                <ii-number-field label="Фиксированная комиссия" v-model="portfolioParams.fixFee" class="maxW275 w100pc"
                                 hint="Для автоматического рассчета комиссии при импорте сделок." :decimals="5" @input="changePortfolioParams">
                </ii-number-field>
            </div>
            <div class="margT50">
                <div class="fs16 bold alignC margB20">
                    Инструкция
                </div>

                Перейдите в личный кабинет брокера. Перейдите на вкладку просмотра <strong>Единой<br>
                денежной позиции</strong> далее вкладка <strong>Справка по счету.</strong>

                <v-img :src="IMAGES[0]" max-width="980" class="grey darken-4 image"></v-img>

                Настройте параметры отчета:
                <ul>
                    <li>Укажите период</li>
                    <li>Укажите формат отчета <b><i>xml</i></b></li>
                    <li>Нажмите кнопку <b><i>Сформировать</i></b></li>
                </ul>
                <v-img :src="IMAGES[1]" max-width="980" class="grey darken-4 image"></v-img>
                После успешного формирования отчета появится запрос на скачивание отчета.<br>
                Полученный файл используйте для импорта.
            </div>
        </div>
    `
})
export class FinamInstruction extends UI {

    @Prop({required: true})
    private portfolioParams: PortfolioParams;

    private showFixedCommissionInput: boolean = false;

    private IMAGES: string[] = [
        "./img/import_instructions/finam/1.png",
        "./img/import_instructions/finam/2.png"
    ];

    created(): void {
        this.showFixedCommissionInput = Number(this.portfolioParams.fixFee) === 0;
    }

    private changePortfolioParams(): void {
        this.$emit("changePortfolioParams", this.portfolioParams);
    }

}
