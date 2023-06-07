import { exec } from 'child_process';
import path from 'path';

// Default values for backup destination directory, AWS S3 bucket name,
// and destination path and directories to compress and upload
const directories = [];
let backupDir = '/local/backup/dir';
let destinationPathOnBucket = 's3://bucket-name/destination/path';

// Function to create tar.gz file for a directory
function createTarGz(directory) {
  return new Promise((resolve, reject) => {
    const baseName = path.basename(directory);
    const backupFile = path.join(backupDir, `${baseName}.tar.gz`);
    const command = `tar -czvf ${backupFile} -C ${directory} .`;
    exec(command, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
      if (error) {
        console.error(`Failed to create tar.gz file for ${directory}:`, error);
        console.error('stderr:', stderr);
        reject(error);
      } else {
        console.log(`Created tar.gz file for ${directory}`);
        console.log('stdout:', stdout);
        resolve(backupFile);
      }
    });
  });
}

// Function to upload a file to AWS S3
function uploadToS3(file) {
  return new Promise((resolve, reject) => {
    const command = `aws s3 cp ${file} ${destinationPathOnBucket}`;
    exec(command, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
      if (error) {
        console.error(`Failed to upload ${file} to S3:`, error);
        console.error('stderr:', stderr);
        reject(error);
      } else {
        console.log(`Uploaded ${file} to S3`);
        console.log('stdout:', stdout);
        resolve();
      }
    });
  });
}

// Retrieve command line arguments
const args = process.argv.slice(2);

// Process command line arguments
for (let i = 0; i < args.length; i += 2) {
  const arg = args[i];
  const value = args[i + 1];
  if (arg === '--backup-dir') {
    backupDir = value;
  } else if (arg === '--destination-path') {
    destinationPathOnBucket = value;
  } else if (arg === '--directory') {
    directories.push(value);
  }
}

// Iterate over the directories, create tar.gz files, and upload them to S3
async function compressAndUpload() {
  try {
    for (const directory of directories) {
      const tarGzFile = await createTarGz(directory);
      await uploadToS3(tarGzFile);
    }
    console.log('All files compressed and uploaded successfully.');
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

// Run the compressAndUpload function
await compressAndUpload();
