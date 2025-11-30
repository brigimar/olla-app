import React, { useState, useMemo, useEffect } from 'react';
import { Truck, Home, MapPin, CheckCircle, AlertTriangle, MessageSquare, CreditCard } from 'lucide-react';

// --- DEFINICIONES DE TIPOS ---

type OrderItem = {
  dish_id: number;
  name: string;
  quantity: number;
  price_cents: number; // Precio por unidad
};

type Order = {
  id: string;
  client_id: string;
  producer_id: number;
  items: OrderItem[];
  subtotal_cents: number;
  status: 'pending' | 'paid' | 'delivered';
};

type DeliveryOption = 'retiro' | 'courier_near' | 'courier_mid';

// --- CONSTANTES Y UTILIDADES ---

const DELIVERY_FEES_CENTS: Record<DeliveryOption, number> = {
  retiro: 0,
  courier_near: 50000, // $500.00 ARS (Cents)
  courier_mid: 100000, // $1000.00 ARS (Cents)
};

const SUGGESTED_TIPS = [0.10, 0.15]; // 10% y 15%

// Formatea los centavos a pesos argentinos
const formatPrice = (cents: number) => {
  return (cents / 100).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
};

// --- HOOK DE PEDIDO SIMULADO (Simula la interacción con Supabase RPCs) ---

const MOCK_ORDER: Order = {
  id: 'ORD-98765',
  client_id: 'user-abc',
  producer_id: 101,
  items: [
    { dish_id: 1, name: "Milanesa Napolitana", quantity: 2, price_cents: 125000 },
    { dish_id: 4, name: "Ñoquis de Papa", quantity: 1, price_cents: 110000 },
  ],
  subtotal_cents: 360000, // (2 * 1250) + (1 * 1100) = 3600 (cents: 360000)
  status: 'pending',
};

const useOrder = (orderId: string) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stockAvailable, setStockAvailable] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // 1. Simulación de Fetching de la Orden
  useEffect(() => {
    setIsLoading(true);
    setErrorMessage('');
    const timer = setTimeout(() => {
      if (orderId === MOCK_ORDER.id) {
        setOrder(MOCK_ORDER);
      } else {
        setErrorMessage('Pedido no encontrado.');
      }
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [orderId]);

  // 2. Simulación de RPC: Validación de Stock antes del Pago
  const validateStock = async (): Promise<boolean> => {
    // --- Lógica de la RPC de Supabase (Simulada) ---
    // La RPC real: SELECT * FROM check_and_reserve_stock(order_id)
    console.log(`[RPC] Validando stock para ${orderId}...`);
    
    // Simular que el stock puede fallar aleatoriamente la primera vez
    if (Math.random() < 0.2) {
      setStockAvailable(false);
      setErrorMessage('¡Stock agotado! Un plato se vendió antes de que pudieras pagar.');
      return false;
    }
    setStockAvailable(true);
    setErrorMessage('');
    return true;
  };

  return { order, isLoading, stockAvailable, errorMessage, validateStock };
};

// --- COMPONENTES DE UI ---

const MercadoPagoButton: React.FC<{ totalCents: number, orderId: string, onPaymentStart: () => void }> = ({ totalCents, orderId, onPaymentStart }) => {
  const handlePayment = async () => {
    onPaymentStart();
    console.log(`[Mercado Pago] Iniciando pago por ${formatPrice(totalCents)} para el pedido ${orderId}`);
    
    // --- Lógica Real (Simulada) ---
    // 1. Llamar a la RPC de Supabase (o endpoint de FastAPI) para crear la preferencia de MP
    // const { mp_init_point } = await supabase.rpc('create_mp_preference', { order_id: orderId, total_cents: totalCents });
    
    // 2. Redirigir al init_point de Mercado Pago
    // window.location.href = mp_init_point;
    
    // Simulación de éxito/redirección:
    alert(`Simulación de Pago: Serías redirigido a Mercado Pago para abonar ${formatPrice(totalCents)}.`);
  };

  return (
    <button
      onClick={handlePayment}
      className="w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-colors shadow-lg mt-6"
    >
      <CreditCard className="w-5 h-5 mr-3" /> Pagar con Mercado Pago {formatPrice(totalCents)}
    </button>
  );
};


const CheckoutPage: React.FC<{ params: { orderId: string } }> = ({ params }) => {
  const { orderId } = params;
  const { order, isLoading, stockAvailable, errorMessage, validateStock } = useOrder(orderId);

  const [deliveryType, setDeliveryType] = useState<DeliveryOption>('courier_near');
  const [selectedTip, setSelectedTip] = useState<number>(SUGGESTED_TIPS[0]);
  const [isProcessing, setIsProcessing] = useState(false);

  // --- CÁLCULOS CRÍTICOS ---
  const calculation = useMemo(() => {
    if (!order) return { deliveryFee: 0, tipAmount: 0, total: 0 };
    
    const subtotal = order.subtotal_cents;
    const deliveryFee = DELIVERY_FEES_CENTS[deliveryType];
    const tipAmount = Math.round(subtotal * selectedTip);
    
    const total = subtotal + deliveryFee + tipAmount;
    
    return { deliveryFee, tipAmount, total };
  }, [order, deliveryType, selectedTip]);

  const handlePaymentClick = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    
    const isStockOK = await validateStock();
    
    if (isStockOK && order) {
      // Iniciar el proceso de Mercado Pago
      console.log("Stock OK. Procediendo al pago...");
      // La función MercadoPagoButton manejará la RPC/redirección
    }
    setIsProcessing(false);
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><p className="text-xl text-indigo-600 animate-pulse">Cargando tu pedido...</p></div>;
  }

  if (errorMessage && !order) {
    return <div className="min-h-screen p-8 flex items-center justify-center bg-red-50"><p className="text-xl text-red-700 font-semibold flex items-center"><AlertTriangle className="w-6 h-6 mr-2" /> Error: {errorMessage}</p></div>;
  }

  if (!order) return null; // Debería ser manejado por el error anterior

  // --- Renderización ---
  return (
    <div className="min-h-screen bg-gray-50 font-sans p-4 sm:p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Encabezado del Checkout */}
        <div className="bg-indigo-600 p-6 sm:p-8 flex justify-between items-center">
          <h1 className="text-3xl font-extrabold text-white flex items-center">
            <CheckCircle className="w-7 h-7 mr-3" /> Confirmar Pedido {order.id}
          </h1>
          <span className="text-sm font-medium text-indigo-200">Productor: Lo de Rosa</span>
        </div>

        <div className="p-6 sm:p-8 grid lg:grid-cols-2 gap-8">
          
          {/* Columna 1: Resumen del Pedido y Selección de Envío */}
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">1. Resumen de la Orden</h2>
            
            {/* Lista de Items */}
            <div className="space-y-4 mb-6">
              {order.items.map(item => (
                <div key={item.dish_id} className="flex justify-between items-center border-b pb-2 last:border-b-0">
                  <div className="flex items-center">
                    <MessageSquare className="w-4 h-4 text-gray-500 mr-2" />
                    <span className="font-medium text-gray-900">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm text-gray-600">x{item.quantity}</span>
                    <span className="ml-4 font-semibold text-gray-800">{formatPrice(item.quantity * item.price_cents)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Subtotal */}
            <div className="flex justify-between font-semibold text-lg text-gray-800 pt-2 border-t border-dashed">
              <span>Subtotal</span>
              <span>{formatPrice(order.subtotal_cents)}</span>
            </div>

            {/* Selector de Envío */}
            <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-4 border-b pb-2">2. Tipo de Entrega</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <DeliveryOptionCard
                type="retiro"
                label="Retiro en Tienda"
                description="Gratis. Lo retiras en la puerta de la Abuela."
                icon={Home}
                feeCents={DELIVERY_FEES_CENTS['retiro']}
                selected={deliveryType === 'retiro'}
                onClick={() => setDeliveryType('retiro')}
              />
              <DeliveryOptionCard
                type="courier_near"
                label="Envío Cercano"
                description="Mensajería express (0-5 km)."
                icon={Truck}
                feeCents={DELIVERY_FEES_CENTS['courier_near']}
                selected={deliveryType === 'courier_near'}
                onClick={() => setDeliveryType('courier_near')}
              />
              <DeliveryOptionCard
                type="courier_mid"
                label="Envío Medio"
                description="Mensajería estándar (5-10 km)."
                icon={MapPin}
                feeCents={DELIVERY_FEES_CENTS['courier_mid']}
                selected={deliveryType === 'courier_mid'}
                onClick={() => setDeliveryType('courier_mid')}
              />
            </div>

            {/* Seleccionar Propina */}
            <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-4 border-b pb-2">3. Propina Sugerida</h2>
            <div className="flex space-x-3">
              {SUGGESTED_TIPS.map(tip => (
                <TipButton
                  key={tip}
                  percentage={tip}
                  amountCents={Math.round(order.subtotal_cents * tip)}
                  selected={selectedTip === tip}
                  onClick={() => setSelectedTip(tip)}
                />
              ))}
            </div>
          </div>

          {/* Columna 2: Totales y Pago */}
          <div className="bg-gray-50 p-6 rounded-xl shadow-inner h-fit">
            <h2 className="text-2xl font-bold text-indigo-700 mb-4 border-b border-indigo-200 pb-2">Tu Total</h2>

            <div className="space-y-3 text-gray-700">
              <SummaryRow label="Subtotal de Platos" value={formatPrice(order.subtotal_cents)} />
              <SummaryRow label="Costo de Envío" value={formatPrice(calculation.deliveryFee)} isHighlight={deliveryType !== 'retiro'} />
              <SummaryRow label={`Propina Sugerida (${(selectedTip * 100).toFixed(0)}%)`} value={formatPrice(calculation.tipAmount)} isHighlight={calculation.tipAmount > 0} />
            </div>

            <div className="border-t-2 border-indigo-300 pt-4 mt-4 flex justify-between items-end">
              <span className="text-2xl font-extrabold text-indigo-800">TOTAL A PAGAR</span>
              <span className="text-4xl font-extrabold text-indigo-800">{formatPrice(calculation.total)}</span>
            </div>

            {/* Mensajes de Validación y Botón */}
            <div className="mt-6">
              {!stockAvailable && errorMessage ? (
                <div className="p-3 bg-red-100 text-red-700 rounded-lg flex items-center text-sm">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  <span>{errorMessage}</span>
                </div>
              ) : stockAvailable && errorMessage ? (
                <div className="p-3 bg-yellow-100 text-yellow-700 rounded-lg flex items-center text-sm">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  <span>{errorMessage}</span>
                </div>
              ) : null}

              <button
                onClick={handlePaymentClick}
                disabled={isProcessing}
                className={`w-full flex items-center justify-center font-bold py-3 px-6 rounded-xl transition-colors shadow-lg mt-6 ${
                  isProcessing
                    ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                {isProcessing ? 'Verificando Stock...' : 'Proceder al Pago'}
              </button>
              
              {/* Solo se muestra el botón de MP real si el stock es OK */}
              {stockAvailable && !isProcessing && (
                <MercadoPagoButton 
                  totalCents={calculation.total} 
                  orderId={order.id} 
                  onPaymentStart={() => setIsProcessing(true)}
                />
              )}
              
              <p className="text-xs text-gray-500 mt-3 text-center">Al presionar "Proceder al Pago", se verifica la disponibilidad del stock.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- COMPONENTES AUXILIARES ---

const DeliveryOptionCard: React.FC<{
  type: DeliveryOption;
  label: string;
  description: string;
  icon: React.ElementType;
  feeCents: number;
  selected: boolean;
  onClick: () => void;
}> = ({ label, description, icon: Icon, feeCents, selected, onClick }) => (
  <button
    onClick={onClick}
    className={`p-4 border-2 rounded-xl text-left transition-all ${
      selected ? 'border-indigo-600 bg-indigo-50 shadow-md' : 'border-gray-200 hover:border-indigo-300'
    }`}
  >
    <div className="flex items-start">
      <Icon className={`w-5 h-5 mr-3 mt-1 ${selected ? 'text-indigo-600' : 'text-gray-500'}`} />
      <div>
        <h3 className={`font-semibold text-sm ${selected ? 'text-indigo-700' : 'text-gray-800'}`}>{label}</h3>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        <p className={`mt-1 text-sm font-bold ${feeCents === 0 ? 'text-green-600' : 'text-gray-900'}`}>
          {feeCents === 0 ? 'GRATIS' : formatPrice(feeCents)}
        </p>
      </div>
    </div>
  </button>
);

const TipButton: React.FC<{
  percentage: number;
  amountCents: number;
  selected: boolean;
  onClick: () => void;
}> = ({ percentage, amountCents, selected, onClick }) => (
  <button
    onClick={onClick}
    className={`py-2 px-4 border rounded-lg transition-all text-sm font-semibold w-1/2 ${
      selected ? 'bg-indigo-600 text-white shadow-md border-indigo-600' : 'bg-white text-indigo-600 border-indigo-300 hover:bg-indigo-50'
    }`}
  >
    {`${(percentage * 100).toFixed(0)}% (${formatPrice(amountCents)})`}
  </button>
);

const SummaryRow: React.FC<{ label: string; value: string; isHighlight?: boolean }> = ({ label, value, isHighlight = false }) => (
  <div className="flex justify-between">
    <span className={`${isHighlight ? 'font-semibold' : 'font-normal'} text-sm`}>{label}</span>
    <span className={`font-medium ${isHighlight ? 'text-indigo-700' : 'text-gray-800'}`}>{value}</span>
  </div>
);

export default CheckoutPage;
