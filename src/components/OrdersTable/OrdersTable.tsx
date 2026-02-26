import { orders } from "../../mock/fakeApiOrder";

export default function OrdersTable() {
  return (
    <div className="max-w-4xl mx-auto bg-white shadow rounded p-6">
      <h2 className="text-2xl font-bold mb-4">Prenotazioni</h2>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">ID</th>
            <th className="border p-2">Cliente</th>
            <th className="border p-2">Ordine</th>
            <th className="border p-2">Stato</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} className="text-center">
              <td className="border p-2">{o.id}</td>
              <td className="border p-2">{o.customer}</td>
              <td className="border p-2">{o.items.join(", ")}</td>
              <td className="border p-2">{o.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
