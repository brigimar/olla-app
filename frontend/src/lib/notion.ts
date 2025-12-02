import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.auth: process.env.NOTION_TOKEN });
const databaseId = process.env.NOTION_DATABASE_ID!;

export async function getPlatosDelDia() {
  const response = await notion.databases.query({
    database_id: process.env.OTION_DATABASE_ID!,
  });
  return response.results.map((row: any) => ({
    id: row.id,
    nombre: row.properties.Nombre.title[0]?.plain_text,
    precio: row.properties.Precio.number,
    descripcion: row.properties.Descripcion.rich_text[0]?.plain_text,
  }));
}