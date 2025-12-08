// fixSupabase.js
import fs from 'fs';
import path from 'path';

const baseDir = path.join(__dirname, 'src', 'lib', 'supabase');
const clientFile = path.join(baseDir, 'client.ts');

// contenido estándar del cliente
const content = `import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
`;

// asegurarse que la carpeta existe
if (!fs.existsSync(baseDir)) {
  fs.mkdirSync(baseDir, { recursive: true });
}

// escribir el archivo client.ts
fs.writeFileSync(clientFile, content, 'utf8');

// eliminar duplicados si existen
['supabase.ts', 'supabaseClient.ts'].forEach((file) => {
  const filePath = path.join(baseDir, '..', file);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log(`Eliminado: ${filePath}`);
  }
});

// reemplazar imports viejos en todo el src
const srcDir = path.join(__dirname, 'src');
function replaceImports(filePath) {
  let code = fs.readFileSync(filePath, 'utf8');
  const replaced = code
    .replace(/@\/lib\/supabaseClient/g, '@/lib/supabase/client')
    .replace(/@\/lib\/supabase.ts/g, '@/lib/supabase/client')
    .replace(/@\/lib\/supabase\b/g, '@/lib/supabase/client');
  if (replaced !== code) {
    fs.writeFileSync(filePath, replaced, 'utf8');
    console.log(`Actualizado: ${filePath}`);
  }
}

function walk(dir) {
  fs.readdirSync(dir).forEach((file) => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (/\.(ts|tsx)$/.test(file)) {
      replaceImports(fullPath);
    }
  });
}

walk(srcDir);

console.log('Archivo client.ts creado, duplicados eliminados y imports actualizados.');
