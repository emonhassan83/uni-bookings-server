const express = require("express");
const app = express();
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const port = process.env.PORT || 5000;

// middleware
const corsOptions = {
  origin: "*",
  credentials: true,
  optionSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.use(express.json());

//connect to mondoDB
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mt8kgrw.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const collegesCollection = client
      .db("uniBookingsDB")
      .collection("colleges");
    const usersCollection = client.db("uniBookingsDB").collection("users");
    const admissionsCollection = client
      .db("uniBookingsDB")
      .collection("admissions");
    const feedbackCollection = client
      .db("uniBookingsDB")
      .collection("feedback");

    //get all colleges
    app.get("/colleges", async (req, res) => {
      const colleges = await collegesCollection.find().toArray();
      res.send(colleges);
    });

    //get single colleges
    app.get("/college/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const college = await collegesCollection.findOne(query);
      res.send(college);
    });

    //save user by email in DB
    app.put("/users/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const query = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await usersCollection.updateOne(query, updateDoc, options);
      res.send(result);
    });

    //get all users by email
    app.get("/user/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await usersCollection.findOne(query);
      res.send(result);
    });

    //post admission in Database
    app.post("/admission", async (req, res) => {
      const admissionData = req.body;
      const result = await admissionsCollection.insertOne(admissionData);
      res.send(result);
    });

    //get all admission by email
    app.get("/myAdmission", async (req, res) => {
      const email = req.query.email;
      if (!email) {
        res.send([]);
      }
      const query = { email: email };
      const allData = await admissionsCollection.find(query).toArray();
      const collegeNames = allData.map((result) => result.college);

      // Perform the filtering using MongoDB aggregation
      const filteredColleges = await collegesCollection
        .aggregate([
          {
            $match: {
              college: { $in: collegeNames },
            },
          },
        ])
        .toArray();
      res.send(filteredColleges);
    });

    // Add feedback in Db
    app.post("/feedback", async (req, res) => {
      const feedbackData = req.body;
      const result = await feedbackCollection.insertOne(feedbackData);
      res.send(result);
    });


    //get user feedback
    app.get('/feedbacks', async (req, res)=> {
      const colleges = await feedbackCollection.find().toArray();
      res.send(colleges);
    })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    //await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Uni bookings Server is running....!");
});

app.listen(port, () => {
  console.log(`Uni bookings is listening on port ${port}`);
});