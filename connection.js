const mongoose=require('mongoose')

const connect=mongoose.connect(`mongodb+srv://user:user@cluster0.pfn059x.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`)
module.exports=connect;