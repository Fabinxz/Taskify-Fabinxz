const fs = require('fs');
const path = require('path');

const inputFile = 'repomix-output.xml'; // Altere se necessário
const content = fs.readFileSync(inputFile, 'utf-8');

// Regex que captura cada bloco <file path="...">...</file>
const fileRegex = /<file path="([^"]+)">\s*([\s\S]*?)<\/file>/g;

let match;
let count = 0;

while ((match = fileRegex.exec(content)) !== null) {
const filePath = match[1].trim();
const fileContent = match[2].trim();

// Garante que a pasta de destino existe
const dir = path.dirname(filePath);
fs.mkdirSync(dir, { recursive: true });

// Escreve o conteúdo no caminho correto
fs.writeFileSync(filePath, fileContent, 'utf8');
console.log(`✅ Arquivo criado: ${filePath}`);
count++;


}

console.log(`\n🎉 Processo finalizado! ${count} arquivo(s) extraído(s).`);