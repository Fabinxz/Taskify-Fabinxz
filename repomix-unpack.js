const fs = require('fs');
const path = require('path');

const inputFile = 'repomix-output.xml'; // Altere se necessário
const content = fs.readFileSync(inputFile, 'utf-8');

// Regex que captura cada bloco <file path="...">...