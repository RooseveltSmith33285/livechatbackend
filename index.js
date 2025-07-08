require('dotenv').config();
const express = require('express');
const axios = require('axios');
const leadsModel=require('./lead')
const newleadsModel=require('./leads')
const { upload, parseCSV } = require('./fileUpload');
const bodyParser = require('body-parser');
const cron=require('node-cron')
const { sha1 }=require('js-sha1');
const cors = require('cors');
const multer=require('multer')
const Mailgun=require('mailgun.js')
const mongoose=require('mongoose')
const FormData=require('form-data')

const PDFDocument = require('pdfkit');
const fs = require('fs');
const nodemailer=require('nodemailer')

const app = express();
const request=require('request');
const enrichedFileModel = require('./fileData');
app.use(bodyParser.json());
app.use(cors());
mongoose.connect('mongodb+srv://user:user@cluster0.pfn059x.mongodb.net/Cluster0?retryWrites=true&w=majority&appName=Cluster0', {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4
});
// mongoose.connect('mongodb://127.0.0.1/livechatleadsnew',{
//   serverSelectionTimeoutMS: 5000,
//   socketTimeoutMS: 45000,
//   family: 4
// })

// mongoose.connect('mongodb://127.0.0.1/livechatleads',{
//   serverSelectionTimeoutMS: 5000,
//   socketTimeoutMS: 45000,
//   family: 4
// })


const processCSV = async (csvUsers) => {
  const enrichedData = [];
  const errors = [];
  
  for (const [index, user] of csvUsers.entries()) {
    try {
     let data;
      
     
      let firstName = user?.Enrichify_First;
      let lastName = (user.Enrichify_Last?.length > 1 ? user.Enrichify_Last : 'N/A');
      let address =  user.Enrichify_Address || 'N/A';
      let email = user.Enrichify_Email || '';
      let phone =  user.Cell || user?.Landline || 'N/A';
      let city =  user.Enrichify_City || '';
      let state = user.Enrichify_State || 'N/A';
      const creditScore = user.Model_Credit

      
        data = {
          ...data,
          FirstName: firstName,
          LastName: lastName,
          Email: email,
          Address: address,
          City: city,
          State: state,
          Phone:phone,
          creditScore,
          Credit_score:creditScore,
          URL: user.Web_Page || '',
          LeadQuality: 'WARM',
          LeadSource: 'ENRICHIFY',
        };
      

      
   
    
      enrichedData.push(data);
      
      await enrichedFileModel.findByIdAndUpdate(user._id, {
        $set: { enriched: true }
      });
      
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


app.get('/livechat', (req, res) => {
  res.send('Livechat is working!');
});


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
  const { startIndex = 0, startDate, endDate, pageSize = 10 } = req.query;

 
  try {
    const filter = {};
    // Convert to numbers
    const parsedPageSize = parseInt(pageSize, 10);
    const parsedStartIndex = parseInt(startIndex, 10);

    // ... (date filter logic remains the same)

    const totalCount = await leadsModel.countDocuments(filter);
    const leads = await leadsModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(parsedStartIndex)
      .limit(parsedPageSize) // Use dynamic page size
      .lean();

    return res.json({
      data: leads,
      totalCount,
      currentPage: Math.floor(parsedStartIndex / parsedPageSize) + 1,
      totalPages: Math.ceil(totalCount / parsedPageSize),
      hasMore: (parsedStartIndex + parsedPageSize) < totalCount
    });
  } catch (e) {
    console.error(e.message);
    res.status(500).json({ error: "Server error while fetching leads" });
  }
});

app.get('/newupdate',async(req,res)=>{
  try{
  
    const timestamp = Math.floor(Date.now() / 1000);
  const username = 'shipmate2019';
  const password = 'Bluefish1923@';
  const projectId = '13129358';
  
  const queryString = `?vn=3&s=summary&s=visitor&f=json&pi=${projectId}&g=daily&t=${timestamp}&u=${username}`;
  
  const sha1String = queryString + password;

  const sha1Hash = sha1(sha1String);

  let response = await axios.get(`https://api.statcounter.com/stats/${queryString}&sha1=${sha1Hash}`);

  let exampleData=[  {
      log_visits: '4',
      entries_in_visit: '22',
      entry_t: '2025-06-09 15:15:46',
      entry_url: 'https://www.flatoutmotorcycles.com/new-models/can-am-atv-outlander-2125194044506333123706978',
      entry_title: 'New Can-Am Outlander Models For Sale in Indianapolis, IN Flat Out Motorsports Indianapolis, IN (317) 890-9110', 
      se_keywords: '***Encrypted Search***',
      link: 'https://www.google.com/',
      country_name: 'United States',
      state: 'Illinois',
      res: '375x812',
      exit_t: '2025-06-09 15:19:47',
      exit_url: 'https://www.flatoutmotorcycles.com/new-models/2025-can-am-outlander-xt-850-29211390b',
      exit_title: 'New Models Flat Out Motorsports Indianapolis, IN (317) 890-9110',
      returning_count: '3',
      session_num: '4',
      browser_name: 'iPhone',
      browser_version: '0',
      os: 'iOS',
      width: '375',
      height: '812',
      javascript: '1',
      country: 'US',
      city: 'Chicago',
      isp: 'iCloud Private Relay',
      ip_address: '104.28.104.17',
      ip_label: '',
      visitor_uuid: '91CD45B530AE4432A08327ABE682BE69',
      latitude: '41.8835',
      longitude: '-87.6305',
      num_entry: '57',
      visit_length: '4 mins 1 sec'
    },
    {
      log_visits: '1',
      entries_in_visit: '6',
      entry_t: '2025-06-09 15:16:25',
      entry_url: 'https://www.flatoutmotorcycles.com/itemgroup/can-am-maverick-23',
      entry_title: 'Featured Vehicles Flat Out Motorsports Indianapolis, IN (317) 890-9110',
      se_keywords: '***Encrypted Search***',
      link: 'https://www.google.com/',
      country_name: 'United States',
      state: 'Illinois',
      res: '430x932',
      exit_t: '2025-06-09 15:18:33',
      exit_url: 'https://www.flatoutmotorcycles.com/inventory/2024-can-am-maverick-x3-xds-turbo-rr-indianapolis-in-46256-12491434i',      exit_title: 'Inventory Unit Detail Flat Out Motorsports Indianapolis, IN (317) 890-9110',
      returning_count: '0',
      session_num: '1',
      browser_name: 'iPhone',
      browser_version: '0',
      os: 'iOS',
      width: '430',
      height: '932',
      javascript: '1',
      country: 'US',
      city: 'Palatine',
      isp: 'Verizon Wireless',
      ip_address: '174.200.180.2',
      ip_label: '',
      visitor_uuid: 'C3216BD1E9994E2CBFB88EBA0A5A4B32',
      latitude: '42.1112',
      longitude: '-88.0439',
      num_entry: '6',
      visit_length: '2 mins 8 secs'
    },
    {
      log_visits: '1',
      entries_in_visit: '6',
      entry_t: '2025-06-09 15:17:05',
      entry_url: 'https://www.flatoutmotorcycles.com/search/inventory/type/PWC',
      entry_title: 'PWC Flat Out Motorsports Indianapolis, IN (317) 890-9110',
      se_keywords: '',
      link: 'https://www.flatoutmotorcycles.com/?utm_source=google&utm_medium=organic&utm_campaign=GMB-service',
      country_name: 'United States',
      state: 'Indiana',
      res: '402x874',
      exit_t: '2025-06-09 15:17:37',
      exit_url: 'https://www.flatoutmotorcycles.com/inventory/2025-sea-doo-spark-3up-trixx-indianapolis-in-46256-12748663i',        
      exit_title: 'Inventory Unit Detail Flat Out Motorsports Indianapolis, IN (317) 890-9110',
      returning_count: '0',
      session_num: '1',
      browser_name: 'iPhone',
      browser_version: '0',
      os: 'iOS',
      width: '402',
      height: '874',
      javascript: '1',
      country: 'US',
      city: 'Fishers',
      ip_address: '68.57.239.40',
      ip_label: '',
      visitor_uuid: '3A37AC9DB97A4FA9ACC1D0245BB26580',
      latitude: '39.9564',
      longitude: '-85.9651',
      num_entry: '6',
      visit_length: '32 seconds'
    }
  ]


  const filteredData = response.data.sc_data.filter(item => {
    const locationMatch = item.country_name === 'United States' &&
                         item?.state?.toLowerCase() === 'indiana';
    
    const sessionLengthInSeconds = convertToSeconds(item.visit_length);
    const sessionLengthMatch = sessionLengthInSeconds <= 120;
    
    const pageViewsMatch = parseInt(item.entries_in_visit) >= 3;
    
    const sessionsMatch = parseInt(item.session_num) >= 3;
    
    return locationMatch && sessionLengthMatch && pageViewsMatch && sessionsMatch;
  });
  console.log(filteredData)
  return;
  const results = [];
  for (const [i, val] of exampleData.entries()) {
      const datazappResponse = await axios.post(
          'https://secureapi.datazapp.com/Appendv2',
          { 
            ApiKey: "NKBTHXMFEJ",           
            AppendModule: "ReverseIPAppend",
            AppendType: 5,
            Isb2bOnly: 0,
            Data: [{IP: val.ip_address}]           
          }
      );
      
      if (datazappResponse?.data?.ResponseDetail.Data[0]?.Email) {
  
          let data=datazappResponse?.data?.ResponseDetail.Data[0]
  const params = {
      format: "json",
      id: "DvHdwMzHAPvQ4quyNYq8a4**", 
      act: "Append,Check,Verify,Move",
      cols: "AddressLine1,City,State,PostalCode,EmailAddress,TopLevelDomain",
      first:data.FirstName,
      last: data.LastName,
      full:data.FirstName+' '+data.LastName,
      a1: data.Address,
      city:data.City,
      state: data.State,
      email: data.Email,
      phone: data.Cell,
    };
  
    const creditScore = Math.floor(Math.random() * (789 - 480 + 1)) + 480;

    const response = await axios.get(
      "https://personator.melissadata.net/v3/WEB/ContactVerify/doContactVerify",
      { params }
    );
    if(response.data.Records[0]?.City?.trim()?.length>0){
  let dataToBePushed={...response.data.Records[0],
      LeadQuality:'WARM',
      LeadSource:'ENRICHIFY',
      exit_url:val.exit_url,
      entry_url:val.entry_url,
      creditScore
  }
  
      results.push(dataToBePushed);
    }else{
      let dataToBePushed={...datazappResponse?.data?.ResponseDetail?.Data[0],
        LeadQuality:'WARM',
        LeadSource:'ENRICHIFY',
        exit_url:val.exit_url,
        entry_url:val.entry_url,
        creditScore
    }
      results.push(dataToBePushed);
    }
  if(results.length>0){
    console.log(results);

    await newleadsModel.insertMany(results)
  }
          
      }
      
  }
  
  console.log(results)
  }catch(e){
console.log(e.message)
  }
})

app.post('/webhook/livechat', async (req, res) => {
  
  try {
    let data;
    const income = '$' + (Math.floor(Math.random() * 45001) + 75000).toLocaleString('en-US');
  
    if(!req?.body?.payload){  
      return res.status(400).json({
        error:"No Lead found"
      })
    }
    const chat = req.body.payload.chat;

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

    

    console.log("DATAZAPP DATA FOR WEBHOOK")
    console.log(JSON.stringify(datazappResponse?.data))

   
if(datazappResponse?.data?.ResponseDetail?.Data!=null && datazappResponse?.data?.ResponseDetail?.Data[0]?.FirstName?.length>0){
 
  data=datazappResponse.data?.ResponseDetail?.Data[0];
  data={
    ...data,
    URL:longestPage.url,
    LeadQuality:'WARM',
    LeadSource:'ENRICHIFY',
    income 
  }
}



let firstName = datazappResponse.data.ResponseDetail.Data[0]?.FirstName 
    ? datazappResponse.data.ResponseDetail.Data[0]?.FirstName 
    : chat?.users[0]?.name?.split(' ')[0]

let lastName = datazappResponse.data.ResponseDetail.Data[0]?.LastName 
    ? datazappResponse.data.ResponseDetail.Data[0]?.LastName 
    : (chat?.users[0]?.name?.split(' ')?.length > 1 
        ? chat?.users[0]?.name?.split(' ')[1] 
        : 'N/A')
        
let address=datazappResponse.data.ResponseDetail.Data[0]?.Address?datazappResponse.data.ResponseDetail.Data[0]?.Address:'N/A'
let email=datazappResponse.data.ResponseDetail.Data[0]?.Email?datazappResponse.data.ResponseDetail.Data[0]?.Email:useremail
let phone=datazappResponse.data.ResponseDetail.Data[0]?.Phone?datazappResponse.data.ResponseDetail.Data[0]?.Phone:'N/A'
let city=datazappResponse.data.ResponseDetail.Data[0]?.City?datazappResponse.data.ResponseDetail.Data[0]?.City:chat?.users[0]?.last_visit?.geolocation?.city
let state=datazappResponse.data.ResponseDetail.Data[0]?.State?datazappResponse.data.ResponseDetail.Data[0]?.State:chat?.users[0]?.last_visit?.geolocation?.region


console.log("Data")
console.log(city)
console.log(state)
console.log(phone)
console.log(email)
console.log(address)
console.log(lastName)
console.log(firstName)


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

  if(!data){
    data={
      ...data,
      URL:longestPage.url,
      LeadQuality:'WARM',
      LeadSource:'ENRICHIFY',
      firstName:firstName,
      lastName,
      address,
      city,
      state,
      Title:"Live",
      income,
      email,
      phone,
      City:city,
      State:state,
      Email:email,
      Phone:phone,
      FirstName:firstName,
      Address:address,
      LastName:lastName
    }
  }

if(data){

  

  const creditScore = Math.floor(Math.random() * (789 - 480 + 1)) + 480;

data={
  ...data,
  Credit_score:creditScore,
  Title:"Live",
  income 
}

await sendEmailWithAttachment('',data,longestPage.url,creditScore);

console.log("DATA TO BE INSERTED INTO MODEL")
console.log(data)
let alreadyExists=await leadsModel.findOne({Email:data.Email})
if(!alreadyExists){
  console.log("CREATING")
  await leadsModel.create(data);
  const mailOptions = {
    from: '"Lead System" <shipmate2134@gmail.com>',
    to: 'lemightyeagle@gmail.com',
    subject: 'Lead Email Sent to Client',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">
          Lead Notification Sent to Client
        </h2>
        
        <p style="color: #2c3e50; margin-bottom: 20px;">
          This is to inform you that a lead notification email has been successfully sent to the client.
        </p>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <tr>
            <td style="padding: 10px; background-color: #f8f9fa; width: 30%;">Client Name</td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">${data?.FirstName || data?.NameFull?.split(' ')[0] || 'N/A'} ${data?.LastName || data?.NameFull?.split(' ')[1] || ''}</td>
          </tr>
          <tr>
            <td style="padding: 10px; background-color: #f8f9fa;">Client Email</td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">${data?.EmailAddress || data?.Email || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 10px; background-color: #f8f9fa;">Notification Type</td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">Lead Confirmation</td>
          </tr>
          <tr>
            <td style="padding: 10px; background-color: #f8f9fa;">Lead Source</td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">ENRICHIFY</td>
          </tr>
          <tr>
            <td style="padding: 10px; background-color: #f8f9fa;">Status</td>
            <td style="padding: 10px; border: 1px solid #dee2e6; color: #27ae60;">Successfully Sent</td>
          </tr>
          <tr>
            <td style="padding: 10px; background-color: #f8f9fa;">Sent At</td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">${new Date().toLocaleString()}</td>
          </tr>
        </table>
  
        <div style="margin-top: 30px; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #3498db;">
          <h4 style="margin-top: 0; color: #2c3e50;">Next Steps</h4>
          <ul style="margin-bottom: 0; color: #7f8c8d;">
            <li>The client has been notified about their lead submission</li>
            <li>Lead details have been recorded in the system</li>
            <li>Please follow up with the client within 24 hours</li>
          </ul>
        </div>
        
        <p style="margin-top: 20px; color: #7f8c8d; font-size: 0.9em;">
          This is an automated notification. Please do not reply to this email.
        </p>
      </div>
    `
  };
    
   const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user:'leads@enrichifydata.com', 
          pass: 'cazhzgbslrzvyjfc' 
        }
      });
      const info = await transporter.sendMail(mailOptions);

      console.log("info for email that we send to mightyeagle")
      console.log(info)
}
const mailFailedOptions = {
  from: '"Lead System" <shipmate2134@gmail.com>',
  to: 'lemightyeagle@gmail.com',
  subject: 'Failed: Lead Already Exists',
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #e74c3c; border-bottom: 2px solid #e74c3c; padding-bottom: 10px;">
        ⚠️ Lead Submission Failed
      </h2>
      
      <div style="background-color: #fdecea; padding: 15px; border-radius: 4px; margin-bottom: 20px;">
        <p style="color: #c0392b; margin: 0; font-weight: bold;">
          The lead could not be sent to the client because this lead already exists in our system.
        </p>
      </div>
      
      <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
        <tr>
          <td style="padding: 10px; background-color: #f8f9fa; width: 30%;">Client Name</td>
          <td style="padding: 10px; border: 1px solid #dee2e6;">${data?.FirstName || data?.NameFull?.split(' ')[0] || 'N/A'} ${data?.LastName || data?.NameFull?.split(' ')[1] || ''}</td>
        </tr>
        <tr>
          <td style="padding: 10px; background-color: #f8f9fa;">Client Email</td>
          <td style="padding: 10px; border: 1px solid #dee2e6;">${data?.EmailAddress || data?.Email || 'N/A'}</td>
        </tr>
        <tr>
          <td style="padding: 10px; background-color: #f8f9fa;">Phone Number</td>
          <td style="padding: 10px; border: 1px solid #dee2e6;">${data?.PhoneNumber || data?.Cell || 'N/A'}</td>
        </tr>
        <tr>
          <td style="padding: 10px; background-color: #f8f9fa;">Lead Source</td>
          <td style="padding: 10px; border: 1px solid #dee2e6;">ENRICHIFY</td>
        </tr>
        <tr>
          <td style="padding: 10px; background-color: #f8f9fa;">Status</td>
          <td style="padding: 10px; border: 1px solid #dee2e6; color: #e74c3c;">Failed - Duplicate Lead</td>
        </tr>
        <tr>
          <td style="padding: 10px; background-color: #f8f9fa;">Attempted At</td>
          <td style="padding: 10px; border: 1px solid #dee2e6;">${new Date().toLocaleString()}</td>
        </tr>
      </table>

      <div style="margin-top: 30px; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #e74c3c;">
        <h4 style="margin-top: 0; color: #2c3e50;">Recommended Actions</h4>
        <ul style="margin-bottom: 0; color: #7f8c8d;">
          <li>Check if this is a legitimate duplicate submission</li>
          <li>Verify the client's information in the CRM</li>
          <li>If this is a new inquiry, investigate potential system issues</li>
          <li>Contact the client if follow-up is needed</li>
        </ul>
      </div>
      
      <p style="margin-top: 20px; color: #7f8c8d; font-size: 0.9em;">
        System ID: ${Math.random().toString(36).substring(2, 10).toUpperCase()}
        <br>
        This is an automated notification. Please do not reply to this email.
      </p>
    </div>
  `
};


  
 const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user:'leads@enrichifydata.com', 
        pass: 'cazhzgbslrzvyjfc' 
      }
    });
    const info = await transporter.sendMail(mailFailedOptions);
    console.log("info for failed email that we send to mightyeagle")
    console.log(info)
}

return res.status(200).json({
  message:"Sucessfully"
})


  } catch (err) {
   
    console.error(err.message);
    res.status(500).json({ error: 'Error processing lead.' });
  }
});

function convertToSeconds(visitLength) {
  if (!visitLength) return 0;
  
  let totalSeconds = 0;
  const parts = visitLength.toLowerCase().split(' ');
  
  for (let i = 0; i < parts.length; i++) {
    if (parts[i].includes('min')) {
      totalSeconds += parseInt(parts[i-1]) * 60;
    } else if (parts[i].includes('sec')) {
      totalSeconds += parseInt(parts[i-1]);
    }
  }
  
  return totalSeconds;
}

async function sendEmailWithAttachment(fileContent,data,pageUrl,creditScore) {
if(!creditScore){
  creditScore = Math.floor(Math.random() * (789 - 480 + 1)) + 480;
}
    
    
  const mailOptions = {
    from: '"Lead System" <shipmate2134@gmail.com>',
    to:'internetleads@flatoutmotorcycles.com',
    subject: 'Enrichify Lead System ',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">
          New Enrichify Lead
        </h2>
           <p style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">
          Live
        </p>
        
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


const sendNewLeads=async(data)=>{
        
      let random=Math.floor(Math.random() * (789 - 480 + 1)) + 480
      const income = '$' + (Math.floor(Math.random() * 45001) + 75000).toLocaleString('en-US');
      const mailOptions = {
        from: '"Lead System" <shipmate2134@gmail.com>',
      to:'internetleads@flatoutmotorcycles.com',
        subject: 'Enrichify Lead System ',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">
              New Enrichify Lead
            </h2>

               <p style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">
             Website
            </p>
            
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
                <td style="padding: 10px; border: 1px solid #dee2e6;">${data?.Phone || data?.Cell || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 10px; background-color: #f8f9fa;">URL</td>
                <td style="padding: 10px; border: 1px solid #dee2e6;">
                <a href="${data?.exit_url}" target="_blank">${data?.exit_url}</a>
                </td>
          
              </tr>


                <tr>
                <td style="padding: 10px; background-color: #f8f9fa;">Income</td>
                <td style="padding: 10px; border: 1px solid #dee2e6;">
      ${income}
                </td>
          
              </tr>
              
                <tr>
                <td style="padding: 10px; background-color: #f8f9fa;">URL</td>
               
                 <td style="padding: 10px; border: 1px solid #dee2e6;">
                  <a href="${data?.entry_url}" target="_blank">${data?.entry_url}</a>
                </td>
              </tr>

               <tr>
                <td style="padding: 10px; background-color: #f8f9fa;">Credit Score</td>
                <td style="padding: 10px; border: 1px solid #dee2e6;">${random || 'N/A'}</td>
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
        await newleadsModel.findByIdAndUpdate(data._id,{
          $set:{
            Enriched:true

          }
        })

        let transformedData={
          FirstName: data.FirstName || '',
          LastName: data.LastName || '',
          Email: data.Email || '',
          Phone: data.Phone || '',
         entry_url: data.entry_url  || '', 
         exit_url:data.exit_url || '',
          LeadSource: data.LeadSource || 'ENRICHIFY',
          LeadQuality: data.LeadQuality || 'MEDIUM',
          Address: data.Address || '',
          State: data.State || '',
          Credit_score: data.creditScore || Math.floor(Math.random() * (789 - 480 + 1)) + 480,
          Title:"Website",
          income:income
        }
await leadsModel.create(transformedData)
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

app.post('/reuploadfile',upload.single('csvFile'),async(req,res)=>{
  try{
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const csvUsers = await parseCSV(req.file.buffer);
    let newCSVUsers=csvUsers.filter(u=>u?.FirstName?.length!=0 && u?.LastName?.length!=0 && u?.Address?.length!=0)
console.log(newCSVUsers)
newCSVUsers=newCSVUsers.map((val,i)=>{
  return {
    ...val,
    Type:"Website"
  }
})
await newleadsModel.insertMany(newCSVUsers);
return res.status(200).json({
  message:"successfully captured leads"
})
  }catch(e){
    console.log(e.message)
    return res.status(500).json({
       success: false,
       error: e.message
     });
  }
})


app.post('/enrichifystatcounter', upload.single('csvFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const csvUsers = await parseCSV(req.file.buffer);
    const results = [];


    for (const [i, val] of csvUsers.entries()) {
      try {
        console.log(`Processing row ${i + 1}/${csvUsers.length}`);
        

        const trimmedVal = {};
        Object.keys(val).forEach(key => {
          trimmedVal[key.trim()] = val[key];
        });

      
        console.log(`Row ${i + 1}: Calling DATAZAPP API`);
        const datazappResponse = await axios.post(
          'https://secureapi.datazapp.com/Appendv2',
          { 
            ApiKey: "NKBTHXMFEJ",
            AppendModule: "ReverseIPAppend",
            AppendType: 5,
            Isb2bOnly: 0,
            Data: [{ IP: trimmedVal['IP Address'] }]
          }
        );
        console.log("STATCOUNTER DATAZAPP")
        console.log(JSON.stringify(datazappResponse.data))

        if (!datazappResponse?.data?.ResponseDetail?.Data?.length) {
          console.log(`Row ${i + 1}: No DATAZAPP results`);
          continue;
        }

        const datazappData = datazappResponse.data.ResponseDetail.Data[0];
        console.log(`Row ${i + 1}: DATAZAPP results found`, datazappData);

        const params = {
          format: "json",
          id: "DvHdwMzHAPvQ4quyNYq8a4**",
          act: "Append,Check,Verify,Move",
          cols: "AddressLine1,City,State,PostalCode,EmailAddress,TopLevelDomain",
          first: datazappData.FirstName,
          last: datazappData.LastName,
          Title:"Website",
          full: `${datazappData.FirstName} ${datazappData.LastName}`,
          a1: datazappData.Address,
          city: datazappData.City,
          state: datazappData.State,
          email: datazappData.Email,
          phone: datazappData.Cell,
        };

    
        const creditScore = Math.floor(Math.random() * (789 - 480 + 1)) + 480;

       
        console.log(`Row ${i + 1}: Calling MELISA API`);
        const melissaResponse = await axios.get(
          "https://personator.melissadata.net/v3/WEB/ContactVerify/doContactVerify",
          { params }
        );

        const melissaRecords = melissaResponse.data.Records || [];
        console.log(`Row ${i + 1}: MELISA response`, melissaRecords);

   
        if (melissaRecords.length > 0 && melissaRecords[0]?.City?.trim()) {
          console.log(`Row ${i + 1}: Using MELISA data`);
          results.push({
            ...melissaRecords[0],
            LeadQuality: 'WARM',
            LeadSource: 'ENRICHIFY',
            exit_url: trimmedVal['Web Page'],
            entry_url: trimmedVal['Referring Link'],
            Title:"Website",
            creditScore
          });
        } else {
          console.log(`Row ${i + 1}: Using DATAZAPP data`);
          results.push({
            ...datazappData,
            LeadQuality: 'WARM',
            LeadSource: 'ENRICHIFY',
            exit_url: trimmedVal['Web Page'],
            entry_url: trimmedVal['Referring Link'],
            creditScore,
            Title:"Website"
          });
        }
      } catch (error) {
        console.error(`Row ${i + 1} failed:`, error.message);
      }
    }

    console.log("Processing complete. Total results:", results.length);

  
    if (results.length > 0) {
      return res.status(200).json({
        message: "Successfully processed",
        results
      });
    } else {
      return res.status(404).json({
        error: "No valid records found",
        results: []
      });
    }
    
  } catch (error) {
    console.error("Top-level error:", error.message);
    return res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});


app.post('/upload-csv', upload.single('csvFile'), async (req, res) => {
 
  try {

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

   
    const csvUsers = await parseCSV(req.file.buffer);

    let modifiedCsvUsers = csvUsers.map((val, i) => {
      
      let trimmedVal = {};
      Object.keys(val).forEach(key => {
        trimmedVal[key.trim()] = val[key];
      });
    
      return {
        ...trimmedVal,
        Google_Search_Keyword: trimmedVal['Google Search Keyword'],
        Web_Page: trimmedVal['Web Page'],
        Lead_Quality: trimmedVal['Lead Quality'] !== undefined ? trimmedVal['Lead Quality'] : undefined,
        Model_Credit: trimmedVal['Model Credit'] !== undefined ? trimmedVal['Model Credit'] : undefined,
        Income_Range: trimmedVal['Income Range'] !== undefined ? trimmedVal['Income Range'] : undefined,
        Enrichify_Email:trimmedVal['Enrichify_Email']
      };
    });
    
 
    await enrichedFileModel.create(modifiedCsvUsers)


    return res.status(200).json({
      message:"Sucessfully updated"
    })
  } catch (error) {
    console.log(error.message)
   return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

const enrichFile = async (csvUsers) => {
// let {enrichedData, errors }=await processCSV(csvUsers);

console.log("ENRICHFILE")
console.log(csvUsers)
 
  for (const data of csvUsers) {
   
    await sendNewLeads(data);
  }

 
  // await leadsModel.insertMany(enrichedData);
};



// cron.schedule('0 0 * * *', async () => {
  cron.schedule('0 * * * *', async () => {
 try{
  console.log("CRON RUN")
  const batchUsers = await newleadsModel.find({ 
    Enriched: false,
    Email: { $ne: null, $exists: true }
  });

  const batchUsersLimit = await newleadsModel.find({ 
    Enriched: false,
    Email: { $ne: null, $exists: true }
  }).limit(5);
  
  
  const alreadyEnriched = await newleadsModel.find({ Enriched: true });
  
  let uniqueUnenriched = [];
  let uniqueUnenrichedLimited=[];
  const processedEmails = new Set();
  const processedEmailsLimited = new Set();
  for (let i = 0; i < batchUsers.length; i++) {
    const currentEmail = batchUsers[i].Email;
    
  
    if (processedEmails.has(currentEmail)) {
      continue;
    }
    
   
    const alreadyExists = alreadyEnriched.some(u => u.Email === currentEmail);
    
    if (!alreadyExists) {
      uniqueUnenriched.push(batchUsers[i]);
      processedEmails.add(currentEmail);
      const mailOptions = {
        from: '"Lead System" <shipmate2134@gmail.com>',
        to: 'lemightyeagle@gmail.com',
        subject: 'Lead Email Sent to Client',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">
              Lead Notification Sent to Client
            </h2>
            
            <p style="color: #2c3e50; margin-bottom: 20px;">
              This is to inform you that a lead notification email has been successfully sent to the client.
            </p>
            
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
              <tr>
                <td style="padding: 10px; background-color: #f8f9fa; width: 30%;">Client Name</td>
                <td style="padding: 10px; border: 1px solid #dee2e6;">${batchUsers[i].FirstName || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 10px; background-color: #f8f9fa;">Client Email</td>
                <td style="padding: 10px; border: 1px solid #dee2e6;">${batchUsers[i]?.Email || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 10px; background-color: #f8f9fa;">Notification Type</td>
                <td style="padding: 10px; border: 1px solid #dee2e6;">Lead Confirmation</td>
              </tr>
              <tr>
                <td style="padding: 10px; background-color: #f8f9fa;">Lead Source</td>
                <td style="padding: 10px; border: 1px solid #dee2e6;">ENRICHIFY</td>
              </tr>
              <tr>
                <td style="padding: 10px; background-color: #f8f9fa;">Status</td>
                <td style="padding: 10px; border: 1px solid #dee2e6; color: #27ae60;">Successfully Sent</td>
              </tr>
              <tr>
                <td style="padding: 10px; background-color: #f8f9fa;">Sent At</td>
                <td style="padding: 10px; border: 1px solid #dee2e6;">${new Date().toLocaleString()}</td>
              </tr>
            </table>
      
            <div style="margin-top: 30px; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #3498db;">
              <h4 style="margin-top: 0; color: #2c3e50;">Next Steps</h4>
              <ul style="margin-bottom: 0; color: #7f8c8d;">
                <li>The client has been notified about their lead submission</li>
                <li>Lead details have been recorded in the system</li>
                <li>Please follow up with the client within 24 hours</li>
              </ul>
            </div>
            
            <p style="margin-top: 20px; color: #7f8c8d; font-size: 0.9em;">
              This is an automated notification. Please do not reply to this email.
            </p>
          </div>
        `
      };
        
       const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user:'leads@enrichifydata.com', 
              pass: 'cazhzgbslrzvyjfc' 
            }
          });
          const info = await transporter.sendMail(mailOptions);
    }else{
      const mailFailedOptions = {
        from: '"Lead System" <shipmate2134@gmail.com>',
        to: 'lemightyeagle@gmail.com',
        subject: 'Failed: Lead Already Exists',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #e74c3c; border-bottom: 2px solid #e74c3c; padding-bottom: 10px;">
              ⚠️ Lead Submission Failed
            </h2>
            
            <div style="background-color: #fdecea; padding: 15px; border-radius: 4px; margin-bottom: 20px;">
              <p style="color: #c0392b; margin: 0; font-weight: bold;">
                The lead could not be sent to the client because this lead already exists in our system.
              </p>
            </div>
            
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
              <tr>
                <td style="padding: 10px; background-color: #f8f9fa; width: 30%;">Client Name</td>
                <td style="padding: 10px; border: 1px solid #dee2e6;">${batchUsers[i].FirstName || 'N/A'} ${batchUsers[i].LastName || ''}</td>
              </tr>
              <tr>
                <td style="padding: 10px; background-color: #f8f9fa;">Client Email</td>
                <td style="padding: 10px; border: 1px solid #dee2e6;">${batchUsers[i].Email || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 10px; background-color: #f8f9fa;">Phone Number</td>
                <td style="padding: 10px; border: 1px solid #dee2e6;">${batchUsers[i].PhoneNumber || batchUsers[i].Cell || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 10px; background-color: #f8f9fa;">Lead Source</td>
                <td style="padding: 10px; border: 1px solid #dee2e6;">ENRICHIFY</td>
              </tr>
              <tr>
                <td style="padding: 10px; background-color: #f8f9fa;">Status</td>
                <td style="padding: 10px; border: 1px solid #dee2e6; color: #e74c3c;">Failed - Duplicate Lead</td>
              </tr>
              <tr>
                <td style="padding: 10px; background-color: #f8f9fa;">Attempted At</td>
                <td style="padding: 10px; border: 1px solid #dee2e6;">${new Date().toLocaleString()}</td>
              </tr>
            </table>
      
            <div style="margin-top: 30px; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #e74c3c;">
              <h4 style="margin-top: 0; color: #2c3e50;">Recommended Actions</h4>
              <ul style="margin-bottom: 0; color: #7f8c8d;">
                <li>Check if this is a legitimate duplicate submission</li>
                <li>Verify the client's information in the CRM</li>
                <li>If this is a new inquiry, investigate potential system issues</li>
                <li>Contact the client if follow-up is needed</li>
              </ul>
            </div>
            
            <p style="margin-top: 20px; color: #7f8c8d; font-size: 0.9em;">
              System ID: ${Math.random().toString(36).substring(2, 10).toUpperCase()}
              <br>
              This is an automated notification. Please do not reply to this email.
            </p>
          </div>
        `
      };
      
      
        
       const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user:'leads@enrichifydata.com', 
              pass: 'cazhzgbslrzvyjfc' 
            }
          });
          const info = await transporter.sendMail(mailFailedOptions);
       
    }
  }
  

  // for (let i = 0; i < batchUsersLimit.length; i++) {
  //   const currentEmail = batchUsersLimit[i].Email;
    
  
  //   if (processedEmailsLimited.has(currentEmail)) {
  //     continue;
  //   }
    
   
  //   const alreadyExists = alreadyEnriched.some(u => u.Email === currentEmail);
    
  //   if (!alreadyExists) {
  //     uniqueUnenrichedLimited.push(batchUsers[i]);
  //     processedEmailsLimited.add(currentEmail);
  //   }
  // }
  const count = uniqueUnenriched.length;
  console.log("count")
  console.log(count)
  console.log('batchusers')
  console.log(batchUsers)
if(count<=15){
  const mailOptions = {
    from: '"Lead Enrichment System" <shipmate2134@gmail.com>',
    to: 'shipmate2134@gmail.com',
    subject: '⚠️ Action Required: Your Leads Inventory Is Running Low',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 25px;">
          <div style="background-color: #fff8e1; border-radius: 50%; width: 80px; height: 80px; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center;">
            <span style="font-size: 40px; color: #ffa000;">⚠️</span>
          </div>
          <h1 style="color: #d32f2f; margin: 0;">Leads Inventory Low</h1>
        </div>
        
        <div style="background-color: #fffde7; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
          <p style="font-size: 18px; color: #5d4037; margin-top: 0;">
            Your lead inventory has dropped below the recommended threshold. 
            To maintain continuous enrichment processing:
          </p>
          
          <div style="margin: 25px 0; text-align: center;">
            <div style="display: inline-block; background: #ffecb3; border-radius: 16px; padding: 8px 25px;">
              <span style="font-size: 32px; font-weight: bold; color: #e65100;">${count}</span>
              <span style="display: block; font-size: 14px; color: #5d4037;">REMAINING LEADS</span>
            </div>
          </div>
          
          <p style="font-size: 16px; margin-bottom: 0;">
            <strong>Immediate action is recommended</strong> to avoid interruptions in your lead processing pipeline.
          </p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://leadfrontend.vercel.app" 
             style="display: inline-block; background-color: #388e3c; color: white; 
                    padding: 14px 35px; border-radius: 4px; font-size: 18px; 
                    font-weight: bold; text-decoration: none; text-align: center;">
            ➕ Add More Leads Now
          </a>
        </div>
        
        <div style="border-top: 1px solid #eee; padding-top: 20px; color: #757575;">
          <h3 style="margin-top: 0;">Recommended Next Steps:</h3>
          <ol style="padding-left: 20px;">
            <li>Upload new lead lists through the dashboard</li>
            <li>Check your integration connections</li>
            <li>Review your lead acquisition sources</li>
          </ol>
          
          <p style="font-size: 14px; margin-bottom: 5px;">
            <strong>Need assistance?</strong> Reply to this email or contact our support team
          </p>
          <p style="font-size: 12px; color: #9e9e9e; margin-top: 25px;">
            This is an automated notification. Current lead count as of ${new Date().toLocaleString()}
          </p>
        </div>
      </div>
    `
  };

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user:'leads@enrichifydata.com', 
      pass: 'cazhzgbslrzvyjfc' 
    }
  });
  const info = await transporter.sendMail(mailOptions);
}
  console.log(uniqueUnenrichedLimited)
  enrichFile(uniqueUnenrichedLimited)
 }catch(e){
  console.log(e.message)
 }
});

app.listen(5000, () => {
  console.log('API server running on port 5000'); 
});