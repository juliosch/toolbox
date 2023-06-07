import {exec} from 'child_process';

// Default values for backup destination directory, AWS S3 bucket name, and destination path
let username = 'myuser';
let password = 'mypassword';
let backupDir = '/local/backup/dir';
let destinationPathOnBucket = 's3://bucket-name/destination/path';

// Function to run mysqldump for a database
function backupDatabase(database, username, password) {
  return new Promise((resolve, reject) => {
    const command = `mysqldump -u ${username} -p${password} ${database} > ${backupDir}${database}.sql`;
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Failed to backup ${database}:`, error);
        console.error('stderr:', stderr);
        reject(error);
      } else {
        console.log(`Backup created for ${database}`);
        console.log('stdout:', stdout);
        resolve(`${backupDir}${database}.sql`);
      }
    });
  });
}

// Function to upload a file to AWS S3
function uploadToS3(file) {
  return new Promise((resolve, reject) => {
    const command = `aws s3 cp ${file} ${destinationPathOnBucket}`;
    exec(command, (error, stdout, stderr) => {
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

// Function to get a list of databases
function getDatabaseList(username, password) {
  return new Promise((resolve, reject) => {
    const command = `mysql -u ${username} -p${password} -e "SHOW DATABASES"`;
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error('Failed to retrieve database list:', error);
        console.error('stderr:', stderr);
        reject(error);
      } else {
        const databases = stdout
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => line !== 'Database' && line !== '');
        resolve(databases);
      }
    });
  });
}

// Backup all non-default databases and upload to AWS S3
async function createBackupsAndUpload(username, password) {
  try {
    const databases = await getDatabaseList(username, password);
    const nonDefaultDatabases = databases.filter((database) => !isDefaultDatabase(database));
    for (const database of nonDefaultDatabases) {
      const backupFile = await backupDatabase(database, username, password);
      await uploadToS3(backupFile);
    }
    console.log('All non-default databases backed up and uploaded to S3 successfully.');
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

// Helper function to check if a database is default
function isDefaultDatabase(database) {
  const defaultDatabases = ['information_schema', 'mysql', 'performance_schema', 'sys'];
  return defaultDatabases.includes(database);
}

// Retrieve command line arguments
const args = process.argv.slice(2);

// Process command line arguments
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  const [key, value] = arg.split('=');
  if (key === '--username') {
    username = value;
  } else if (key === '--password') {
    password = value;
  } else if (key === '--backup-dir') {
    backupDir = value;
  } else if (key === '--destination-path') {
    destinationPathOnBucket = value;
  }
}

// Run the createBackupsAndUpload function
await createBackupsAndUpload(username, password);
