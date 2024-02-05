const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');
const { pipeline } = require('stream');
const zlib = require('zlib');
const crypto = require('crypto');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to print current working directory
function printCurrentWorkingDirectory() {
    console.log(`You are currently in ${process.cwd()}`);
}

// Function to handle navigation
function navigate(command, directory) {
    if (command === 'up') {
        const currentDirectory = process.cwd();
        const parentDirectory = path.dirname(currentDirectory);
        if (currentDirectory === parentDirectory) {
            console.log("You are already in the root directory.");
        } else {
            process.chdir(parentDirectory);
            printCurrentWorkingDirectory();
        }
    } else if (command === 'cd') {
        let targetDirectory = directory;
        if (!path.isAbsolute(directory)) {
            targetDirectory = path.resolve(process.cwd(), directory);
        }
        try {
            fs.accessSync(targetDirectory, fs.constants.R_OK);
            process.chdir(targetDirectory);
            printCurrentWorkingDirectory();
        } catch (error) {
            console.log("Invalid directory path.");
        }
    } else {
        console.log("Invalid navigation command.");
    }
}

// Function to list files and directories
function list() {
    fs.readdir(process.cwd(), { withFileTypes: true }, (err, files) => {
        if (err) {
            console.log("Operation failed.");
        } else {
            const directories = files.filter(file => file.isDirectory()).map(dir => `${dir.name}/`);
            const regularFiles = files.filter(file => file.isFile()).map(file => file.name);
            const allFiles = directories.concat(regularFiles).sort();
            console.log(allFiles.join('\n'));
        }
    });
}

// Function to read file contents
function readFile(filePath) {
    const readableStream = fs.createReadStream(filePath, { encoding: 'utf8' });
    readableStream.on('data', chunk => {
        console.log(chunk);
    });
    readableStream.on('error', error => {
        console.log("Operation failed.");
    });
}

// Function to create empty file
function createFile(fileName) {
    fs.writeFile(fileName, '', err => {
        if (err) {
            console.log("Operation failed.");
        } else {
            console.log("File created successfully.");
        }
    });
}

// Function to rename file
function renameFile(oldPath, newPath) {
    fs.rename(oldPath, newPath, err => {
        if (err) {
            console.log("Operation failed.");
        } else {
            console.log("File renamed successfully.");
        }
    });
}

// Function to copy file
function copyFile(source, destinationDirectory) {
    const destinationFilePath = path.join(destinationDirectory, path.basename(source));
    const readStream = fs.createReadStream(source);
    const writeStream = fs.createWriteStream(destinationFilePath);
    pipeline(readStream, writeStream, err => {
        if (err) {
            console.log("Operation failed.");
        } else {
            console.log("File copied successfully.");
        }
    });
}

// Function to move file
function moveFile(source, destinationDirectory) {
    const destinationFilePath = path.join(destinationDirectory, path.basename(source));
    copyFile(source, destinationDirectory);
    fs.unlink(source, err => {
        if (err) {
            console.log("Operation failed.");
        } else {
            console.log("File moved successfully.");
        }
    });
}


// Function to delete file
function deleteFile(filePath) {
    fs.unlink(filePath, err => {
        if (err) {
            console.log("Operation failed.");
        } else {
            console.log("File deleted successfully.");
        }
    });
}

// Function to get end of line character
function getEndOfLine() {
    const eol = os.EOL === '\r\n' ? 'CRLF (Windows)' : os.EOL === '\n' ? 'LF (Unix)' : 'Unknown';
    console.log(`End of line character: ${os.EOL} (${eol})`);
}

// Function to get CPU info
function getCpuInfo() {
    const cpus = os.cpus();
    console.log(`Number of CPUs: ${cpus.length}`);
    cpus.forEach((cpu, index) => {
        console.log(`CPU ${index + 1}: ${cpu.model}, ${cpu.speed} GHz`);
    });
}

// Function to get home directory
function getHomeDirectory() {
    console.log(`Home directory: ${os.homedir()}`);
}

// Function to get current system username
function getUsername() {
    console.log(`Current username: ${os.userInfo().username}`);
}

// Function to get CPU architecture
function getArchitecture() {
    console.log(`CPU architecture: ${os.arch()}`);
}

// Function to calculate hash for file
function calculateHash(filePath) {
    const hash = crypto.createHash('sha256');
    const readableStream = fs.createReadStream(filePath);
    readableStream.on('data', chunk => {
        hash.update(chunk);
    });
    readableStream.on('end', () => {
        console.log(`Hash for file ${filePath}: ${hash.digest('hex')}`);
    });
}

// Function to compress file
function compressFile(source, destinationDir) {
    const brotliCompress = zlib.createBrotliCompress();
    const fileName = path.basename(source); // Извлекаем имя файла из пути к исходному файлу
    const destination = path.join(destinationDir, fileName + '.br'); // Составляем путь к файлу назначения

    const readStream = fs.createReadStream(source);
    const writeStream = fs.createWriteStream(destination);
    pipeline(readStream, brotliCompress, writeStream, err => {
        if (err) {
            console.log("Operation failed.");
        } else {
            console.log("File compressed successfully.");
        }
    });
}

// Function to decompress file
function decompressFile(source, destination) {
    const brotliDecompress = zlib.createBrotliDecompress();
    if (!fs.existsSync(destination)) {
        fs.mkdirSync(destination, { recursive: true });
    }

    const fileName = path.basename(source, path.extname(source));
    const decompressedFilePath = path.join(destination, fileName);

    const readStream = fs.createReadStream(source);
    const writeStream = fs.createWriteStream(decompressedFilePath);
    pipeline(readStream, brotliDecompress, writeStream, err => {
        if (err) {
            console.log("Operation failed.");
        } else {
            console.log("File decompressed successfully.");
        }
    });
}

// Main function
function main() {
    const args = process.argv.slice(2);
    const username = args.find(arg => arg.startsWith('--username=')).split('=')[1];
    console.log(`Welcome to the File Manager, ${username}!`);
    printCurrentWorkingDirectory();

    rl.on('line', (input) => {
        const [command, ...args] = input.split(' ');
        switch (command) {
            case 'up':
                navigate(command);
                break;
            case 'cd':
                navigate(command, args[0]);
                break;
            case 'ls':
                list();
                break;
            case 'cat':
                readFile(args[0]);
                break;
            case 'add':
                createFile(args[0]);
                break;
            case 'rn':
                renameFile(args[0], args[1]);
                break;
            case 'cp':
                copyFile(args[0], args[1]);
                break;
            case 'mv':
                moveFile(args[0], args[1]);
                break;
            case 'rm':
                deleteFile(args[0]);
                break;
            case 'os':
                switch (args[0]) {
                    case '--EOL':
                        getEndOfLine();
                        break;
                    case '--cpus':
                        getCpuInfo();
                        break;
                    case '--homedir':
                        getHomeDirectory();
                        break;
                    case '--username':
                        getUsername();
                        break;
                    case '--architecture':
                        getArchitecture();
                        break;
                    default:
                        console.log("Invalid os command.");
                }
                break;
            case 'hash':
                calculateHash(args[0]);
                break;
            case 'compress':
                compressFile(args[0], args[1]);
                break;
            case 'decompress':
                decompressFile(args[0], args[1]);
                break;
            case '.exit':
                console.log(`Thank you for using File Manager, ${username}, goodbye!`);
                process.exit();
            default:
                console.log("Invalid input.");
        }
    });

    process.on('SIGINT', () => {
        console.log(`Thank you for using File Manager, ${username}, goodbye!`);
        process.exit();
    });

    rl.on('close', () => {
        console.log(`Thank you for using File Manager, ${username}, goodbye!`);
        process.exit();
    });
}

main();
