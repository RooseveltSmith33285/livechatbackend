
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const cors=require('cors')

const app = express();
app.use(bodyParser.json());
app.use(cors())

app.post('/webhook/livechat', async (req, res) => {
  try {
    const { ip, url } = req.body;
    console.log(ip)
    console.log(req.body)
    return res.send(ip)
    const datazappResponse = await axios.post(
      'https://api.datazapp.com/reverse-ip-append',
      { ip },
      { headers: { 'Authorization': `Bearer ${process.env.DATAZAPP_API_KEY}` } }
    );
    const visitorInfo = datazappResponse.data;

    // Step 2: Validate with Melissa Personator
    const personatorParams = new URLSearchParams({
      id: process.env.MELISSA_API_KEY,
      act: 'Check',
      first: visitorInfo.first_name,
      last: visitorInfo.last_name,
      full: `${visitorInfo.first_name} ${visitorInfo.last_name}`,
      email: visitorInfo.email,
      phone: visitorInfo.phone,
      postal: visitorInfo.zip,
      city: visitorInfo.city,
      state: visitorInfo.state,
      format: 'json'
    });

    const melissaResponse = await axios.get(`https://personator.melissadata.net/v3/WEB/ContactVerify/doContactVerify?${personatorParams}`);
    const enrichedData = melissaResponse.data;

    // Step 3: Forward to CRM/DMS
    await axios.post(process.env.CLIENT_CRM_ENDPOINT, {
      ...enrichedData,
      url_visited: url,
      ip_address: ip
    });

    res.status(200).json({ message: 'Lead processed and sent.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error processing lead.' });
  }
});

app.listen(5000, () => {
  console.log('API server running on port 500');
});