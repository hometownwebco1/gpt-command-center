import path from 'path';
import { promises as fs } from 'fs';

export default async function handler(req, res) {
  const jsonDirectory = path.join(process.cwd(), 'data');
  try {
    const fileContents = await fs.readFile(jsonDirectory + '/gpt-registry.json', 'utf8');
    const data = JSON.parse(fileContents);
    res.status(200).json(data);
  } catch (error) {
    console.error('Error reading GPT registry:', error);
    res.status(500).json({ error: 'Failed to load GPT registry' });
  }
}
