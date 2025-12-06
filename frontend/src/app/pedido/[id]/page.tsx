export default function PedidoPage({ params }: { params: { id: string } }) {
  return (
    <div>
      <h1>Pedido {params.id}</h1>
      {/* contenido */}
    </div>
  );
}
