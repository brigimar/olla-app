import plotly.express as px

# suponer df_daily: DataFrame with columns date, amount
df_daily = df.set_index("created_at").resample("D").sum().reset_index()
fig = px.line(df_daily, x="created_at", y="amount", title="Ingresos diarios (últimos 30 días)", markers=True)
fig.update_layout(margin=dict(l=10,r=10,t=40,b=10), height=300)
st.plotly_chart(fig, use_container_width=True)
