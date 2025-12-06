'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ProducerSchema } from '@/shared/validation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import type { z } from 'zod'

type FormData = z.infer<typeof ProducerSchema>

export default function NegocioPage() {
  const router = useRouter()
  const supabase = createClient()

  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(ProducerSchema),
  })

  /** Cargar datos del usuario y del productor */
  const loadUserData = useCallback(async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        router.push('/onboarding/crear-cuenta')
        return
      }

      setUser(user)

      // Verificar progreso del onboarding
      const savedStage = localStorage.getItem('onboardingStage')
      if (savedStage && parseInt(savedStage) > 1) {
        router.push('/onboarding/platos')
        return
      }

      // Cargar datos existentes del productor
      const { data: existingProducer, error: producerError } = await supabase
        .from('producers')
        .select('*')
        .eq('id', user.id)
        .single()
        .maybeSingle()

      if (!producerError && existingProducer) {
        Object.entries({
          business_name: existingProducer.business_name,
          description: existingProducer.description || '',
          address: existingProducer.address,
          email: existingProducer.email || user.email || '',
          phone: existingProducer.phone || user.phone || '',
        }).forEach(([key, value]) => setValue(key as keyof FormData, value))

        if (existingProducer.logo_url) setLogoPreview(existingProducer.logo_url)
      } else {
        const meta = user.user_metadata || {}
        setValue('business_name', meta.business_name || '')
        setValue('email', user.email || meta.email || '')
        setValue('phone', user.phone || meta.phone || '')
      }
    } catch (err) {
      console.error(err)
      setError('Error cargando información del usuario.')
    } finally {
      setLoading(false)
    }
  }, [supabase, router, setValue])

  useEffect(() => {
    loadUserData()
  }, [loadUserData])

  /** Manejo de cambio de logo */
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Formato de imagen no soportado. Usa JPG, PNG o WEBP.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen es demasiado grande. Máximo 5MB.')
      return
    }

    setValue('logo', file)
    setError('')

    const reader = new FileReader()
    reader.onloadend = () => setLogoPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  /** Subida de logo a Supabase Storage */
  const uploadLogo = async (file: File, userId: string): Promise<string> => {
    const timestamp = Date.now()
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const path = `cocineros/${userId}/logo_${timestamp}.${ext}`

    const { error: uploadError } = await supabase.storage.from('cocineros').upload(path, file, {
      upsert: true,
      contentType: file.type,
    })
    if (uploadError) throw uploadError

    const { data } = supabase.storage.from('cocineros').getPublicUrl(path)
    return data.publicUrl
  }

  /** Submit del formulario */
  const onSubmit = async (data: FormData) => {
    if (!user) return
    setSubmitting(true)
    setError('')

    try {
      const logo_url = data.logo ? await uploadLogo(data.logo, user.id) : null

      const producerData = {
        id: user.id,
        business_name: data.business_name,
        description: data.description || null,
        address: data.address,
        email: data.email,
        phone: data.phone,
        logo_url,
        visible: false,
        is_active: false,
      }

      const { error: upsertError } = await supabase.from('producers').upsert(producerData, {
        onConflict: 'id',
        ignoreDuplicates: false,
      })
      if (upsertError) throw upsertError

      localStorage.setItem('onboardingStage', '2')
      router.push('/onboarding/platos')
    } catch (err: any) {
      console.error('Error saving producer profile:', err)
      setError(err.message || 'Error al guardar tu negocio. Intenta nuevamente.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-lg font-medium text-gray-700">Cargando información...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Barra de progreso */}
        <ProgressBar />

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6 md:p-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-2 text-center">Tu negocio</h1>
            <p className="text-center text-gray-600 mb-8">
              Cuéntanos sobre tu negocio para que los clientes te conozcan.
            </p>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <InputField id="business_name" label="Nombre del negocio" register={register} errors={errors} required />
              <TextAreaField id="description" label="Descripción (opcional)" register={register} errors={errors} maxLength={500} placeholder="Cuéntanos sobre tu historia..." />
              <InputField id="address" label="Dirección completa" register={register} errors={errors} required placeholder="Calle, número, ciudad, provincia" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField id="email" label="Email de contacto" register={register} errors={errors} required type="email" />
                <InputField id="phone" label="Teléfono con código de país" register={register} errors={errors} required placeholder="+5491123456789" pattern={/^\+[1-9]\d{1,14}$/} patternMessage="Formato de teléfono inválido. Usa formato internacional (+549...)."/>
              </div>
              <LogoUploadField logoPreview={logoPreview} handleLogoChange={handleLogoChange} />

              {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

              <SubmitButton submitting={submitting} />
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

/** Componentes auxiliares para limpieza */
const ProgressBar = () => (
  <div className="mb-8">
    <div className="flex justify-between mb-2">
      <span className="text-sm font-medium text-green-600">Cuenta creada</span>
      <span className="text-sm font-medium text-gray-500">Perfil del negocio</span>
      <span className="text-sm font-medium text-gray-300">Tus platos</span>
    </div>
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div className="bg-green-600 h-2 rounded-full w-1/2"></div>
    </div>
  </div>
)

const InputField = ({ id, label, register, errors, required, type = 'text', placeholder, pattern, patternMessage }: any) => (
  <div className="space-y-2">
    <label htmlFor={id} className="block font-medium text-gray-700">{label}</label>
    <input
      id={id}
      type={type}
      placeholder={placeholder}
      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
      {...register(id, { required: required && `El campo ${label} es obligatorio`, pattern: pattern ? { value: pattern, message: patternMessage } : undefined })}
    />
    {errors[id] && <p className="text-red-500 text-sm">{errors[id]?.message}</p>}
  </div>
)

const TextAreaField = ({ id, label, register, errors, maxLength, placeholder }: any) => (
  <div className="space-y-2">
    <label htmlFor={id} className="block font-medium text-gray-700">{label}</label>
    <textarea
      id={id}
      rows={4}
      placeholder={placeholder}
      maxLength={maxLength}
      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
      {...register(id)}
    />
    {maxLength && <p className="text-sm text-gray-500">Máximo {maxLength} caracteres</p>}
    {errors[id] && <p className="text-red-500 text-sm">{errors[id]?.message}</p>}
  </div>
)

const LogoUploadField = ({ logoPreview, handleLogoChange }: any) => (
  <div className="space-y-2">
    <label className="block font-medium text-gray-700">Logo de tu negocio (opcional)</label>
    <div className="flex flex-col items-center">
      {logoPreview ? (
        <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-gray-200 mb-4">
          <img src={logoPreview} alt="Logo del negocio" className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center mb-4">
          <span className="text-gray-400 text-3xl">+</span>
        </div>
      )}
      <input type="file" accept="image/jpeg, image/png, image/webp" onChange={handleLogoChange} className="hidden" id="logo-upload" />
      <label htmlFor="logo-upload" className="cursor-pointer bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 transition">
        {logoPreview ? 'Cambiar logo' : 'Subir logo'}
      </label>
      <p className="text-xs text-gray-500 mt-1 text-center max-w-xs">
        Formatos aceptados: JPG, PNG, WEBP. Tamaño máximo: 5MB. Recomendado: 400x400px.
      </p>
    </div>
  </div>
)

const SubmitButton = ({ submitting }: any) => (
  <button
    type="submit"
    disabled={submitting}
    className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center"
  >
    {submitting ? (
      <>
        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Guardando información...
      </>
    ) : (
      'Continuar a mis platos →'
    )}
  </button>
)
