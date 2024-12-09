import Vue from "vue";
import VueRouter from "vue-router";
import {RouteConfig} from "vue-router/types/router";
import { EventsPage } from "../pages/eventsPage";
import { AboutEventPage } from "../pages/aboutEventPage";

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
                redirect: "/events"
            },
            {
                name: "events",
                path: "/events",
                component: EventsPage,
                meta: {
                    title: "События",
                }
			},
			{
				name: 'aboutEvent',
				path: '/aboutEvent/:id',
				component: AboutEventPage,
				meta: {
					title: "Описание события"
				}
			}
        ];
    }
}
