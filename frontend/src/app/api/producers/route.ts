import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    // Datos sent from client
    const business_name = formData.get("business_name") as string;
    const description = formData.get("description") as string | null;
    const address = formData.get("address") as string | null;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;

    const logo = formData.get("logo") as File | null;

    // VALIDATE FIELDS  
    if (!business_name || !email || !phone) {
      return NextResponse.json(
        { error: "Faltan datos obligatorios." },
        { status: 400 }
      );
    }

    // GET USER SESSION
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const userId = user.id;

    // CREATE PRODUCER IN DB
    const { error: insertError } = await supabase.from("producers").insert([
      {
        id: userId,
        business_name,
        description,
        address,
        email,
        phone,
        is_active: false,
        visible: false,
      },
    ]);

    if (insertError) throw insertError;

    let logoUrl: string | undefined;

    // UPLOAD LOGO IF EXISTS
    if (logo) {
      if (!["image/png", "image/jpeg", "image/webp"].includes(logo.type)) {
        return NextResponse.json(
          { error: "Formato inválido" },
          { status: 400 }
        );
      }

      const filePath = `${userId}/logo.png`;

      const { error: uploadError } = await supabase.storage
        .from("producer-logos")
        .upload(filePath, logo, {
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("producer-logos")
        .getPublicUrl(filePath);

      logoUrl = data.publicUrl;
    }

    return NextResponse.json(
      {
        success: true,
        producer: {
          id: userId,
          business_name,
          description,
          address,
          email,
          phone,
          logoUrl,
        },
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("API /producers error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
