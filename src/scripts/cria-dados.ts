// scripts/cria-dados.ts
import path from 'path';
import fs from 'fs';
import * as XLSX from 'xlsx';
import { db } from '@/lib/auth'; // usa a mesma conexão que já existe

const importaDados = async () => {
  try {
    const filePath = path.join(process.cwd(), 'data', 'dados.xlsx');
    const fileBuffer = fs.readFileSync(filePath);
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });

    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data: any[] = XLSX.utils.sheet_to_json(worksheet);

    if (!data.length) {
      console.error('O arquivo está vazio.');
      return;
    }

    const collection = db.collection('dados_meteorologicos'); // nome da collection
    await collection.insertMany(data);
    console.log(`Importação concluída com sucesso! ${data.length} registros inseridos.`);
  } catch (error) {
    console.error('Erro ao importar dados:', error);
  }
};

importaDados();

