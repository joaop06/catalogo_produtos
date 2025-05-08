const fs = require('fs');
const path = require('path');

// Pasta de origem (raiz do projeto)
const sourceDir = process.cwd(); // equivale a "./"
// Pasta de destino
const targetDir = path.join(sourceDir, 'dist');

// Itens a ignorar (por nome)
const ignoreList = [
    'dist',
    '.git',
    '.env',
    '.netlify',
    'build.js',
    '.gitignore',
    'node_modules',
    'config.example.js',
    'package-lock.json',
];

/**
 * Copia arquivos e pastas recursivamente, com exclusões
 */
function copyRecursive(src, dest) {
    if (ignoreList.includes(path.basename(src))) {
        return;
    }

    const stats = fs.statSync(src);

    if (stats.isDirectory()) {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }

        for (const item of fs.readdirSync(src)) {
            copyRecursive(path.join(src, item), path.join(dest, item));
        }
    } else if (stats.isFile()) {
        fs.copyFileSync(src, dest);
    }
}

// Remover o antigo build
fs.rmdirSync(targetDir, { recursive: true })

// Garantir que a pasta dist existe
fs.mkdirSync(targetDir);

console.log(`📁 Copiando arquivos para ${targetDir}...\n`);
copyRecursive(sourceDir, targetDir);
console.log('✅ Cópia concluída com sucesso.');
