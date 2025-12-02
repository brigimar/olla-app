// ProducerOnboardingPage.tsx
'use client';

import React, { useState, useCallback, useRef } from 'react';
import {
  User,
  Phone,
  MapPin,
  Camera,
  DollarSign,
  Trash2,
  Soup,
  PlusCircle,
  CheckCircle,
  UploadCloud,
} from 'lucide-react';

// TIPOS
type MenuItem = {
  tempId: string;
  name: string;
  price_cents: number | null;
  photoFile: File | null;
  photoUrl: string | null;
  description: string;
};

type ProducerData = {
  name: string;
  phone: string;
  neighborhood: string;
  dniPhoto: File | null;
};

// COMPONENTES AUXILIARES
const FormInput: React.FC<{
  label: string;
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  placeholder?: string;
  error?: string;
}> = ({ label, id, icon: Icon, value, onChange, type = 'text', placeholder, error }) => (
  <div className="mb-4">
    <label htmlFor={id} className="block text-sm font-medium text-gray-700">
      {label}
    </label>
    <div className="mt-1 relative rounded-md shadow-sm">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Icon className="h-5 w-5 text-gray-400" aria-hidden="true" />
      </div>
      <input
        type={type}
        id={id}
        value={value ?? ''}
        onChange={onChange}
        placeholder={placeholder}
        className={`focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-lg p-3 ${error ? 'border-red-500 ring-red-500' : ''}`}
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
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files.length > 0) {
      onFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFileChange(e.target.files?.[0] || null);
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div
        className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-400 transition-colors cursor-pointer"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <div className="space-y-1 text-center">
          <UploadCloud className="mx-auto h-8 w-8 text-gray-400" />
          <p className="text-sm text-gray-600">
            {file ? file.name : 'Arrastra o haz click para subir un archivo'}
          </p>
          <p className="text-xs text-gray-500">PNG, JPG, hasta 1MB</p>
          {file && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onFileChange(null);
              }}
              className="text-red-500 hover:text-red-700 text-xs mt-1 block w-full"
            >
              Quitar archivo
            </button>
          )}
        </div>
        <input
          ref={inputRef}
          id={id}
          name={id}
          type="file"
          className="sr-only"
          onChange={handleChange}
          accept="image/*"
        />
      </div>
    </div>
  );
};

// Resto del código (MenuItemForm y ProducerOnboardingPage) se mantiene igual,
// solo asegurate de reemplazar cualquier uso de URL.revokeObjectURL con photoUrl válido.
// Además, todos los iconos se tipan como React.ComponentType<{ className?: string }>

export default ProducerOnboardingPage;
