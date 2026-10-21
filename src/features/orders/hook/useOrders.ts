import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { OrdersService } from "../api/orders";
import { IS_MOCKING } from "../../../constant/env";
import type {
  CartType,
  CashierOrder,
  NewOrder,
  Payment,
  TakeawaySettings,
} from "../types/orders";

//Servizio reale o finto: il finto (con Faker) si carica solo con VITE_MOCKING
const loadApi: () => Promise<typeof OrdersService> = IS_MOCKING
  ? () => import("../mock/orders").then((m) => m.fakeOrdersApi)
  : () => Promise.resolve(OrdersService);

//refetchInterval: ogni quanto si rileggono (la cucina più spesso, per le comande nuove)
export const useOrders = (refetchInterval = 30000) =>
  useQuery({
    queryKey: ["orders"],
    queryFn: async () => (await loadApi()).getOrders(),
    refetchInterval,
  });

//Invio di un nuovo ordine (sul posto o da asporto) dal cliente
export const useOrderNumber = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (order: NewOrder) => (await loadApi()).createOrder(order),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders"] }),
  });
};

//Ordine creato dalla cassa (cliente al bancone)
export const useCreateCashierOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (order: CashierOrder) =>
      (await loadApi()).createCashierOrder(order),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders"] }),
  });
};

export const useOrderPayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, paid }: Payment) =>
      (await loadApi()).updatePayment(id, paid),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders"] }),
  });
};

//Comanda pronta (o di nuovo da preparare) dalla cucina
export const useOrderReady = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ready }: { id: number; ready: boolean }) =>
      (await loadApi()).updateReady(id, ready),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders"] }),
  });
};

//Ritiro al banco: ordine consegnato (o di nuovo da consegnare)
export const useOrderDelivered = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, delivered }: { id: number; delivered: boolean }) =>
      (await loadApi()).updateDelivered(id, delivered),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["pickup-board"] });
    },
  });
};

//Numeri in preparazione e pronti (pubblico): per lo schermo Pronti e il telefono del cliente.
//enabled: solo se il ristorante usa il ritiro al banco
export const usePickupBoard = (enabled = true) =>
  useQuery({
    queryKey: ["pickup-board"],
    queryFn: async () => (await loadApi()).getPickupBoard(),
    refetchInterval: 5000,
    enabled,
  });

//Smistamento: dopo ogni azione si rileggono gli ordini (comande e "pronto" li calcola il backend)
const useKitchenMutation = <T>(run: (input: T) => Promise<unknown>) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: run,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders"] }),
  });
};

//Il capo cucina manda alcune righe di un ordine a una postazione
export const useSendToStation = () =>
  useKitchenMutation(
    async ({
      id,
      stationId,
      items,
    }: {
      id: number;
      stationId: string;
      items: number[];
    }) => (await loadApi()).sendToStation(id, stationId, items),
  );

//Il capo cucina ritira una comanda non ancora pronta: le sue righe tornano da smistare
export const useRecallTicket = () =>
  useKitchenMutation(
    async ({ id, ticketId }: { id: number; ticketId: string }) =>
      (await loadApi()).recallTicket(id, ticketId),
  );

//La postazione segna pronta la sua comanda (o la rimette da preparare)
export const useTicketReady = () =>
  useKitchenMutation(
    async ({
      id,
      ticketId,
      ready,
    }: {
      id: number;
      ticketId: string;
      ready: boolean;
    }) => (await loadApi()).updateTicketReady(id, ticketId, ready),
  );

//Modifica dei piatti di un ordine dalla cassa
export const useUpdateOrderItems = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, items }: { id: number; items: CartType[] }) =>
      (await loadApi()).updateItems(id, items),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders"] }),
  });
};

export const useTakeawaySettings = () =>
  useQuery({
    queryKey: ["takeaway-settings"],
    queryFn: async () => (await loadApi()).getTakeawaySettings(),
  });

export const useSaveTakeawaySettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (settings: TakeawaySettings) =>
      (await loadApi()).saveTakeawaySettings(settings),
    onSuccess: (saved) =>
      queryClient.setQueryData(["takeaway-settings"], saved),
  });
};
