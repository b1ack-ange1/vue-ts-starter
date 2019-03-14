import Decimal from "decimal.js";
import moment from "moment";
import {Inject} from "typescript-ioc";
import Component from "vue-class-component";
import {Watch} from "vue-property-decorator";
import {VueRouter} from "vue-router/types/router";
import {DisableConcurrentExecution} from "../../platform/decorators/disableConcurrentExecution";
import {ShowProgress} from "../../platform/decorators/showProgress";
import {ClientService} from "../../services/clientService";
import {EventFields} from "../../services/eventService";
import {MarketHistoryService} from "../../services/marketHistoryService";
import {MarketService} from "../../services/marketService";
import {MoneyResiduals, PortfolioService} from "../../services/portfolioService";
import {TradeFields, TradeService} from "../../services/tradeService";
import {AssetType} from "../../types/assetType";
import {BigMoney} from "../../types/bigMoney";
import {Operation} from "../../types/operation";
import {TradeDataHolder} from "../../types/trade/tradeDataHolder";
import {TradeMap} from "../../types/trade/tradeMap";
import {TradeValue} from "../../types/trade/tradeValue";
import {Bond, CurrencyUnit, ErrorInfo, Portfolio, Share, Stock} from "../../types/types";
import {DateUtils} from "../../utils/dateUtils";
import {TradeUtils} from "../../utils/tradeUtils";
import {MainStore} from "../../vuex/mainStore";
import {CustomDialog} from "./customDialog";

@Component({
    // language=Vue
    template: `
        <v-dialog v-model="showed" persistent max-width="700px">
            <v-card class="dialog-wrap">
                <v-icon class="closeDialog" @click.native="close">close</v-icon>

                <v-card-title class="paddB0">
                    <span class="headline">{{ tradeId ? "Редактирование" : "Добавление" }} сделки</span>
                    <v-spacer></v-spacer>
                </v-card-title>

                <v-card-text class="paddT0 paddB0">
                    <v-container grid-list-md class="paddT0 paddB0">
                        <v-layout wrap>
                            <!-- Тип актива -->
                            <v-flex xs12 sm6>
                                <v-select :items="assetTypes" v-model="assetType" :return-object="true" label="Тип актива" item-text="description" dense
                                          hide-details></v-select>
                            </v-flex>

                            <!-- Операция -->
                            <v-flex xs12 sm6>
                                <v-select :items="assetType.operations" v-model="operation" :return-object="true" label="Операция" dense hide-details
                                          item-text="description" @change="onOperationChange"></v-select>
                            </v-flex>

                            <!-- Тикер бумаги -->
                            <v-flex v-if="shareAssetType" xs12 :class="portfolioProModeEnabled ? 'sm6' : 'sm9'">
                                <share-search :asset-type="assetType" :filtered-shares="filteredShares" @change="onShareSelect" @clear="onShareClear"></share-search>
                            </v-flex>

                            <!-- Дата сделки -->
                            <v-flex xs12 :class="moneyTrade ? portfolioProModeEnabled ? 'sm6' : '' : 'sm3'">
                                <v-menu ref="dateMenu" :close-on-content-click="false" v-model="dateMenuValue" :nudge-right="40" :return-value.sync="date"
                                        lazy transition="scale-transition" offset-y full-width min-width="290px">
                                    <v-text-field name="date" slot="activator" v-model="date" label="Дата" v-validate="'required'"
                                                  :error-messages="errors.collect('date')" readonly></v-text-field>
                                    <v-date-picker v-model="date" :no-title="true" locale="ru" :first-day-of-week="1" @input="onDateSelected"></v-date-picker>
                                </v-menu>
                            </v-flex>

                            <!-- Время сделки -->
                            <v-flex v-if="portfolioProModeEnabled" xs12 :class="moneyTrade ? 'sm6' : 'sm3'">
                                <v-dialog ref="timeMenu" v-model="timeMenuValue" :return-value.sync="time" persistent lazy full-width width="290px">
                                    <v-text-field slot="activator" v-model="time" label="Время" readonly></v-text-field>
                                    <v-time-picker v-if="timeMenuValue" v-model="time" format="24hr" full-width>
                                        <v-spacer></v-spacer>
                                        <v-btn flat color="primary" @click="timeMenuValue = false">Отмена</v-btn>
                                        <v-btn flat color="primary" @click="$refs.timeMenu.save(time)">OK</v-btn>
                                    </v-time-picker>
                                </v-dialog>
                            </v-flex>

                            <!-- Цена -->
                            <v-flex v-if="shareAssetType" xs12 sm6>
                                <ii-number-field :label="priceLabel" v-model="price" class="required" name="price" v-validate="'required'"
                                                 :error-messages="errors.collect('price')" @keyup="calculateFee">
                                </ii-number-field>
                            </v-flex>

                            <!-- Количество -->
                            <v-flex v-if="shareAssetType" xs12 sm6>
                                <ii-number-field label="Количество" v-model="quantity" @keyup="calculateFee" :hint="lotSizeHint" persistent-hint
                                                 name="quantity" :decimals="0" v-validate="'required'" :error-messages="errors.collect('quantity')">
                                </ii-number-field>
                            </v-flex>

                            <!-- Номинал -->
                            <v-flex v-if="bondTrade" xs12 sm3>
                                <ii-number-field label="Номинал" v-model="facevalue" @keyup="calculateFee" :decimals="2" name="facevalue"
                                                 v-validate="'required'" :error-messages="errors.collect('facevalue')">
                                </ii-number-field>
                            </v-flex>

                            <!-- НКД -->
                            <v-flex v-if="bondTrade" xs12 sm9>
                                <v-layout wrap>
                                    <v-flex xs12 lg6>
                                        <ii-number-field label="НКД" v-model="nkd" @keyup="calculateFee" :decimals="2" name="nkd"
                                                         v-validate="'required'" :error-messages="errors.collect('nkd')">
                                        </ii-number-field>
                                    </v-flex>
                                    <v-flex v-if="calculationAssetType || bondTrade" xs12 lg6>
                                        <v-tooltip content-class="custom-tooltip-wrap" top>
                                            <v-checkbox slot="activator" label="Начисление на одну бумагу" v-model="perOne"></v-checkbox>
                                            <span>Отключите если вносите сумму начисления</span>
                                        </v-tooltip>
                                    </v-flex>
                                </v-layout>
                            </v-flex>

                            <!-- Комиссия -->
                            <v-flex v-if="shareAssetType && !calculationAssetType" xs12>
                                <ii-number-field label="Комиссия" v-model="fee" :decimals="2"
                                                 hint="Для автоматического рассчета комиссии задайте значение в Настройках или введите значение суммарной комиссии">
                                </ii-number-field>
                            </v-flex>

                            <!-- Сумма денег (для денежной сделки) -->
                            <v-flex v-if="moneyTrade" xs12>
                                <v-layout wrap>
                                    <v-flex xs12 lg8>
                                        <ii-number-field label="Сумма" v-model="moneyAmount" :decimals="2"></ii-number-field>
                                    </v-flex>
                                    <v-flex xs12 lg4>
                                        <v-select :items="currencyList" v-model="moneyCurrency" label="Валюта сделки"></v-select>
                                    </v-flex>
                                </v-layout>
                            </v-flex>

                            <!-- Заметка -->
                            <v-flex xs12>
                                <v-text-field label="Заметка" v-model="note" :counter="160"></v-text-field>
                            </v-flex>
                        </v-layout>

                        <!-- Итоговая сумма сделки -->
                        <v-layout wrap>
                            <v-flex xs12 lg6>
                                <span class="body-2">Сумма сделки: </span><span v-if="total"><b class="title">{{ total | number }} {{ getCurrency() }}</b></span>
                            </v-flex>
                            <v-flex xs12 lg6>
                                <span class="body-2">Доступно: </span><span v-if="moneyResiduals"><b
                                    class="title">{{ moneyResidual | amount }} {{ getCurrency() }}</b></span>
                                <v-checkbox :disabled="keepMoneyDisabled" :label="keepMoneyLabel" v-model="keepMoney" hide-details></v-checkbox>
                            </v-flex>
                        </v-layout>
                    </v-container>
                    <small>* обозначает обязательные поля</small>
                </v-card-text>

                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn :loading="processState" :disabled="!isValid || processState" color="primary" dark @click.native="addTrade">
                        {{ tradeId ? "Сохранить" : "Добавить" }}
                        <span slot="loader" class="custom-loader">
                        <v-icon light>fas fa-spinner fa-spin</v-icon>
                      </span>
                    </v-btn>
                    <v-btn color="info lighten-2" flat @click.native="close">Отмена</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    `,
    components: {CustomDialog}
})
export class AddTradeDialog extends CustomDialog<TradeDialogData, boolean> implements TradeDataHolder {

    $refs: {
        dateMenu: any,
        timeMenu: any,
    };

    @Inject
    private clientService: ClientService;
    @Inject
    private marketService: MarketService;
    @Inject
    private tradeService: TradeService;
    @Inject
    private portfolioService: PortfolioService;
    @Inject
    private marketHistoryService: MarketHistoryService;

    private portfolio: Portfolio = null;

    private assetTypes = AssetType.values();

    private assetType = AssetType.STOCK;

    private operation = Operation.BUY;

    private currencyList = CurrencyUnit.values().map(c => c.code);

    private moneyCurrency = "RUB";

    private share: Share = null;

    private filteredShares: Share[] = [];

    private tradeId: string = null;

    private editedMoneyTradeId: string = null;

    private date = DateUtils.currentDate();

    private time = DateUtils.currentTime();

    private price: string = null;

    private quantity: number = null;

    private facevalue: string = null;

    private nkd: string = null;

    private fee: string = null;

    private note: string = null;

    private dateMenuValue = false;
    private timeMenuValue = false;

    private moneyAmount: string = null;

    private keepMoneyValue = true;
    private perOne = true;

    private currency = "RUB";
    private processState = false;

    private moneyResiduals: MoneyResiduals = null;
    /** Признак доступности профессионального режима */
    private portfolioProModeEnabled = false;

    async mounted(): Promise<void> {
        this.assetType = this.data.assetType || AssetType.STOCK;
        this.moneyCurrency = this.data.moneyCurrency || "RUB";
        this.portfolio = (this.data.store as any).currentPortfolio;
        const clientInfo = await this.clientService.getClientInfo();
        this.portfolioProModeEnabled = TradeUtils.isPortfolioProModeEnabled(this.portfolio, clientInfo);
        this.moneyResiduals = await this.portfolioService.getMoneyResiduals(this.portfolio.id);
        this.share = this.data.share || null;
        this.operation = this.data.operation || Operation.BUY;
        if (this.data.quantity) {
            this.quantity = this.data.quantity;
        }
        if (this.data.ticker) {
            await this.setShareFromTicker(this.data.ticker);
            this.filteredShares = [this.share];
        } else if (this.data.tradeFields) {
            await this.setTradeFields();
        } else if (this.data.eventFields) {
            this.filteredShares = this.share ? [this.share] : [];
            await this.setEventFields();
        } else {
            this.fillFieldsFromShare();
            this.filteredShares = this.share ? [this.share] : [];
        }
    }

    @Watch("assetType")
    private onAssetTypeChange(newValue: AssetType): void {
        if (this.data.operation === undefined) {
            this.operation = this.assetType.operations[0];
        } else {
            this.operation = this.data.operation;
        }
        this.clearFields();
    }

    private async onTickerOrDateChange(): Promise<void> {
        if (!this.date || !this.share) {
            return;
        }
        const calculationOperation = [Operation.COUPON, Operation.DIVIDEND, Operation.AMORTIZATION].includes(this.operation);
        const date = DateUtils.parseDate(this.date);
        if (calculationOperation) {
            await this.fillFromSuggestedInfo();
            return;
        }
        if (DateUtils.isCurrentDate(date)) {
            if (this.assetType === AssetType.STOCK) {
                this.fillFieldsFromStock(this.share as Stock);
            } else if (this.assetType === AssetType.BOND) {
                this.fillFieldsFromBond(this.share as Bond);
            }
        } else if (DateUtils.isBefore(date)) {
            if (this.assetType === AssetType.STOCK) {
                const stock = (await this.marketHistoryService.getStockHistory(this.share.ticker, moment(this.date).format("DD.MM.YYYY")));
                this.fillFieldsFromStock(stock);
            } else if (this.assetType === AssetType.BOND) {
                const bond = (await this.marketHistoryService.getBondHistory(this.share.ticker, moment(this.date).format("DD.MM.YYYY")));
                this.fillFieldsFromBond(bond);
            }
        }
    }

    private async onOperationChange(): Promise<void> {
        if (!this.date || !this.share) {
            return;
        }
        const calculationOperation = [Operation.COUPON, Operation.DIVIDEND, Operation.AMORTIZATION].includes(this.operation);
        const date = DateUtils.parseDate(this.date);
        if (calculationOperation) {
            await this.fillFromSuggestedInfo();
        }
    }

    private async fillFromSuggestedInfo(): Promise<void> {
        const suggestedInfo = await this.tradeService.getSuggestedInfo(this.portfolio.id, this.assetType.enumName,
            this.operation.enumName, this.share.ticker, this.date);
        if (suggestedInfo) {
            this.quantity = suggestedInfo.quantity;
            this.price = suggestedInfo.amount;
        }
    }

    private calculateFee(): void {
        const fixFee = this.portfolio.portfolioParams.fixFee ? new Decimal(this.portfolio.portfolioParams.fixFee) : null;
        if (fixFee && !fixFee.isZero() && this.assetType !== AssetType.MONEY) {
            const totalNkd = this.getNkd() && this.getQuantity() ? new Decimal(this.getNkd()).mul(new Decimal(this.isPerOne() ? this.getQuantity() : 1)) :
                new Decimal(0);
            this.fee = this.totalWithoutFee ? new Decimal(this.totalWithoutFee).sub(totalNkd).mul(fixFee)
                .dividedBy(100).toDP(2, Decimal.ROUND_HALF_UP).toString() : this.fee;
        }
    }

    private async onDateSelected(date: string): Promise<void> {
        this.$refs.dateMenu.save(date);
        await this.onTickerOrDateChange();
    }

    private async onShareSelect(share: Share): Promise<void> {
        this.share = share;
        this.fillFieldsFromShare();
        await this.onTickerOrDateChange();
    }

    private fillFieldsFromShare(): void {
        // при очистке поля автокомплита
        if (!this.share) {
            return;
        }
        this.currency = this.share.currency;
        if (this.assetType === AssetType.STOCK) {
            this.fillFieldsFromStock(this.share as Stock);
        } else if (this.assetType === AssetType.BOND) {
            this.fillFieldsFromBond(this.share as Bond);
        }
    }

    @ShowProgress
    @DisableConcurrentExecution
    private async addTrade(): Promise<void> {
        this.$validator.errors.clear();
        const result = await this.$validator.validateAll();
        if (!result) {
            return;
        }
        const tradeFields: TradeFields = {
            ticker: this.shareTicker,
            date: this.getDate(),
            quantity: this.getQuantity(),
            price: this.getPrice(),
            facevalue: this.getFacevalue(),
            nkd: this.getNkd(),
            perOne: this.isPerOne(),
            fee: this.getFee(),
            note: this.getNote(),
            keepMoney: this.isKeepMoney(),
            moneyAmount: this.total,
            currency: this.getCurrency()
        };
        this.processState = true;
        try {
            if (this.tradeId) {
                await this.editTrade(tradeFields);
            } else {
                await this.saveTrade(tradeFields);
            }

            this.$snotify.info(`Сделка успешно ${this.tradeId ? "отредактирована" : "добавлена"}`, "Выполнено");
            this.close(true);
        } catch (e) {
            this.handleError(e);
        } finally {
            this.processState = false;
        }
    }

    private async saveTrade(tradeFields: TradeFields): Promise<void> {
        return this.tradeService.saveTrade({
            portfolioId: this.portfolio.id,
            asset: this.assetType.enumName,
            operation: this.operation.enumName,
            createLinkedTrade: this.isKeepMoney(),
            fields: tradeFields
        });
    }

    private async editTrade(tradeFields: TradeFields): Promise<void> {
        return this.tradeService.editTrade({
            tradeId: this.tradeId,
            tableName: TradeUtils.tradeTable(this.assetType, this.operation),
            asset: this.assetType.enumName,
            operation: this.operation.enumName,
            portfolioId: this.portfolio.id,
            createLinkedTrade: this.isKeepMoney(),
            editedMoneyTradeId: this.editedMoneyTradeId,
            fields: tradeFields
        });
    }

    private handleError(error: ErrorInfo): void {
        const validatorFields = this.$validator.fields.items.map(f => f.name);
        for (const errorInfo of error.fields) {
            if (validatorFields.includes(errorInfo.name)) {
                this.$validator.errors.add({field: errorInfo.name, msg: errorInfo.errorMessage});
            }
        }
        if (this.$validator.errors.count() === 0) {
            const globalMessage = TradeUtils.getGlobalMessage(error);
            this.$snotify.error(globalMessage);
        }
    }

    private fillFieldsFromStock(stock: Stock): void {
        this.price = new BigMoney(stock.price).amount.toString();
    }

    private fillFieldsFromBond(bond: Bond): void {
        this.price = bond.prevprice;
        this.facevalue = new BigMoney(bond.facevalue).amount.toString();
        this.nkd = new BigMoney(bond.accruedint).amount.toString();
    }

    private clearFields(): void {
        this.share = null;
        this.filteredShares = [];
        this.date = DateUtils.currentDate();
        this.time = DateUtils.currentTime();
        this.quantity = null;
        this.price = null;
        this.fee = null;
        this.note = "";
        this.share = null;
        this.nkd = null;
        this.facevalue = null;
        this.moneyAmount = null;
    }

    private onShareClear(): void {
        this.price = "";
        this.nkd = "";
        this.facevalue = "";
        this.filteredShares = [];
    }

    private async setTradeFields(): Promise<void> {
        await this.setShareFromTicker(this.data.tradeFields.ticker);
        this.filteredShares = [this.share];

        this.tradeId = this.data.tradeId;
        this.editedMoneyTradeId = this.data.editedMoneyTradeId;
        this.date = TradeUtils.getDateString(this.data.tradeFields.date);
        this.time = TradeUtils.getTimeString(this.data.tradeFields.date);
        this.quantity = this.data.tradeFields.quantity;
        this.price = this.data.tradeFields.price;
        this.facevalue = TradeUtils.decimal(this.data.tradeFields.facevalue);
        this.nkd = TradeUtils.decimal(this.data.tradeFields.nkd);
        this.perOne = true;
        this.fee = TradeUtils.decimal(this.data.tradeFields.fee);
        this.note = this.data.tradeFields.note;
        this.keepMoney = this.data.tradeFields.keepMoney;
        this.moneyAmount = TradeUtils.decimal(this.data.tradeFields.moneyAmount, true);
        this.currency = this.data.tradeFields.currency;
    }

    private async setShareFromTicker(ticker: string): Promise<void> {
        if (this.assetType === AssetType.STOCK) {
            this.share = (await this.marketService.getStockInfo(ticker)).stock;
        } else if (this.assetType === AssetType.BOND) {
            this.share = (await this.marketService.getBondInfo(ticker)).bond;
        }
    }

    private async setEventFields(): Promise<void> {
        this.price = TradeUtils.decimal(this.data.eventFields.amount);
        this.currency = this.share.currency;
        this.quantity = this.data.eventFields.quantity;
        this.note = this.data.eventFields.note;
        this.perOne = this.data.eventFields.perOne;
    }

    private get shareTicker(): string {
        switch (this.assetType) {
            case AssetType.STOCK:
                return this.share ? this.share.ticker : null;
            case AssetType.BOND:
                return this.share ? (this.share as Bond).isin : null;
        }
        return null;
    }

    private get shareAssetType(): boolean {
        return this.assetType === AssetType.STOCK || this.assetType === AssetType.BOND;
    }

    private get bondTrade(): boolean {
        return this.assetType === AssetType.BOND && this.operation !== Operation.COUPON && this.operation !== Operation.AMORTIZATION;
    }

    private get moneyTrade(): boolean {
        return this.assetType === AssetType.MONEY;
    }

    private get calculationAssetType(): boolean {
        return this.operation === Operation.DIVIDEND;
    }

    private get total(): string {
        if (!this.isValid) {
            return null;
        }
        const total = TradeMap.TRADE_CLASSES[this.assetType.enumName][this.operation.enumName][TradeValue.TOTAL](this);
        return total;
    }

    private get totalWithoutFee(): string {
        if (!this.isValid) {
            return null;
        }
        const total = TradeMap.TRADE_CLASSES[this.assetType.enumName][this.operation.enumName][TradeValue.TOTAL_WF](this);
        return total;
    }

    private get isValid(): boolean {
        switch (this.assetType) {
            case AssetType.STOCK:
                return this.share && this.date && this.price && this.quantity > 0;
            case AssetType.BOND:
                return this.share && this.date && this.price && this.facevalue && this.quantity > 0;
            case AssetType.MONEY:
                return !!this.date && !!this.moneyAmount;
        }
        return false;
    }

    private get keepMoneyLabel(): string {
        const toPort = "Зачислить деньги";
        const fromPort = "Списать деньги";
        return Operation.BUY === this.operation || Operation.WITHDRAW === this.operation || Operation.LOSS === this.operation ? fromPort : toPort;
    }

    private get lotSizeHint(): string {
        return "указывается в штуках." + (this.share && this.assetType === AssetType.STOCK ? " 1 лот = " + this.share.lotsize + " шт." : "");
    }

    private get priceLabel(): string {
        return [Operation.AMORTIZATION, Operation.COUPON, Operation.DIVIDEND].includes(this.operation) ? "Начисление" : "Цена";
    }

    private get moneyResidual(): string {
        return (this.moneyResiduals as any)[this.getCurrency()];
    }

    private get keepMoneyDisabled(): boolean {
        return this.assetType === AssetType.MONEY && [Operation.DEPOSIT, Operation.WITHDRAW].includes(this.operation);
    }

    private get keepMoney(): boolean {
        return this.keepMoneyValue || this.keepMoneyDisabled;
    }

    private set keepMoney(newValue: boolean) {
        this.keepMoneyValue = newValue;
    }

    // tslint:disable
    getShare(): Share {
        return this.share;
    }

    getDate(): string {
        const time = DateUtils.isCurrentDate(DateUtils.parseDate(this.date)) ? DateUtils.currentTime() : "12:00";
        return this.portfolioProModeEnabled ? `${this.date} ${this.time}` : `${this.date} ${time}`;
    }

    getQuantity(): number {
        return this.quantity;
    }

    getPrice(): string {
        return this.price;
    }

    getFacevalue(): string {
        return this.facevalue;
    }

    getNkd(): string {
        return this.nkd;
    }

    getFee(): string {
        return this.fee;
    }

    getNote(): string {
        return this.note;
    }

    isKeepMoney(): boolean {
        return this.keepMoney;
    }

    isPerOne(): boolean {
        return this.perOne;
    }

    getMoneyAmount(): string {
        return this.moneyAmount;
    }

    getCurrency(): string {
        return this.assetType === AssetType.MONEY ? this.moneyCurrency : this.currency;
    }

    // tslint:enable
}

export type TradeDialogData = {
    store: MainStore,
    router: VueRouter,
    tradeId?: string,
    editedMoneyTradeId?: string,
    tradeFields?: TradeFields,
    share?: Share,
    ticker?: string,
    quantity?: number,
    eventFields?: EventFields,
    operation?: Operation,
    assetType?: AssetType,
    moneyCurrency?: string
};
