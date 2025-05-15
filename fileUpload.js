const multer = require('multer');
const csv = require('csv-parser');
const stream = require('stream');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, 
    files: 1
  },
  fileFilter: (req, file, cb) => {
   
    if (file.mimetype === 'text/csv' || 
        file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  }
});

const parseCSV = (buffer) => {
    
  return new Promise((resolve, reject) => {
    const results = [];
    const readStream = new stream.PassThrough();
    
    readStream.end(buffer);
    
    readStream
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
};

module.exports = { upload, parseCSV };