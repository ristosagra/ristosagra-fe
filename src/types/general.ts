//reservationId: prenotazione (online) da sistemare sul tavolo
export type ModalType = {
  open: boolean;
  tableId: string;
  reservationId?: string;
};
