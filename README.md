# toolbox
Just a bunch of small scripts I needed and created and needed to save somewhere


### bkp-mysqldump-to-s3.js
Creates dumps for all non-default mysql database and uploads them to a s3 bucket

```bash
node bkp-mysqldump-to-s3.js --username=myuser --password=mypassword --backup-dir=/path/to/backup --destination-path=s3://backup/path
```

### bkp-dirs-to-s3.js
Creates tar.gz files of an array of dirs and sends the generated file to a s3 bucket

```bash

```
