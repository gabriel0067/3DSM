// pages/api/import-xlsx.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';
import fs from 'fs';
import * as XLSX from 'xlsx';
import { db } from '@/lib/auth'; // importa o db que você já usa no better-auth

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    const filePath = path.join(process.cwd(), 'data', 'dados.xlsx');

    const fileBuffer = fs.readFileSync(filePath);
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });

    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    const data: any[] = XLSX.utils.sheet_to_json(worksheet);

    if (!data.length) {
      return res.status(400).json({ message: 'Arquivo está vazio.' });
    }

    const collection = db.collection('dados_meorologicos'); // ajuste o nome aqui

    await collection.insertMany(data);

    res.status(200).json({ message: 'Importação concluída com sucesso!', count: data.length });
  } catch (error) {
    console.error('Erro ao importar:', error);
    res.status(500).json({ message: 'Erro ao processar o arquivo.' });
  }
}
