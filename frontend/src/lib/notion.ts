
});


export async function getPlatosDelDia() {
  });
  return response.results.map((row: any) => ({
    id: row.id,
    nombre: row.properties.Nombre.title[0]?.plain_text,
    precio: row.properties.Precio.number,
    descripcion: row.properties.Descripcion.rich_text[0]?.plain_text,
  }));
}
