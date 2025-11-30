import React, { useState, useCallback } from 'react';
import { User, Phone, MapPin, Camera, DollarSign, Trash2, Soup, PlusCircle, CheckCircle, UploadCloud } from 'lucide-react';

// --- TIPOS DE DATOS ---
type MenuItem = {
  tempId: string; // Para manejar la UI antes de guardar en DB
  name: string;
  price_cents: number | '';
  photoFile: File | null;
  photoUrl: string | null; // Simulación de URL tras la subida
  description: string;
};

type ProducerData = {
  name: string;
  phone: string;
  neighborhood: string;
  dniPhoto: File | null;
};

// --- COMPONENTES AUXILIARES ---

const FormInput: React.FC<{
  label: string;
  id: string;
  icon: React.ElementType;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  placeholder?: string;
  error?: string;
}> = ({ label, id, icon: Icon, value, onChange, type = 'text', placeholder, error }) => (
  <div className="mb-4">
    <label htmlFor={id} className="block text-sm font-medium text-gray-700">{label}</label>
    <div className="mt-1 relative rounded-md shadow-sm">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Icon className="h-5 w-5 text-gray-400" aria-hidden="true" />
      </div>
      <input
        type={type}
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-lg p-3 ${
          error ? 'border-red-500 ring-red-500' : ''
        }`}
      />
    </div>
    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
  </div>
);

const FileUploader: React.FC<{
  label: string;
  id: string;
  file: File | null;
  onFileChange: (file: File | null) => void;
  required?: boolean;
}> = ({ label, id, file, onFileChange, required = false }) => {
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileChange(e.target.files[0]);
    } else {
      onFileChange(null);
    }
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label} {required && <span className="text-red-500">*</span>}</label>
      <div
        className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-400 transition-colors cursor-pointer"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => document.getElementById(id)?.click()}
      >
        <div className="space-y-1 text-center">
          <UploadCloud className="mx-auto h-8 w-8 text-gray-400" />
          <div className="flex text-sm text-gray-600">
            <p className="pl-1">
              {file ? file.name : 'Arrastra o haz click para subir un archivo'}
            </p>
          </div>
          <p className="text-xs text-gray-500">PNG, JPG, hasta 1MB</p>
          {file && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onFileChange(null); }}
              className="text-red-500 hover:text-red-700 text-xs mt-1 block w-full"
            >
              Quitar archivo
            </button>
          )}
        </div>
        <input id={id} name={id} type="file" className="sr-only" onChange={handleChange} accept="image/*" />
      </div>
    </div>
  );
};

const MenuItemForm: React.FC<{
  item: MenuItem;
  onChange: (updatedItem: MenuItem) => void;
  onRemove: () => void;
}> = ({ item, onChange, onRemove }) => {

  const handleFileChange = useCallback((file: File | null) => {
    onChange({ ...item, photoFile: file, photoUrl: file ? URL.createObjectURL(file) : null });
  }, [item, onChange]);

  return (
    <div className="p-4 border border-gray-200 rounded-xl bg-white shadow-sm mb-4">
      <div className="flex justify-between items-start mb-3 border-b pb-2">
        <h4 className="font-semibold text-gray-800 flex items-center"><Soup className="w-4 h-4 mr-2" /> Ítem de Menú</h4>
        <button
          type="button"
          onClick={onRemove}
          className="text-red-500 hover:text-red-700 transition-colors"
          title="Eliminar Plato"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <FormInput
            id={`dish-name-${item.tempId}`}
            label="Nombre del Plato"
            icon={Soup}
            value={item.name}
            onChange={(e) => onChange({ ...item, name: e.target.value })}
            placeholder="Ej: Milanesa Napolitana"
          />
        </div>
        <div>
          <FormInput
            id={`dish-price-${item.tempId}`}
            label="Precio (ARS)"
            icon={DollarSign}
            value={item.price_cents === '' ? '' : (item.price_cents / 100).toFixed(2)}
            onChange={(e) => {
              const value = parseFloat(e.target.value);
              onChange({ ...item, price_cents: isNaN(value) ? '' : Math.round(value * 100) });
            }}
            type="number"
            placeholder="12.50"
          />
        </div>
      </div>

      <div className="mb-4">
        <label htmlFor={`dish-desc-${item.tempId}`} className="block text-sm font-medium text-gray-700">Descripción</label>
        <textarea
          id={`dish-desc-${item.tempId}`}
          rows={2}
          value={item.description}
          onChange={(e) => onChange({ ...item, description: e.target.value })}
          placeholder="Describe los ingredientes y preparación..."
          className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-3 sm:text-sm"
        />
      </div>

      <FileUploader
        id={`dish-photo-${item.tempId}`}
        label="Foto del Plato"
        file={item.photoFile}
        onFileChange={handleFileChange}
      />
      {item.photoUrl && (
        <div className="mt-2">
          <img src={item.photoUrl} alt="Vista previa del plato" className="w-32 h-32 object-cover rounded-lg shadow-md" />
        </div>
      )}
    </div>
  );
};


// --- COMPONENTE PRINCIPAL ---
const ProducerOnboardingPage = () => {
  const [producer, setProducer] = useState<ProducerData>({
    name: '',
    phone: '',
    neighborhood: '',
    dniPhoto: null,
  });
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Genera un ID temporal para las keys de React
  const generateTempId = () => `item-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  const handleProducerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setProducer(prev => ({ ...prev, [id]: value }));
    // Limpieza de error en tiempo real
    if (errors[id]) setErrors(prev => ({ ...prev, [id]: '' }));
  };

  const handleDniPhotoChange = useCallback((file: File | null) => {
    setProducer(prev => ({ ...prev, dniPhoto: file }));
    if (errors.dniPhoto) setErrors(prev => ({ ...prev, dniPhoto: '' }));
  }, [errors]);

  const handleMenuItemChange = useCallback((tempId: string, updatedItem: MenuItem) => {
    setMenuItems(prev =>
      prev.map(item => (item.tempId === tempId ? updatedItem : item))
    );
  }, []);

  const addMenuItem = () => {
    setMenuItems(prev => [
      ...prev,
      {
        tempId: generateTempId(),
        name: '',
        price_cents: '',
        photoFile: null,
        photoUrl: null,
        description: '',
      },
    ]);
  };

  const removeMenuItem = (tempId: string) => {
    setMenuItems(prev => prev.filter(item => item.tempId !== tempId));
  };

  // --- VALIDACIÓN SIMPLE ---
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!producer.name.trim()) newErrors.name = 'El nombre es obligatorio.';
    if (!producer.phone.match(/^\d{8,15}$/)) newErrors.phone = 'El celular debe tener entre 8 y 15 dígitos.';
    if (!producer.neighborhood.trim()) newErrors.neighborhood = 'El barrio es obligatorio.';
    if (!producer.dniPhoto) newErrors.dniPhoto = 'La foto del DNI es obligatoria.';

    // Validación de menú (al menos un ítem completo)
    const validMenuItems = menuItems.filter(item =>
      item.name.trim() &&
      item.price_cents !== '' &&
      item.price_cents > 0 &&
      item.description.trim()
    );

    if (validMenuItems.length === 0) {
      newErrors.menuItems = 'Debes añadir y completar al menos un plato del menú.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // --- SIMULACIÓN DE GUARDADO (RPC/Supabase) ---
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(false);

    if (!validateForm()) {
      alert('Por favor, completa los campos requeridos y revisa tu menú.');
      return;
    }

    setIsSaving(true);
    console.log("Datos del Productor:", producer);
    console.log("Ítems de Menú:", menuItems);

    try {
      // 1. Simulación de subida de archivos a Supabase Storage (DNI y fotos del menú)
      console.log("[Supabase Storage] Subiendo fotos...");
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simular subida

      // 2. Simulación de RPC/Insert a Supabase DB
      // const { data, error } = await supabase.rpc('onboard_producer', { producer_data: producer, menu_data: menuItems });
      console.log("[Supabase DB] Insertando datos del productor y menú...");
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simular inserción

      setSaveSuccess(true);
      // Redirigir o limpiar formulario aquí
      setProducer({ name: '', phone: '', neighborhood: '', dniPhoto: null });
      setMenuItems([]);

    } catch (error) {
      console.error("Error al guardar en Supabase:", error);
      alert('Ocurrió un error al intentar guardar los datos. Intenta nuevamente.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans p-4 sm:p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl p-6 sm:p-10">
        <header className="mb-8 border-b pb-4">
          <h1 className="text-3xl font-extrabold text-indigo-700">¡Bienvenido, Productor!</h1>
          <p className="text-gray-500 mt-1">Completa el formulario para empezar a vender tus platos caseros.</p>
        </header>

        <form onSubmit={handleSave}>
          
          {/* SECCIÓN 1: DATOS DEL PRODUCTOR */}
          <section className="mb-10 p-6 bg-indigo-50 rounded-xl border border-indigo-200">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
              <User className="w-5 h-5 mr-2" /> Datos Personales y Contacto
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                id="name"
                label="Nombre Completo o Nombre de la Cocina"
                icon={User}
                value={producer.name}
                onChange={handleProducerChange}
                error={errors.name}
              />
              <FormInput
                id="phone"
                label="Número de Celular (WhatsApp)"
                icon={Phone}
                value={producer.phone}
                onChange={handleProducerChange}
                placeholder="Ej: 1155551234"
                type="tel"
                error={errors.phone}
              />
            </div>
            
            <FormInput
              id="neighborhood"
              label="Barrio / Localidad de Cocina"
              icon={MapPin}
              value={producer.neighborhood}
              onChange={handleProducerChange}
              placeholder="Ej: Palermo, San Isidro, etc."
              error={errors.neighborhood}
            />

            <h3 className="text-lg font-semibold text-gray-700 mt-6 mb-2">Documentación</h3>
            <FileUploader
              id="dniPhoto"
              label="Foto del Frente del DNI (Solo para verificación)"
              file={producer.dniPhoto}
              onFileChange={handleDniPhotoChange}
              required
            />
            {errors.dniPhoto && <p className="mt-1 text-xs text-red-600">{errors.dniPhoto}</p>}

          </section>

          {/* SECCIÓN 2: MENÚ DEL DÍA */}
          <section className="mb-10 p-6 bg-white rounded-xl shadow-lg border">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
              <Camera className="w-5 h-5 mr-2" /> Menú del Día y Precios
            </h2>

            {menuItems.map((item, index) => (
              <MenuItemForm
                key={item.tempId}
                item={item}
                onChange={(updatedItem) => handleMenuItemChange(item.tempId, updatedItem)}
                onRemove={() => removeMenuItem(item.tempId)}
              />
            ))}

            <button
              type="button"
              onClick={addMenuItem}
              className="w-full flex items-center justify-center py-2 px-4 border border-indigo-300 rounded-lg shadow-sm text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors mt-4"
            >
              <PlusCircle className="w-5 h-5 mr-2" /> Agregar Otro Plato
            </button>
            {errors.menuItems && <p className="mt-3 text-sm text-red-600 text-center font-medium">{errors.menuItems}</p>}

          </section>

          {/* MENSAJES Y BOTÓN FINAL */}
          {saveSuccess && (
            <div className="p-4 mb-6 bg-green-100 border border-green-400 text-green-700 rounded-lg flex items-center font-semibold">
              <CheckCircle className="w-5 h-5 mr-2" />
              ¡Datos enviados con éxito! Te contactaremos pronto.
            </div>
          )}

          <button
            type="submit"
            disabled={isSaving}
            className={`w-full flex items-center justify-center font-bold py-3 px-6 rounded-xl transition-colors shadow-lg ${
              isSaving
                ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            {isSaving ? 'Guardando información...' : 'Guardar y Enviar Solicitud'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProducerOnboardingPage;
