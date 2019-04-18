import {Inject} from "typescript-ioc";
import Component from "vue-class-component";
import {SnotifyToast} from "vue-snotify";
import {namespace} from "vuex-class/lib/bindings";
import * as versionConfig from "../../version.json";
import {AddTradeDialog} from "../components/dialogs/addTradeDialog";
import {FeedbackDialog} from "../components/dialogs/feedbackDialog";
import {NotificationUpdateDialog} from "../components/dialogs/notificationUpdateDialog";
import {ErrorHandler} from "../components/errorHandler";
import {PortfolioSwitcher} from "../components/portfolioSwitcher";
import {ShowProgress} from "../platform/decorators/showProgress";
import {BtnReturn} from "../platform/dialogs/customDialog";
import {Storage} from "../platform/services/storage";
import {ClientInfo, ClientService} from "../services/clientService";
import {StoreKeys} from "../types/storeKeys";
import {Portfolio} from "../types/types";
import {UiStateHelper} from "../utils/uiStateHelper";
import {MutationType} from "../vuex/mutationType";
import {StoreType} from "../vuex/storeType";
import {UI} from "./ui";

const MainStore = namespace(StoreType.MAIN);

@Component({
    // language=Vue
    template: `
        <v-app id="inspire" light>
            <vue-snotify></vue-snotify>
            <error-handler></error-handler>
            <template v-if="!loading && !loggedIn && !externalAuth">
                <v-content>
                    <v-container fluid fill-height>
                        <v-layout align-center justify-center>
                            <v-flex xs12 sm8 md4>
                                <v-card class="elevation-12">
                                    <v-toolbar color="primary">
                                        <v-toolbar-title>Вход</v-toolbar-title>
                                        <v-spacer></v-spacer>
                                    </v-toolbar>
                                    <v-card-text>
                                        <v-form>
                                            <v-text-field prepend-icon="person" name="login" label="Имя пользователя" type="text" required
                                                          v-model="username"></v-text-field>
                                            <v-text-field id="password" prepend-icon="lock" name="password" label="Пароль" required type="password"
                                                          v-model="password" @keydown.enter="login"></v-text-field>
                                        </v-form>
                                    </v-card-text>
                                    <v-card-actions>
                                        <v-spacer></v-spacer>
                                        <v-btn color="primary" @click="login">Вход</v-btn>
                                    </v-card-actions>
                                </v-card>
                            </v-flex>
                        </v-layout>
                    </v-container>
                </v-content>
            </template>

            <template v-if="!loading && (loggedIn || externalAuth)">
                <v-navigation-drawer disable-resize-watcher stateless app class="sidebar" v-model="drawer" :mini-variant="mini" width="320">
                    <div>
                        <v-layout class="pt-3" align-center>
                            <v-layout @click="mini = !mini" class="mini-menu-width" justify-center>
                                <img src="img/sidebar/logo.svg" alt="">
                            </v-layout>
                            <portfolio-switcher></portfolio-switcher>
                        </v-layout>
                        <v-layout>
                            <v-layout column justify-space-between align-center class="mini-menu-width">
                                <div>
                                    <v-btn @click.stop="openDialog" fab dark small color="indigo" depressed class="add-btn-menu">
                                        <v-icon dark>add</v-icon>
                                    </v-btn>
                                </div>
                            </v-layout>
                            <v-layout column class="wrap-list-menu">
                                <div v-for="item in mainSection">
                                    <template v-if="item.subMenu">
                                        <v-menu transition="slide-y-transition" bottom left class="menu-item-list" nudge-bottom="48">
                                            <v-list-tile slot="activator">
                                                <v-list-tile-title>{{ item.title }}</v-list-tile-title>
                                            </v-list-tile>
                                            <v-list-tile active-class="active-link" v-for="subItem in item.subMenu" :key="subItem.action"
                                                    :to="{name: subItem.action, params: item.params}">
                                            <v-list-tile-content>
                                                <v-list-tile-title>{{ subItem.title }}</v-list-tile-title>
                                            </v-list-tile-content>
                                        </v-list-tile>
                                        </v-menu>
                                    </template>
                                    <v-list-tile active-class="active-link" class="sidebar-list-item" v-else :key="item.action"
                                                 :to="{path: item.path, name: item.action, params: item.params}">
                                        <v-list-tile-content>
                                            <v-list-tile-title>{{ item.title }}</v-list-tile-title>
                                        </v-list-tile-content>
                                    </v-list-tile>
                                </div>
                            </v-layout>
                        </v-layout>
                    </div>
                    <v-layout>
                        <v-layout class="mini-menu-width" align-center justify-end column>
                            <div>
                                <img src="img/sidebar/settings.svg" alt="">
                            </div>
                            <div class="mt-4 mb-3">
                                <img src="img/sidebar/account.svg" alt="">
                            </div>
                        </v-layout>
                    </v-layout>
                </v-navigation-drawer>
                <v-content>
                    <vue-scroll :ops="horizontalScrollConfig">
                        <div class="wrapper-for-scroll-content">
                            <v-container fluid class="paddT0">
                                <v-slide-y-transition mode="out-in">
                                    <!--<keep-alive :include="cachedPages">-->
                                    <router-view></router-view>
                                    <!--</keep-alive>-->
                                </v-slide-y-transition>
                            </v-container>
                            <v-footer color="#f7f9fb" class="footer-app">
                                <v-layout class="footer-app-wrap-content" wrap align-center justify-space-between>
                                    <div class="footer-app-wrap-content__text"><i class="far fa-copyright"></i> {{ copyrightInfo }}</div>

                                    <div>
                                        <v-tooltip content-class="custom-tooltip-wrap" top>
                                            <a slot="activator"
                                               class="footer-app-wrap-content__text email-btn"
                                               @click.stop="openFeedBackDialog"><span>Обратная связь</span> <i class="fas fa-envelope"></i>
                                            </a>
                                            <span class="footer-app-wrap-content__text">Напишите нам</span>
                                        </v-tooltip>

                                        <v-tooltip content-class="custom-tooltip-wrap" top>
                                            <a slot="activator" class="footer-app-wrap-content__text decorationNone" href="https://telegram.me/intelinvestSupportBot">
                                                <span>Telegram</span> <i class="fab fa-telegram"></i>
                                            </a>
                                            <span class="footer-app-wrap-content__text">Оперативная связь с нами</span>
                                        </v-tooltip>
                                    </div>
                                </v-layout>
                            </v-footer>
                        </div>
                    </vue-scroll>
                </v-content>
            </template>
        </v-app>`,
    components: {PortfolioSwitcher, ErrorHandler, FeedbackDialog}
})
export class AppFrame extends UI {

    @Inject
    private localStorage: Storage;
    @Inject
    private clientService: ClientService;
    @MainStore.Getter
    private clientInfo: ClientInfo;
    @MainStore.Getter
    private portfolio: Portfolio;

    @MainStore.Action(MutationType.SET_CLIENT_INFO)
    private loadUser: (clientInfo: ClientInfo) => Promise<void>;

    @MainStore.Action(MutationType.SET_CURRENT_PORTFOLIO)
    private setCurrentPortfolio: (id: string) => Promise<Portfolio>;

    @MainStore.Action(MutationType.RELOAD_PORTFOLIO)
    private reloadPortfolio: (id: number) => Promise<void>;

    @MainStore.Mutation(MutationType.CHANGE_SIDEBAR_STATE)
    private changeSideBarState: (sideBarState: boolean) => void;

    private username: string = null;

    private password: string = null;

    /**
     * Переменная используется только для удобства локальной разработки при тестировании с отдельным приложением лэндинга
     * Ддля PRODUCTION режима используется внешняя аутентификация с лэндинга
     */
    private externalAuth = false;
    private loggedIn = false;

    /* Пользователь уведомлен об обновлениях */
    private isNotifyAccepted = false;

    /**
     * Названия кэшируемых компонентов (страниц). В качестве названия необходимо указывать либо имя файла компонента (это его name)
     * или название компонента если он зарегистрирован в uiRegistry через UI.component.
     * Необходимые действия выполняются в хуках activated и deactivated кешируемого компонента.
     * @type {string[]}
     */
    private cachedPages = ["PortfolioPage"];

    private drawer = true;
    /* Конфиг для горизонтального скролла страницы */
    private horizontalScrollConfig: any = {
        bar: {
            keepShow: true
        }
    };

    private mini = true;
    private loading = false;

    private mainSection: NavBarItem[] = [
        {title: "Портфель", action: "portfolio", icon: "fas fa-briefcase"},
        {title: "Сделки", action: "trades", icon: "fas fa-list-alt"},
        {title: "События", action: "events", icon: "far fa-calendar-check"},
        {title: "Дивиденды", action: "dividends", icon: "far fa-calendar-plus"},
        {title: "Составной портфель", action: "combined-portfolio", icon: "fas fa-object-group"},
        // Закомментировано для первого релиза
        // {title: "Котировки", action: "quotes", icon: "fas fa-chart-area"},
        {title: "Информация", path: "/share-info", icon: "fas fa-info"},
        {title: "Настройки", icon: "fas fa-cog", subMenu: [
                {title: "Управление портфелями", action: "portfolio-settings", icon: "fas fa-suitcase"},
                {title: "Импорт сделок", action: "import", icon: "fas fa-download"},
                {title: "Экспорт сделок", action: "export", icon: "fas fa-upload"},
                {title: "Тарифы", action: "tariffs", icon: "fas fa-credit-card"},
                {title: "Промокоды", action: "promo-codes", icon: "fas fa-heart"},
                {title: "Уведомления", action: "notifications", icon: "fas fa-bell"}
            ]
        },
        {title: "Профиль", action: "profile", icon: "fas fa-user"},
        {title: "Справка", action: "help", icon: "far fa-question-circle"},
        {title: "Выход", action: "logout", icon: "exit_to_app"}
    ];

    @ShowProgress
    async created(): Promise<void> {
        if (this.localStorage.get(StoreKeys.TOKEN_KEY, null)) {
            await this.startup();
        }
        // если удалось восстановить state, значит все уже загружено
        if (this.$store.state[StoreType.MAIN].clientInfo || this.$route.meta.public) {
            this.isNotifyAccepted = UiStateHelper.lastUpdateNotification === NotificationUpdateDialog.DATE;
            this.loggedIn = true;
            if (!this.isNotifyAccepted) {
                this.$snotify.info("Мы улучшили сервис для Вас, ознакомьтесь с обновлениями", {
                    closeOnClick: false,
                    timeout: 0,
                    buttons: [{
                        text: "Подробнее", action: async (toast: SnotifyToast): Promise<void> => {
                            this.$snotify.remove(toast.id);
                            await this.openNotificationUpdateDialog();
                        }
                    }]
                });

            }
        }
    }

    private async startup(): Promise<void> {
        this.loading = true;
        try {
            const client = await this.clientService.getClientInfo();
            await this.loadUser({token: this.localStorage.get(StoreKeys.TOKEN_KEY, null), user: client});
            await this.setCurrentPortfolio(this.$store.state[StoreType.MAIN].clientInfo.user.currentPortfolioId);
        } catch (e) {
            throw e;
        } finally {
            this.loading = false;
        }
    }

    private async login(): Promise<void> {
        if (!this.username || !this.password) {
            this.$snotify.warning("Заполните поля");
            return;
        }
        try {
            const clientInfo = await this.clientService.login({username: this.username, password: this.password});
            await this.loadUser(clientInfo);
        } catch (e) {
            console.error("Ошибка при входе", e);
            this.$snotify.error("Ошибка при входе");
            return;
        }
        await this.setCurrentPortfolio(this.$store.state[StoreType.MAIN].clientInfo.user.currentPortfolioId);
        this.loggedIn = true;
    }

    private async openDialog(): Promise<void> {
        const result = await new AddTradeDialog().show({store: this.$store.state[StoreType.MAIN], router: this.$router});
        if (result) {
            await this.reloadPortfolio(this.portfolio.id);
        }
    }

    private async openNotificationUpdateDialog(): Promise<void> {
        const dlgReturn = await new NotificationUpdateDialog().show();
        if (dlgReturn === BtnReturn.YES) {
            UiStateHelper.lastUpdateNotification = NotificationUpdateDialog.DATE;
            this.isNotifyAccepted = true;
        } else if (dlgReturn === BtnReturn.SHOW_FEEDBACK) {
            await new FeedbackDialog().show(this.clientInfo);
        }
    }

    private async openFeedBackDialog(): Promise<void> {
        await new FeedbackDialog().show(this.clientInfo);
    }

    private togglePanel(): void {
        this.mini = !this.mini;
        this.changeSideBarState(this.mini);
    }

    private get actualYear(): string {
        return String(new Date().getFullYear());
    }

    private get copyrightInfo(): string {
        return `Intelligent Investments 2012-${this.actualYear} версия ${versionConfig.version} сборка ${versionConfig.build} от ${versionConfig.date}`;
    }
}

export type NavBarItem = {
    title: string,
    /** routing, для корневых элементов может не заполнен */
    action?: string,
    path?: string,
    icon: string,
    active?: boolean,
    subMenu?: NavBarItem[],
    params?: { [key: string]: string }
};
