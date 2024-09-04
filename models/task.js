const mongoose=require('mongoose');

const TaskSchema=new mongoose.Schema({
    task:{type:'string',required:true},
    desc:{type:'string',required:true},
    important:{type:Boolean,default:false},
    complete:{type:Boolean,default:false},
    createdOn:{type:Date,default:new Date().getTime()}
})

module.exports=mongoose.model("task",TaskSchema);