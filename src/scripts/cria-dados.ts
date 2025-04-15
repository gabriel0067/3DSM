import path from 'path';
import fs from 'fs';
import * as XLSX from 'xlsx';
import { db } from '@/lib/auth';

const importaDados = async () => {
  try {
    const filePath = path.join(process.cwd(), 'data', 'dados.xlsx');
    const fileBuffer = fs.readFileSync(filePath);
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });

    // Nomes das planilhas
    const sheetMap = {
      colina: workbook.SheetNames.find(name => name.toLowerCase().includes('colina')),
      reservatorio: workbook.SheetNames.find(name => name.toLowerCase().includes('reservatório'))
    };

    for (const [tipo, sheetName] of Object.entries(sheetMap)) {
      if (!sheetName) {
        console.warn(`Planilha de ${tipo} não encontrada.`);
        continue;
      }

      const worksheet = workbook.Sheets[sheetName];
      const excelData: any[] = XLSX.utils.sheet_to_json(worksheet);

      if (!excelData.length) {
        console.warn(`Planilha ${sheetName} está vazia.`);
        continue;
      }

      const collection = db.collection(`dados_${tipo}`);

      const excelDocs = excelData.map((item) => {
        const DateStr = typeof item.Date === 'number'
          ? XLSX.SSF.format('dd/mm/yyyy', item.Date)
          : item.Date;
        const TimeStr = typeof item.Time === 'number'
          ? XLSX.SSF.format('hh:mm', item.Time)
          : item.Time;

        return {
          ...item,
          Date: DateStr,
          Time: TimeStr,
          key: `${DateStr}_${TimeStr}`,
        };
      });

      const excelKeys = new Set(excelDocs.map(doc => doc.key));

      // Coletar os dados atuais do banco
      const dbDocs = await collection.find().toArray();
      const dbKeys = new Set(dbDocs.map(doc => `${doc.Date}_${doc.Time}`));

      // Identificar os que devem ser deletados
      const keysToDelete = Array.from(dbKeys).filter(key => !excelKeys.has(key));

      if (keysToDelete.length > 0) {
        const deleteConditions = keysToDelete.map(key => {
          const [Date, Time] = key.split('_');
          return { Date, Time };
        });

        await collection.deleteMany({ $or: deleteConditions });
        console.log(`${keysToDelete.length} registros removidos da coleção dados_${tipo}.`);
      }

      // Upsert dos dados
      for (const doc of excelDocs) {
        const { key, ...data } = doc;
        await collection.updateOne(
          { Date: data.Date, Time: data.Time },
          { $set: data },
          { upsert: true }
        );
      }

      console.log(`Coleção dados_${tipo} atualizada com ${excelDocs.length} registros.`);
    }

  } catch (error) {
    console.error('Erro ao importar dados:', error);
  }
};

importaDados();
