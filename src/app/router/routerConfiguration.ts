import Vue, {PropType} from "vue";
import VueRouter, {Route} from "vue-router";
import {RouteConfig} from "vue-router/types/router";
import {Resolver} from "../../../typings/vue";
import {RouteMeta} from "../types/router/types";
import {MainPage, Event} from "../pages/mainPage";
import {EventPage} from "../pages/eventPage";


Vue.use(VueRouter);

/**
 * Класс отвечающий за создание роутингов и инициализацию роутера
 */
export class RouterConfiguration {

    /** Экземпляр роутера */
    private static router: VueRouter;

    /**
     * Возвращает инициализированный экземпляр роутера
     * @returns {VueRouter} роутер
     */
    static getRouter(): VueRouter {
        if (!RouterConfiguration.router) {
            RouterConfiguration.router = new VueRouter({
                base: "/",
                routes: RouterConfiguration.createRoutes(),
                scrollBehavior: ((): any => ({x: 0, y: 0}))
            });
        }
        return RouterConfiguration.router;
    }

    private static createRoutes(): RouteConfig[] {
        return [
            {
                path: "*",
                redirect: "/main"
            },
            {
                name: "mainPage",
                path: "/main",
                component: MainPage
            },
            {
                name: "eventPage",
                path: "/event",
                component: EventPage,
                props: true
            }
        ];
    }
}
