import {Container} from "typescript-ioc";
import {ActionContext, Module} from "vuex";
import {HTTP} from "../platform/services/http";
import {Storage} from "../platform/services/storage";
import {PortfolioService} from "../services/portfolioService";
import {StoreKeys} from "../types/storeKeys";
import {ClientInfo, Portfolio} from "../types/types";
import {GetterType} from "./getterType";
import {MutationType} from "./mutationType";

/** Сервис работы с клиентом */
const portfolioService: PortfolioService = Container.get(PortfolioService);
/** Сервис работы с localStorage */
const localStorage: Storage = Container.get(Storage);

/** Состояния хранилища */
export class StateHolder {
    /** Информация о клиенте */
    clientInfo: ClientInfo = null;
    /** Текущий выбранный портфель */
    currentPortfolio: Portfolio = null;
    /** Версия стора */
    version = "1.0";
}

const Getters = {
    [GetterType.PORTFOLIO](state: StateHolder): Portfolio {
        return state.currentPortfolio;
    },
    [GetterType.CLIENT_INFO](state: StateHolder): ClientInfo {
        return state.clientInfo;
    }
};

/** Мутаторы хранилища */
const Mutations = {
    /** Мутатор проставлящий информацию о клиенте */
    [MutationType.SET_CLIENT_INFO](state: StateHolder, clientInfo: ClientInfo): void {
        state.clientInfo = clientInfo;
    },
    [MutationType.SET_CURRENT_PORTFOLIO](state: StateHolder, portfolio: Portfolio): void {
        state.currentPortfolio = portfolio;
    },
    [MutationType.RELOAD_PORTFOLIO](state: StateHolder, portfolio: Portfolio): void {
        state.currentPortfolio = portfolio;
    }
};

/** Действия хранилища */
const Actions = {
    /** Дейстие проставляющие информацию о клиенте */
    [MutationType.SET_CLIENT_INFO](context: ActionContext<StateHolder, void>, clientInfo: ClientInfo): void {
        localStorage.set(StoreKeys.TOKEN_KEY, clientInfo.token);
        HTTP.init();
        context.commit(MutationType.SET_CLIENT_INFO, clientInfo);
        console.log("ACTION SET USER", clientInfo, context);
    },
    [MutationType.SET_CURRENT_PORTFOLIO](context: ActionContext<StateHolder, void>, id: string): Promise<Portfolio> {
        portfolioService.setDefaultPortfolio(id).then();
        return new Promise<Portfolio>((resolve) => {
            portfolioService.getById(id).then((portfolio: Portfolio) => {
                console.log("ACTION SET PORTFOLIO", portfolio, context);
                context.commit(MutationType.SET_CURRENT_PORTFOLIO, portfolio);
                resolve(portfolio);
            });
        });
    },
    [MutationType.RELOAD_PORTFOLIO](context: ActionContext<StateHolder, void>, id: string): Promise<void> {
        return new Promise<void>((resolve) => {
            portfolioService.reloadPortfolio(id).then((portfolio: Portfolio) => {
                console.log("ACTION RELOAD_PORTFOLIO", portfolio, context);
                context.commit(MutationType.RELOAD_PORTFOLIO, portfolio);
                resolve();
            });
        });
    }
};

/**
 * Главный модуль хранилища
 */
export class MainStore implements Module<StateHolder, void> {
    namespaced = true;
    state: StateHolder;
    mutations = Mutations;
    getters = Getters;
    actions = Actions;

    constructor() {
        this.state = new StateHolder();
    }
}
