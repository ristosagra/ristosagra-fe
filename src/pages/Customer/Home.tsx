import { NotebookPen } from "lucide-react";
import { PagesCustomer, type PagesCustomerConst } from "../../constant/pages";
import { tokens } from "../../constant/tokens";

export const Home = ({
  setPage,
}: {
  setPage: React.Dispatch<React.SetStateAction<PagesCustomerConst>>;
}) => {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-6 p-6">
      <div
        style={{
          fontFamily: tokens.font.display,
        }}
        className="text-5xl leading-none text-center"
      >
        Benvenuto da{" "}
        <em style={{ color: tokens.brand.default }} className="italic">
          Ristosagra
        </em>
      </div>
      <p
        style={{
          color: tokens.text.secondary,
          fontSize: 15,
          textAlign: "center",
          maxWidth: 360,
        }}
      >
        Sfoglia il menù e aggiungi i piatti al carrello.
        <br />
        Quando sei pronto, invia il tuo ordine.
      </p>
      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
        <button onClick={() => setPage(PagesCustomer.MENU)}>
          <NotebookPen size={16} />
          Vai al menù
        </button>
      </div>
    </div>
  );
};
