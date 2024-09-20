import fs from 'fs-extra';
import path from 'path';
import archiver from 'archiver';

const buildDir = path.resolve('dist');
const outputFile = path.resolve('dist/chrome-extension.zip');

async function buildChromeExtension() {
  // 确保构建目录存在
  await fs.ensureDir(buildDir);

  // 创建一个文件以写入
  const output = fs.createWriteStream(outputFile);
  const archive = archiver('zip', {
    zlib: { level: 9 } // 设置压缩级别
  });

  output.on('close', () => {
    console.log(`Chrome扩展已打包: ${outputFile}`);
  });

  archive.on('error', (err) => {
    throw err;
  });

  // 将输出流管道连接到归档文件
  archive.pipe(output);

  // 将构建目录的内容添加到归档文件
  archive.directory(buildDir, false);

  // 完成归档
  await archive.finalize();
}

buildChromeExtension().catch(console.error);