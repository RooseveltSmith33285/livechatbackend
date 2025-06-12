const mongoose = require('mongoose')

const leadsSchema = mongoose.Schema({
    Title:{
type:String
    },
    FirstName: {
        type: String,
        required: true
    },
    LastName: {
        type: String,
        required: true
    },
    Email: {
        type: String,
        required: true
    },
    Phone: {
        type: String,
    },
    exit_url: {
        type: String,
        required: false 
    },
    entry_url: {
        type: String,
        required: false 
    },
    LeadSource: {
        type: String,
        required: false 
    },
    LeadQuality: {
        type: String,
        required: false 
    },
    Address: {
        type: String,
       
    },
    State: {
        type: String,
   
    },
    creditScore: {
        type: String,
        required: false 
    },
    Enriched: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
})

const leadsModel = mongoose.model('timerleads', leadsSchema)
module.exports = leadsModel