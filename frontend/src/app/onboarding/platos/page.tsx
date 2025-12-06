'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { DishSchema } from '@/shared/validation'
import { useForm } from 'react-hook-form'
import type { z } from 'zod'

type FormData = z.infer<typeof DishSchema>

export default function PlatosPage() {
  const router = useRouter()
  const supabase = createClient()
  const formRef = useRef<HTMLFormElement>(null)

  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])
  const [dishes, setDishes] = useState<any[]>([])

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
    defaultValues: { ingredients: [''] }
  })

  const ingredients = watch('ingredients')

  // --- Load user and dishes ---
  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return router.push('/onboarding/crear-cuenta')

        setUser(user)

        const stage = Number(localStorage.getItem('onboardingStage') || 0)
        if (stage < 1) return router.push('/onboarding/crear-cuenta')

        const { data: existingDishes, error: dishesError } = await supabase
          .from('dishes')
          .select('*')
          .eq('producer_id', user.id)
          .order('created_at', { ascending: false })

        if (!dishesError && existingDishes) {
          setDishes(existingDishes.map(d => ({ ...d, price_cents: d.price_cents / 100 })))
        }
      } catch (err) {
        console.error('Error loading data:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [router, supabase])

  // --- Ingredient handlers ---
  const addIngredient = () => setValue('ingredients', [...(ingredients || []), ''])
  const removeIngredient = (i: number) => setValue('ingredients', ingredients.filter((_, idx) => idx !== i))
  const updateIngredient = (i: number, val: string) => {
    const updated = [...(ingredients || [])]
    updated[i] = val
    setValue('ingredients', updated.filter(Boolean))
  }

  // --- Photo handlers ---
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    if (files.length > 5) return setError('Máximo 5 fotos por plato')
    if (files.some(f => f.size > 10 * 1024 * 1024)) return setError('Máximo 10MB por imagen')

    setError('')
    setValue('photoFiles', files)

    const previews = files.map(file => URL.createObjectURL(file))
    setPhotoPreviews(previews)
  }

  const uploadPhotos = useCallback(async (files: File[], producerId: string, dishId: string) => {
    const urls: string[] = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const timestamp = Date.now()
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const path = `platos/${producerId}/${dishId}/photo_${timestamp}_${i}.${ext}`

      const { error: uploadError } = await supabase.storage.from('platos').upload(path, file, { upsert: true, contentType: file.type })
      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('platos').getPublicUrl(path)
      urls.push(data.publicUrl)
    }
    return urls
  }, [supabase.storage])

  // --- Form submission ---
  const onSubmit = async (data: FormData) => {
    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const validIngredients = (data.ingredients || []).map(i => i.trim()).filter(Boolean)
      if (!validIngredients.length) return setError('Debes agregar al menos un ingrediente')

      // Crear plato
      const { data: newDish, error: dishError } = await supabase
        .from('dishes')
        .insert({
          producer_id: user.id,
          name: data.name,
          description: data.description || null,
          category: data.category,
          ingredients: validIngredients,
          price_cents: Math.round(data.price_cents * 100),
          portion_size: data.portion_size,
          is_available: true,
          status: 'active'
        })
        .select()
        .single()
      if (dishError) throw dishError

      // Subir fotos si existen
      let photo_urls: string[] = []
      if (data.photoFiles?.length) photo_urls = await uploadPhotos(data.photoFiles, user.id, newDish.id)

      // Actualizar primer foto como principal
      if (photo_urls.length) {
        await supabase.from('dishes').update({ image_url: photo_urls[0] }).eq('id', newDish.id)
      }

      setDishes(prev => [{ ...newDish, price_cents: newDish.price_cents / 100, image_url: photo_urls[0] || null, photo_urls }, ...prev])
      setSuccess('¡Plato agregado exitosamente!')
      reset({ name: '', description: '', category: '', ingredients: [''], price_cents: undefined, portion_size: '', photoFiles: undefined })
      setPhotoPreviews([])

      if (formRef.current) {
        const fileInput = formRef.current.querySelector<HTMLInputElement>('input[type="file"]')
        if (fileInput) fileInput.value = ''
      }

      localStorage.setItem('onboardingStage', '3')
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Error al guardar el plato')
    } finally {
      setSubmitting(false)
    }
  }

  const finishOnboarding = async () => {
    if (!dishes.length) return setError('Debes agregar al menos un plato antes de finalizar')

    try {
      const { error: updateError } = await supabase
        .from('producers')
        .update({ is_active: false, visible: false })
        .eq('id', user.id)
      if (updateError) throw updateError

      localStorage.removeItem('onboardingStage')
      router.push('/dashboard/productor')
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Error al finalizar el registro')
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-4"></div>
        <p className="text-lg text-gray-700">Cargando información...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Progress Bar */}
        <div className="mb-10">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-green-600">Cuenta creada</span>
            <span className="text-sm font-medium text-green-600">Perfil del negocio</span>
            <span className="text-sm font-medium text-gray-500">Tus platos</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-green-600 h-2 rounded-full w-2/3"></div>
          </div>
        </div>

        {/* Form & Dish list components can be extracted here for cleaner code */}
        {/* ... reuse your JSX as before ... */}

      </div>
    </div>
  )
}
