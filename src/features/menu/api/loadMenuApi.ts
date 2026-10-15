import { IS_MOCKING } from "../../../constant/env";
import { MenuService } from "./menu";

//Servizio reale o finto: il finto (con Faker) si carica solo con VITE_MOCKING
export const loadMenuApi: () => Promise<typeof MenuService> = IS_MOCKING
  ? () => import("../mock/menu").then((m) => m.fakeMenuApi)
  : () => Promise.resolve(MenuService);
