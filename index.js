require('dotenv').config();
const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const cors = require('cors');
const Mailgun=require('mailgun.js')
const FormData=require('form-data')
const PDFDocument = require('pdfkit');
const fs = require('fs');

const app = express();
const request=require('request')
app.use(bodyParser.json());
app.use(cors());

async function createLeadPDF(data, pageUrl) {
  console.log("data");
  console.log(data);
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const filename = `lead-${Date.now()}.pdf`;


    const writeStream = fs.createWriteStream(filename);
    doc.pipe(writeStream);

 
    doc.fontSize(16).text('Lead Information', { align: 'center' });
    doc.moveDown();

   
    const leadDetails = {
      'First Name': data?.FirstName || data?.NameFull?.split(' ')[0] || 'N/A',
      'Last Name': data?.LastName || data?.NameFull?.split(' ')[1] || 'N/A',
      'Email': data?.EmailAddress || data?.Email || 'N/A',
      'Phone Number': data?.PhoneNumber || data?.Cell || 'N/A',
      'URL': pageUrl,
      'Lead Source': 'ENRICHIFY',
      'Lead Quality': 'WARM'
    };

   
    Object.entries(leadDetails).forEach(([key, value]) => {
      doc.fontSize(12).text(`${key}: ${value}`, {
        paragraphGap: 5,
        indent: 5
      });
      doc.moveDown();
    });

    
    doc.end();

    writeStream.on('finish', () => {
      resolve(filename);  
    });

    writeStream.on('error', reject); 
  });
}




app.post('/webhook/livechat', async (req, res) => {
  try {
    let data;
  
    if(!req?.body?.payload){
      return res.status(400).json({
        error:"No Lead found"
      })
    }
    const chat = req.body.payload.chat;
    let ip = chat.users[0]?.last_visit?.ip || 'IP not available';
    const lastPages = chat.users[0]?.last_visit?.last_pages || [];
    const chatCreatedAt = new Date(chat.thread.created_at);

    let maxDuration = 0;
    let longestPage = { 
      url: 'No pages visited',
      duration: 0,
      opened_at: null
    };

    if (lastPages.length > 0) {
      
      const sortedPages = [...lastPages].sort((a, b) => 
        new Date(a.opened_at) - new Date(b.opened_at));

    
      for (let i = 0; i < sortedPages.length; i++) {
        const pageStart = new Date(sortedPages[i].opened_at);
        const pageEnd = i < sortedPages.length - 1 
          ? new Date(sortedPages[i + 1].opened_at) 
          : chatCreatedAt;
          
        const duration = pageEnd - pageStart;

        if (duration > maxDuration) {
          maxDuration = duration;
          longestPage = {
            url: sortedPages[i].url,
            duration: duration,
            opened_at: sortedPages[i].opened_at
          };
        }
      }
    }

    console.log(ip)
    console.log(longestPage)
    console.log(chat)


return res.status(200).json({
  messagae:"Lead sucessfully sent"
})

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Error processing lead.' });
  }
});




// (async()=>{
//   let address="288 East 175th St."
//   const apiKey = 'AIzaSyAGDj6y_kK-bnqC41stB0qo4cNII1opfXs'; 
//   const response = await axios.get(
//     `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`
//   );
 
  
//   const { lat, lng } = response.data.results[0].geometry.location;
//   console.log(JSON.stringify(response.data))
//   console.log(lat)
//   console.log(lng)
// })()




app.listen(5000, () => {
  console.log('API server running on port 5000'); 
});