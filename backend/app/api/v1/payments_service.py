# backend/app/api/v1/router.py
@router.post("/report-bypass")
async def report_bypass(
    report: ReportBypassSchema,
    current_user: User = Depends(get_current_repartidor)
):
    # Bono instantáneo $500 al repartidor
    await payments_service.create_bonus_payment(
        user_id=current_user.id,
        amount_cents=50000,
        reason="Reporte de bypass confirmado"
    )

    # Penalización automática a la abuela
    await supabase.table("producers").update({
        "bypass_attempts": Increment(),
        "visible": False if bypass_attempts >= 1 else True
    }).eq("id", report.producer_id).execute()

    return {"message": "Bono $500 acreditado. Productor penalizado."}