// frontend/src/app/pedido/[id]/page.tsx (fragmento clave)
{order.contact_revealed ? (
  <div className="bg-green-100 p-8 rounded-2xl">
    <p className="text-2xl font-bold">{order.producer_address}</p>
    <a href={`tel:${order.producer_phone}`} className="btn btn-success text-2xl">
      Llamar a {order.producer_name}
    </a>
  </div>
) : (
  <div className="bg-yellow-100 p-8 rounded-2xl text-center">
    <p className="text-xl font-bold">
      La dirección y teléfono aparecen automáticamente cuando el pago se acredite 
      y 30 minutos antes de retirar ❤️
    </p>
  </div>
)}