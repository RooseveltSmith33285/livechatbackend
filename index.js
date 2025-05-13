require('dotenv').config();
const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const cors = require('cors');
const Mailgun=require('mailgun.js')
const FormData=require('form-data')
const PDFDocument = require('pdfkit');
const fs = require('fs');
const nodemailer=require('nodemailer')

const app = express();
const request=require('request')
app.use(bodyParser.json());
app.use(cors());

async function createLeadPDF(data, pageUrl) {
 
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

    
  console.log(chat)
  console.log("longest page is")
  console.log(longestPage)


    const datazappResponse = await axios.post(
      'https://secureapi.datazapp.com/Appendv2',
      {
        ApiKey: "NKBTHXMFEJ",           
        AppendModule: "ReverseIPAppend",
IsMaximizedAppend:true,
        AppendType: "2",
        Data: [{ IP: ip }]           
      }
    );


if(datazappResponse?.data?.ResponseDetail?.Data!=null && datazappResponse?.data?.ResponseDetail?.Data[0]?.FirstName?.length>0){
 
  data=datazappResponse.data?.ResponseDetail?.Data[0];
}



let firstName=datazappResponse.data.ResponseDetail.Data[0]?.FirstName
let lastName=datazappResponse.data.ResponseDetail.Data[0]?.LastName
let address=datazappResponse.data.ResponseDetail.Data[0]?.Address
let email=datazappResponse.data.ResponseDetail.Data[0]?.Email
let phone=datazappResponse.data.ResponseDetail.Data[0]?.Phone
let city=datazappResponse.data.ResponseDetail.Data[0]?.City
let state=datazappResponse.data.ResponseDetail.Data[0]?.State


const params = {
  format: "json",
  id: "DvHdwMzHAPvQ4quyNYq8a4**", 
  act: "Append,Check,Verify,Move",
  cols: "AddressLine1,City,State,PostalCode,EmailAddress,TopLevelDomain",
  first: firstName,
  last: lastName,
  full:firstName+' '+lastName,
  a1: address,
  city:city,
  state: state,
  email: email,
  phone: phone,
  ip: ip
};


const response = await axios.get(
  "https://personator.melissadata.net/v3/WEB/ContactVerify/doContactVerify",
  { params }
);



  
if(response.data.Records[0]?.City?.trim()?.length>0){

  data=response.data.Records[0]
}

console.log("melisa data")
  console.log(response?.data?.Records[0])
  console.log("datazapp data")
  console.log(datazappResponse?.data?.ResponseDetail?.Data)


if(data){

  
const pdfPath = await createLeadPDF(data, longestPage.url);
const pdfBuffer = fs.readFileSync(pdfPath);
const fileContent = fs.readFileSync(pdfPath);


await sendEmailWithAttachment(fileContent,data,"chatgpt.com");

  fs.unlinkSync(pdfPath);
}
return res.status(200).json({
  message:"Sucessfully"
})

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Error processing lead.' });
  }
});


async function sendEmailWithAttachment(fileContent,data,pageUrl) {
  const mailOptions = {
    from: '"Lead System" <shipmate2134@gmail.com>',
    to: 'shipmate2134@gmail.com',
    subject: 'Enrichify Lead System ',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">
          New Enrichify Lead
        </h2>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <tr>
            <td style="padding: 10px; background-color: #f8f9fa; width: 30%;">First Name</td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">${data?.FirstName || data?.NameFull?.split(' ')[0] || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 10px; background-color: #f8f9fa;">Last Name</td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">${data?.LastName || data?.NameFull?.split(' ')[1] || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 10px; background-color: #f8f9fa;">Email</td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">${data?.EmailAddress || data?.Email || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 10px; background-color: #f8f9fa;">Phone Number</td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">${data?.PhoneNumber || data?.Cell || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 10px; background-color: #f8f9fa;">URL</td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">
              <a href="${pageUrl}" target="_blank">${pageUrl}</a>
            </td>
          </tr>
          <tr>
            <td style="padding: 10px; background-color: #f8f9fa;">Lead Source</td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">ENRICHIFY</td>
          </tr>
          <tr>
            <td style="padding: 10px; background-color: #f8f9fa;">Lead Quality</td>
            <td style="padding: 10px; border: 1px solid #dee2e6; color: #e67e22;">WARM</td>
          </tr>
        </table>
  
        <p style="margin-top: 20px; color: #7f8c8d;">
          Lead details PDF attached. Sent at ${new Date().toLocaleString()}
        </p>
      </div>
    `
  };

  try {
    
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user:'leads@enrichifydata.com', 
        pass: 'cazhzgbslrzvyjfc' 
      }
    });
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}


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