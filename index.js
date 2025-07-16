const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 4000
const admin = require("firebase-admin");

var serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

app.use(express.json())
app.use(cors())



const uri = `mongodb+srv://${process.env.USER}:${process.env.PASS}@cluster0.ws0fker.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});


const verifyJwt = async (req, res, next) => {

    const ck = req.headers?.authorization
    if (!ck) {
        return res.status(401).send({ message: 'unauthorize user' })
    }
    const token = req.headers?.authorization.split(' ')[1]
    if (!token) return res.status(401).send({ message: 'unauthorize user' })

    if (token) {
        const decoded = await admin.auth().verifyIdToken(token)
        req.decodedEmail = decoded.email
        next()
    }
}

async function run() {
    try {

        // try {
        //     await client.connect();
        //     console.log("Connected to MongoDB!");
        // } catch (err) {
        //     console.error("Connection Error:", err);
        // }


        const ProductsCollectationS = client.db('productscollections').collection('product')
        const CartProductsCollections = client.db('productscollections').collection('cartItem')

        app.get('/details/:id/:email', verifyJwt, async (req, res) => {

            const email = req?.params?.email
            if (req?.decodedEmail !== email) {
                return res.status(401).send({ msg: "unauthorized user" })
            }
            const id = req.params.id
            const query = { _id: new ObjectId(id) }

            try {
                const result = await ProductsCollectationS.findOne(query)
                res.send(result)


            }
            catch {

                res.send({})
            }
        })
        app.get('/filterProduct', verifyJwt, async (req, res) => {
            const cetagory = req.query.cetagory
            const email = req.query.email
            const page = parseInt(req?.query.currentPage)
            const lmt = parseInt(req?.query.lmt)

            if (!email) {
                return res.send({ msg: 'unauthorized' })
            }
            let query = {}
            if (email) {
                if (req.decodedEmail !== email) {
                    return res.status(401).send({ message: 'unauthorize user' })
                }
            }
            if (cetagory) {
                query.cetagory = cetagory
            }


            try {
                const skp = (page - 1) * lmt

                const result = await ProductsCollectationS.find(query).skip(skp).limit(lmt).toArray()
                res.send(result)
            }
            catch {
                res.send({ error: "products get error" })
            }
        })

        app.get('/allProducts', async (req, res) => {
            const count = await ProductsCollectationS.count()
            res.send({ count })
        })

        app.get('/myproduct', verifyJwt, async (req, res) => {
            const email = req?.query.email
            if (req?.decodedEmail !== email) {
                return res.send({ msg: "unauthorized user" })
            }
            const query = { email }
            try {
                const result = await ProductsCollectationS.find(query).toArray()
                res.send(result)
            }
            catch {
                res.send({ error: "products get error" })
            }
        })


        app.post('/addproduct', verifyJwt, async (req, res) => {

            const email = req?.query?.email
            if (!email) {

                return res.status(401).send({ message: 'unauthorize user' })
            }
            if (req?.decodedEmail !== email) {
                return res.status(401).send({ message: 'unauthorize user' })
            }
            const productInfo = req.body
            try {
                const result = await ProductsCollectationS.insertOne(productInfo)
                res.send(result)
            }
            catch {
                res.send({ error: "products doesn't post" })
            }
        })

        app.post('/buyproduct/:email', verifyJwt, async (req, res) => {
            const email = req?.params?.email
            if (req?.decodedEmail !== email) {
                return res.status(401), send({ msg: 'unauthorized user' })
            }
            const info = req.body
            try {
                const result = await CartProductsCollections.insertOne(info)
                res.send(result)
            }
            catch {
                res.send({ msg: "cart item not be post" })
            }
        })
        app.get('/mycart/:email', verifyJwt, async (req, res) => {

            const email = req.params.email
            if (req.decodedEmail !== email) {
                return res.status(401).send({ message: 'unauthorize user' })
            }
            const query = { email: email }
            try {
                const result = await CartProductsCollections.find(query).toArray()
                res.send(result)
            }
            catch {
                res.send({ msg: "data not found" })

            }

        })
        app.delete('/cartitem/:id/:email', verifyJwt, async (req, res) => {
            const email = req.params.email

            const id = req.params.id
            if (req?.decodedEmail !== email) {
                return res.status(401).send({ msg: "unauthoraized" })
            }

            const query = { _id: new ObjectId(id) }
            try {
                const result = await CartProductsCollections.deleteOne(query)
                res.send(result)
            }
            catch {
                res.send({ msg: "cart item doesn't delete!" })
            }
        })

        app.patch('/item/:id/:email', verifyJwt, async (req, res) => {
            const id = req.params.id
            const email = req?.params.email
            if (req?.decodedEmail !== email) {
                return res.status(401).send({ msg: "unauthoraized user" })
            }
            const query = { _id: new ObjectId(id) }
            const info = req.body

            const update = {
                $inc: {
                    mquantity: -info?.Qnt
                }
            }

            try {
                const result = await ProductsCollectationS.updateOne(query, update)
                res.send(result)

            }
            catch {
                res.send({ msg: 'product decreamnet hoi nai' })
            }

        })


        app.put('/products/:id/:email', verifyJwt, async (req, res) => {

            const email = req?.params?.email

            if (req?.decodedEmail !== email) {
                return res.status(403).send({ msg: 'unauthoraized user' })
            }
            const id = req.params.id
            const info = req.body
            const query = { _id: new ObjectId(id) }
            try {
                const result = await ProductsCollectationS.updateOne(query, {
                    $set: info,
                })
                res.send(result)
            }
            catch {
                res.send({ msg: "product doesn't update! " })
            }
        })

        app.delete('/productDel', verifyJwt, async (req, res) => {
            let { id, email } = req?.body
            if (!email) {
                return res.status(403).send({ msg: 'unauthoraized user' })
            }
            if (req?.decodedEmail !== email) {
                return res.status(403).send({ msg: 'unauthoraized user' })
            }
            const query = { _id: new ObjectId(id) }
            try {
                const result = await ProductsCollectationS.deleteOne(query)
                res.send(result)
            }
            catch {
                res.send({ msg: "delete hoi nai" })
            }
        })



        // await client.db("admin").command({ ping: 1 });
        // console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);




app.get('/', (req, res) => {
    console.log('server side is running')
    res.send(`server side is running port ${port}`)
})
app.listen(port, () => {

    console.log(`server side is running port ${port}`)

})