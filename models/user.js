const mongoose=require('mongoose');

const userSchema=new mongoose.Schema({
    username:{type:'string',required:true,unique:true},
    email:{type:'string',required:true,unique:true},
    password:{type:'string',required:true},
    tasks:[
        {
            type:mongoose.Types.ObjectId,
            ref:"task",
        }
    ],
},{timestamps:true})

module.exports=mongoose.model("user",userSchema);