require('dotenv').config();
const express = require('express');
const axios = require('axios');
const leadsModel=require('./lead')
const { upload, parseCSV } = require('./fileUpload');
const bodyParser = require('body-parser');
const cors = require('cors');
const Mailgun=require('mailgun.js')
const mongoose=require('mongoose')
const FormData=require('form-data')

const PDFDocument = require('pdfkit');
const fs = require('fs');
const nodemailer=require('nodemailer')

const app = express();
const request=require('request')
app.use(bodyParser.json());
app.use(cors());
mongoose.connect('mongodb+srv://user:user@cluster0.pfn059x.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0',{
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4
})



const sendBulkEmail = async (enrichedData, errors) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user:'leads@enrichifydata.com', 
      pass: 'cazhzgbslrzvyjfc' 
    }
  });

  const mailOptions = {
    from: '"Lead System" <shipmate2134@gmail.com>',
    to: 'InternetLeads@FlatOutMotorcycles.com',
    subject: 'Enrichify Lead System',
    html: generateEmailHTML(enrichedData),
  };

  await transporter.sendMail(mailOptions);
};

const generateEmailHTML = (data) => {
  return `
    <html>
      <head>
        <style>
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <h2>Enriched Lead Report (${new Date().toLocaleDateString()})</h2>
        <table>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Address</th>
            <th>Website</th>
            <th>Lead Quality</th>
          </tr>
          ${data.map(user => `
            <tr>
              <td>${user.FirstName} ${user.LastName}</td>
              <td>${user.Email}</td>
              <td>${user.Phone}</td>
              <td>${user.Address}, ${user.City}, ${user.State}</td>
              <td><a href="${user.URL}">${user.URL}</a></td>
              <td>${user.LeadQuality}</td>
            </tr>
          `).join('')}
        </table>
      </body>
    </html>
  `;
};


const processCSV = async (csvUsers) => {
  const enrichedData = [];
  const errors = [];

  for (const [index, user] of csvUsers.entries()) {
    try {
      
      const datazappResponse = await axios.post(
        'https://secureapi.datazapp.com/Appendv2',
        {
          ApiKey: "NKBTHXMFEJ",
          AppendModule: "EncryptedEmailAppendAPI",
          AppendType: 5,
          Isb2bOnly: 0,
          Data: [{ Email: user.Enrichify_Email }]
        }
      );

     if(!datazappResponse.data?.ResponseDetail?.Data?.[0]?.FirstName){
      continue;
     }
      const params = {  };
      const melissaResponse = await axios.get(
        "https://personator.melissadata.net/v3/WEB/ContactVerify/doContactVerify",
        { params }
      );

  
     let combinedData = {
        ...datazappResponse.data?.ResponseDetail?.Data?.[0],
        ...melissaResponse.data?.Records?.[0],
        URL: user['Web Page'],
        LeadQuality: 'WARM',
        LeadSource: 'ENRICHIFY'
      };

      if(!combinedData?.Phone){
combinedData={
  ...combinedData,
  Phone:'N/A'
}
      }

      enrichedData.push(combinedData);
    } catch (error) {
      errors.push({
        user: user.Enrichify_Email,
        error: error.message
      });
      console.error(`Error processing ${user.Enrichify_Email}:`, error);
    }
  }

  return { enrichedData, errors };
};


app.get('/totalLeads',async(req,res)=>{
  try{
    const count = await leadsModel.countDocuments({});
    console.log(count);
return res.status(200).json({
  count
})
  }catch(e){
    console.error(e.message);
    res.status(500).json({ error: "Server error while fetching leads" });
  }
})

app.get('/leads', async (req, res) => { 
  const { startIndex = 0, startDate, endDate } = req.query;

 
  try {
    const filter = {};
    const pageSize = 10;

    
    if (startDate || endDate) {
      filter.createdAt = {};
      
     
      if (startDate && startDate.trim()) {
        filter.createdAt.$gte = new Date(startDate);
      }
   
      if (endDate && endDate.trim()) {
        filter.createdAt.$lte = new Date(endDate);
      }
    }

   
    const totalCount = await leadsModel.countDocuments(filter);
    const leads = await leadsModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(Number(startIndex))
      .limit(pageSize)
      .lean();

    const endIndex = Number(startIndex) + leads.length - 1;

    return res.json({
      data: leads,
      totalCount,
      currentPage: Math.floor(startIndex / pageSize) + 1,
      totalPages: Math.ceil(totalCount / pageSize),
      hasMore: (startIndex + pageSize) < totalCount
    });

  } catch (e) {
    console.error(e.message);
    res.status(500).json({ error: "Server error while fetching leads" });
  }
});


app.post('/webhook/livechat', async (req, res) => {
  
  try {
    let data;
  
    if(!req?.body?.payload){  
      return res.status(400).json({
        error:"No Lead found"
      })
    }
    const chat = req.body.payload.chat;
console.log("WHOLE CHAT")
console.log(chat?.users[0]?.statistics)
console.log(JSON.stringify(chat))
    let ip = chat.users[0]?.last_visit?.ip || 'IP not available';
    let useremail=chat?.users[0]?.email;
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


console.log('longestPage')
console.log(longestPage.url)
    const datazappResponse = await axios.post(
      'https://secureapi.datazapp.com/Appendv2',
      { 
        ApiKey: "NKBTHXMFEJ",           
        AppendModule: "EncryptedEmailAppendAPI",
        AppendType: 5,
        Isb2bOnly: 0,
        Data: [{Email:useremail }]           
      }
    );

    


   
if(datazappResponse?.data?.ResponseDetail?.Data!=null && datazappResponse?.data?.ResponseDetail?.Data[0]?.FirstName?.length>0){
 
  data=datazappResponse.data?.ResponseDetail?.Data[0];
  data={
    ...data,
    URL:longestPage.url,
    LeadQuality:'WARM',
    LeadSource:'ENRICHIFY'
  }
}

return;


let firstName=datazappResponse.data.ResponseDetail.Data[0]?.FirstName?datazappResponse.data.ResponseDetail.Data[0]?.FirstName:chat?.users[0]?.name?.split(' ')[0]
let lastName=datazappResponse.data.ResponseDetail.Data[0]?.LastName?datazappResponse.data.ResponseDetail.Data[0]?.LastName:chat?.users[0]?.name?.split(' ')?.length>0?chat?.users[0]?.name?.split(' ')[1]:'N/A'
let address=datazappResponse.data.ResponseDetail.Data[0]?.Address?datazappResponse.data.ResponseDetail.Data[0]?.Address:'N/A'
let email=datazappResponse.data.ResponseDetail.Data[0]?.Email?datazappResponse.data.ResponseDetail.Data[0]?.Email:useremail
let phone=datazappResponse.data.ResponseDetail.Data[0]?.Phone?datazappResponse.data.ResponseDetail.Data[0]?.Phone:'N/A'
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

console.log("params")
console.log(params)

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

  

  const creditScore = Math.floor(Math.random() * (789 - 480 + 1)) + 480;

data={
  ...data,
  Credit_score:creditScore
}

await sendEmailWithAttachment('',data,longestPage.url,creditScore);

console.log("DATA TO BE INSERTED INTO MODEL")
console.log(data)
await leadsModel.create(data);


  
 
 
}

return res.status(200).json({
  message:"Sucessfully"
})


  } catch (err) {
   
    console.error(err.message);
    res.status(500).json({ error: 'Error processing lead.' });
  }
});


async function sendEmailWithAttachment(fileContent,data,pageUrl,creditScore) {

    
    
  const mailOptions = {
    from: '"Lead System" <shipmate2134@gmail.com>',
    to: 'InternetLeads@FlatOutMotorcycles.com',
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
            <td style="padding: 10px; background-color: #f8f9fa;">Credit Score</td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">${creditScore || 'N/A'}</td>
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
  // let address="288 East 175th St."
  // const apiKey = 'AIzaSyAGDj6y_kK-bnqC41stB0qo4cNII1opfXs'; 
  // const response = await axios.get(
  //   `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`
  // );
 
  
  // const { lat, lng } = response.data.results[0].geometry.location;
  // console.log(JSON.stringify(response.data))
  // console.log(lat)
  // console.log(lng)
// })()


app.post('/upload-csv', upload.single('csvFile'), async (req, res) => {
 
  try {

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

   
   
    const csvUsers = await parseCSV(req.file.buffer);
  
    const { enrichedData, errors } = await processCSV(csvUsers);
    
   
    await sendBulkEmail(enrichedData, errors);
    await leadsModel.insertMany(enrichedData);
    res.status(200).json({
      success: true,
      processed: enrichedData.length,
      errors: errors.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});


app.listen(5000, () => {
  console.log('API server running on port 5000'); 
});