const mongoose=require('mongoose')

const leadSchema=mongoose.Schema({
    FirstName:{
        type:String,
        required:true
    },
    LastName:{
        type:String,
        required:true
    },
    Email:{
        type:String,
        required:true
    },
    Phone:{
        type:String,
    },
    URL:{
        type:String,
       
    },
    entry_url:{
        type:String,
        required:false
    },
    exit_url:{
        type:String,
        required:false
    },
    LeadSource:{
        type:String,
        required:true
    },
    LeadQuality:{
        type:String,
        required:true
    },
    Address:{
        type:String,
        required:true
    },
    State:{
        type:String,
        required:true
    },
    Credit_score:{
        type:String,
        required:true
    }
},{
    timestamps:true
})



const leadModel=mongoose.model('lead',leadSchema)

module.exports=leadModel