const express=require('express')
const app=express()
app.use(express.json())

const cors=require('cors')
app.use(cors())

const bcrypt=require('bcryptjs');
const jwt=require('jsonwebtoken');

//importing models user and task models
const User=require('./models/user')
const Task=require('./models/task')

require("dotenv").config();
require('./connection/conn')


//verifying authenticationToken
const authenticateToken = (request, response, next) => {
    let jwtToken;
    const authHeader = request.headers["authorization"];
    if (authHeader !== undefined) {
      jwtToken = authHeader.split(" ")[1];
    }
    if (jwtToken === undefined) {
      response.status(401);
      response.send("Invalid JWT Token");
    } else {
      jwt.verify(jwtToken,'MY_SECRET_TOKEN', async (error, user) => {
        if (error) {
          response.status(401);
          response.send("Invalid JWT Token");
        } else {
          request.user = user;
          next();
        }
      });
    }
  };


//sample API
app.get("/",(request,response)=>{
    response.send("Hello, this is Mahesh, welcome to Task Management System.")
})

app.listen(4001,()=>{
    console.log("server is Running at Port:4001...");
})


//1.sign-up API
app.post('/signup',async(request,response)=>{
    try {
        const {username,email,password}=request.body;

    const existingUser=await User.findOne({username:username});
    const existingEmail=await User.findOne({email:email});

    if(existingUser){
        return response.status(400).json({message:"Username already exists"});
    }
    else if(username.length<4){
        return response.status(400).json({message:"Username should have atleast 4 characters"});
    }
    
    if(existingEmail){
        return response.status(400).json({message:"Email already exists"}); 
    }

    const hashPassword=await bcrypt.hash(password,10);

   
    const newUser=new User({
        username:username,
        email:email,
        password:hashPassword,
    })
    await newUser.save()
    return response.status(200).json({message:"SignUp Successful"});

   
    } catch (error) {
        console.log(error);
        response.status(400).json({message:"Internal Server Error"})
    }
})

//2.login API
app.post('/login',async(request,response)=>{
    try {
        const {email,password}=request.body;

        const existingUser=await User.findOne({email:email})
        if(!existingUser){
            return response.status(400).json({message:"User not found "});
        }else{
            bcrypt.compare(password, existingUser.password, (error, data) => {
                if (error) {
                    return response.status(400).json({ message: "Invalid Password" });
                }
                else {
                    const user={user:existingUser};
                    const token=jwt.sign(user,"MY_SECRET_TOKEN",{expiresIn:"2d"});
                    return response.status(200).json({id:existingUser._id,jwt_token:token});
                }
            })
        }
    } catch (error) {
        console.log(error);
        return response.status(400).json({message:"Internal Server Error"});
    }
    
})


//GET user API
/* app.get("/getUser",authenticateToken,async(request,response)=>{
    const {user}=request.user 

    const isUser=await User.findOne({_id:user._id})

    if(!isUser){
        response.sendStatus(401);
    }else{
        response.json({
            user:isUser,
            message:""
        })
    }

}) */


//3.create task API
app.post('/createTask',authenticateToken,async(request,response)=>{
    try {
        const {task,desc}=request.body;
        const {id}=request.headers;

       if(!task){
            return response.status(400).json({message:"Task is required."})
        }
    
        if(!desc){
            return response.status(400).json({message:"Description is required."})
        } 
    
        const newTask=new Task({
            task:task,
            desc:desc
        })
    
        const saveTask=await newTask.save()
        const taskId=saveTask._id;
        await User.findByIdAndUpdate(id,{$push:{tasks:taskId}})
        response.status(200).json({message:"Task Created"})
    
    } catch (error) {
        console.log(error);
        return response.status(400).json({message:"Internal Server Error"});
    }
})

//4.get all Tasks API
app.get("/getAllTasks",authenticateToken,async(request,response)=>{
    try {
        const {id}=request.headers;
        const userData=await User.findById(id).populate({
            path:"tasks",
            options:{ sort : { createdAt : -1 }},
        });
        response.status(200).json({data:userData})

    } catch (error) {
        console.log(error);
        return response.status(400).json({message:"Internal Server Error"});
   
    }
})
//5.delete tasks API
app.delete('/deleteTask/:id',authenticateToken,async(request,response)=>{
    try {
        const {id}=request.params;
        const userId=request.headers.id;
        await Task.findByIdAndDelete(id);
        await User.findByIdAndUpdate(userId,{$pull:{tasks:id}})
        response.status(200).json({message:"Task deleted successfully"})

    } catch (error) {
        console.log(error);
        return response.status(400).json({message:"Internal Server Error"});
   
    }
})

//6.update task API
app.put('/updateTask/:id',authenticateToken,async(request,response)=>{
    try {
        const {id}=request.params;
        const {task,desc}=request.body;
        await Task.findByIdAndUpdate(id,{task:task,desc:desc});
        response.status(200).json({message:"Task updated successfully"})

    } catch (error) {
        console.log(error);
        return response.status(400).json({message:"Internal Server Error"});
   
    }
})

//7.update Important Task API
app.put('/updateImportantTask/:id',authenticateToken,async(request,response)=>{
    try {
        const {id}=request.params;
        const taskData=await Task.findById(id);
        const impTask=taskData.important;
        await Task.findByIdAndUpdate(id,{important:!impTask});
        response.status(200).json({message:"Task updated successfully"})

    } catch (error) {
        console.log(error);
        return response.status(400).json({message:"Internal Server Error"});
   
    }
})

//8.update complete task API
app.put('/updateCompleteTask/:id',authenticateToken,async(request,response)=>{
    try {
        const {id}=request.params;
        const taskData=await Task.findById(id);
        const completeTask=taskData.complete;
        await Task.findByIdAndUpdate(id,{complete:!completeTask});
        response.status(200).json({message:"Task updated successfully"})

    } catch (error) {
        console.log(error);
        return response.status(400).json({message:"Internal Server Error"});
   
    }
})

//9.get important tasks API
app.get("/getImportantTasks",authenticateToken,async(request,response)=>{
    try {
        const {id}=request.headers;
        const Data=await User.findById(id).populate({
            path:"tasks",
            match:{important:true},
            options:{ sort : { createdAt : -1 }},
        });
        const importantTaskData=Data.tasks;
        response.status(200).json({data:importantTaskData})

    } catch (error) {
        console.log(error);
        return response.status(400).json({message:"Internal Server Error"});
   
    }
})

//10.get complete tasks API
app.get("/getCompleteTasks",authenticateToken,async(request,response)=>{
    try {
        const {id}=request.headers;
        const Data=await User.findById(id).populate({
            path:"tasks",
            match:{complete:true},
            options:{ sort : { createdAt : -1 }},
        });
        const completeTaskData=Data.tasks;
        response.status(200).json({data:completeTaskData})

    } catch (error) {
        console.log(error);
        return response.status(400).json({message:"Internal Server Error"});
   
    }
})

//11.get Incomplete tasks API
app.get("/getIncompleteTasks",authenticateToken,async(request,response)=>{
    try {
        const {id}=request.headers;
        const Data=await User.findById(id).populate({
            path:"tasks",
            match:{complete:false},
            options:{ sort : { createdAt : -1 }},
        });
        const completeTaskData=Data.tasks;
        response.status(200).json({data:completeTaskData})

    } catch (error) {
        console.log(error);
        return response.status(400).json({message:"Internal Server Error"});
   
    }
})


module.exports=app;