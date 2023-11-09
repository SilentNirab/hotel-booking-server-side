const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

//middleware
app.use(cors({
  origin: [
    'http://localhost:5173'
  ],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// booking-room
// admin

// console.log(process.env.ACCESS_TOKEN)

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ezxu64p.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    
    const testimonialsCollection = client.db('roomBooking').collection('testimonials')
    const roomsCollection = client.db('roomBooking').collection('rooms')
    const bookingCollection = client.db('roomBooking').collection('booking')

    const verifyToken = (req, res, next) => {
      const token = req?.cookies?.token;

      if (!token) {
        return res.status(401).send({ message: 'unauthorized access' });
      }

      jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: 'unauthorized access' });
        }

        req.user = decoded;
        next();
      });
    };

    // Testimonials api

    app.get('/testimonials', async(req, res) =>{
        const cursor = testimonialsCollection.find();
        const result = await cursor.toArray();
        res.send(result)
    })


    // Rooms api

    app.get('/rooms', async(req, res) =>{

      let sortObj = {}

      const sortField = req.query.sortField
      const sortOrder = req.query.sortOrder

      if (sortField && sortOrder) {
        sortObj[sortField] = sortOrder
      }
      const cursor = roomsCollection.find().sort(sortObj);
      const result = await cursor.toArray()
      res.send(result)
    })

    app.get('/rooms/:id', async(req, res) =>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id) }
      const result = await roomsCollection.findOne(query);
      res.send(result)
    })



    // Booking api

    app.get('/booking', async(req, res) => {
      let query = {};
      if (req.query?.email) {
          query = { email: req.query.email }
      }
      const result = await bookingCollection.find(query).toArray();
      res.send(result)
    })

    app.get('/booking/:id',verifyToken, async(req, res) => {
      console.log("cookies", req.cookies);
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await bookingCollection.findOne(query);
      res.send(result)
    })

    app.post('/booking', async(req, res) =>{
      const booking = req.body;
      const result = await bookingCollection.insertOne(booking);
      res.send(result)
    })

    app.delete('/booking/:id', async(req, res) =>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await bookingCollection.deleteOne(query);
      res.send(result)
    })

    app.put('/booking/:id', async(req, res) =>{
      const id = req.params.id;
      const filter  = {_id: new ObjectId(id)};
      const options = {upsert: true};
      const updatedBook = req.body;
      const booking = {
          $set: {
            room_name: updatedBook.room_name,
            adults: updatedBook.adults,
            childrens: updatedBook.childrens,
            arival: updatedBook.arival,
            Departure: updatedBook.Departure,
            thumbnail_img: updatedBook.thumbnail_img,
          }
      }
      const result = await bookingCollection.updateOne(filter, booking, options);
      res.send(result);
    })

    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.listen(port,() =>{
    console.log(`room bookng server is running on port : ${port}`);
})