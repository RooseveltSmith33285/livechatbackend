const mongoose=require('mongoose')

const fileDataSchema=mongoose.Schema({
    Web_Page:{
        type:String,
    },
    Google_Search_Keyword:{
        type:String,
    },
    Enrichify_Last:{
        type:String
    },
    Enrichify_First:{
type:String
    },
    Enrichify_Address:{
        type:String
    },
    Enrichify_City:{
        type:String
    },
    Enrichify_State:{
        type:String,
    },
    Enrichify_Zipcode:{
        type:String,
    },
    Enrichify_Email:{
type:String
    },
    Lead_Quality :{
        type:String
    },
    Cell:{
        type:String
    },
    Landline:{
        type:String
    },
    Model_Credit :{
        type:String
    },
    Income_Range :{
type:String
    },
    enriched:{
        type:Boolean,
        default:false
    }
})


const enrichedFileModel=mongoose.model('file',fileDataSchema)
module.exports=enrichedFileModel