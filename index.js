import express from 'express'
import path from 'path'
import {MongoClient, ObjectId} from 'mongodb'
import { equal } from 'assert';

const app=express();
const publicPath=path.resolve('public');
app.use(express.static(publicPath));
app.set("view engine","ejs")

const dbName='node-project';
// const collectionName='todo';
const collectionName='todo';
// const url='mongodb://localhost:27017';
const url = process.env.MONGO_URL;
const client=new MongoClient(url);
const connection=async()=>{
    const connect=await client.connect();
    return await connect.db(dbName)
}

app.use(express.json()); 
app.use(express.urlencoded({extended:false}));

app.get("/",async(req,resp)=>{
    const db = await connection();
    const collection = db.collection(collectionName);
    const result = await collection.find().toArray();
    console.log(result.length);
    // console.log(result);
     if (req.headers.accept && req.headers.accept.includes("application/json")) {
    // dont-decomeent this if you do this you only get todos: 
    // if (req.accepts('json')) { 
        return resp.json({
            success: true,
            count: result.length,
            data: result
        });
    }
    // console.log("Accept header:", req.headers.accept);
    resp.render("list",{result});
})
app.get("/add",(req,resp)=>{
    resp.render("add");
})
app.get("/update",(req,resp)=>{
   resp.render("update");
})
app.post("/add",async(req,resp)=>{
    const db=await connection();
    const collection=db.collection(collectionName);
    const result=await collection.insertOne(req.body);//await

    console.log("BODY:", req.body);

    if (req.headers['content-type'] === 'application/json') {
        return resp.json({
            success: true,
            insertedId: result.insertedId
        });
    }
    else if(result){
        resp.redirect("/");
    }
    else{ resp.redirect("/add");}

    // resp.json(result);
    // const data = await collection.find().toArray();
    // resp.json(data);
})
app.post("/update",(req,resp)=>{
    resp.redirect("/");
})
app.get("/delete/:id",async(req,resp)=>{
    const db=await connection();
    const collection=db.collection(collectionName);
    const result=await collection.deleteOne({_id:new ObjectId(req.params.id)});//await

    console.log("deletedCount:", result.deletedCount);
    console.log("Deleted:", req.params.id);
    

     if (req.is('application/json')) {
        return resp.json({
            success: result.deletedCount > 0,
            deletedId: req.params.id,
            deletedCount: result.deletedCount
        });
    }
    else 
    //  if(result){
    if(result.deletedCount > 0){
        resp.redirect("/");
    }
    else{ 
        // resp.redirect("/add");
        resp.send("/some error")
    }
})
app.get("/update/:id",async(req,resp)=>{
    const db=await connection();
    const collection=db.collection(collectionName);
    const result=await collection.findOne({_id:new ObjectId(req.params.id)});//await

    // console.log("updatedCount:", result.modifiedCount);
    console.log("Update for:", req.params.id);
    

    //  if (req.is('application/json')) {
    //     return resp.json({
    //         success: result.deletedCount > 0,
    //         deletedId: req.params.id,
    //         deletedCount: result.deletedCount
    //     });
    // }
    // else 
     if(result){
        resp.render("update",{result});
    }
    else{ 
        // resp.redirect("/add");
        resp.send("/some error")
    }
})
app.post("/update/:id",async(req,resp)=>{
    const db=await connection();
    const collection=db.collection(collectionName);
    const filter={_id:new ObjectId(req.params.id)}
    // const updateData={$set:{title:req.body.title,description:req.body.description}}

    // const updateData = {
    //     $set: {
    //         title: req.body?.title || "",
    //         description: req.body?.description || ""
    //     }
    // };

    const updateData = {
    $set: {}
    };

    if (req.body.title) {
    updateData.$set.title = req.body.title;
    }

    if (req.body.description) {
    updateData.$set.description = req.body.description;
    }

    const result=await collection.updateOne(filter,updateData);//await
    console.log("Headers:", req.headers);
    console.log("BODY:", req.body);
    console.log("updatedCount/modifiedCount:", result.modifiedCount);
    console.log("Updated:", req.params.id);
    
     if (req.is('application/json')) {
        return resp.json({
            success: result.modifiedCount > 0,
            updatedId: req.params.id,
            modifiedCount: result.modifiedCount
        });
    }
    else 
    //  if(result){
    if(result.modifiedCount > 0){
        resp.redirect("/");
    }
    else{ 
        // resp.redirect("/add");
        resp.send("/some error")
    }
})
app.post("/multi-delete",async(req,resp)=>{
    const db=await connection();
    const collection=db.collection(collectionName);
    console.log("Delete for:", req.body.selectedTask);
    // const selectedTask=req.body.selectedTask.map((id)=>new ObjectId(id))
    let selectedTask=undefined;
    if(Array.isArray(req.body.selectedTask)){
    // const
     selectedTask=req.body.selectedTask.map((id)=>new ObjectId(id))
    }else{
    // const 
    selectedTask=[new ObjectId(req.body.selectedTask)]
    }
    
    console.log("delete for:",selectedTask);
    const result=await collection.deleteMany({_id:{$in:selectedTask}})
    console.log("deletedCount:", result.deletedCount);

     if (req.is('application/json')) {
        return resp.json({
            success: result.deletedCount > 0,
            deletedIds: req.body.selectedTask,
            deletedCount: result.deletedCount
        });
    }
    else 
     if(result){
        resp.redirect("/");
    }
    else{ 
        // resp.redirect("/add");
        resp.send("/some error")
    }
})

app.get("/list", async (req, resp) => {
    const db = await connection();
    const collection = db.collection(collectionName);
    const data = await collection.find().toArray();
    resp.json(data); 
});

// app.listen(3300);
const PORT = process.env.PORT || 3200;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});


