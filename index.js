const express = require('express')
const socketserver = require('ws')
const mysql = require('mysql2')
const bodyParser = require('body-parser')
const app = express()

/**  setup  */

//* 解析
app.use(bodyParser.json())

//* open server
const PORT = 8080
const server = app.listen(PORT, () => console.log(`Server open on ${PORT}`))

//* WebSocket
let i = 0
let host = "";
const json_temp = {}
const json_temp_host = {}
const json_temp_state = {}
const json_temp_start = {}
const map = new Map()
const wss = new socketserver.Server({ server })
wss.on('connection', ws => {
    //! working to connected
    console.log("working to connected")
    map.set(ws, "")
    json_temp.signal = "connecting"
    ws.send(JSON.stringify(json_temp))

    //! message
    ws.on('message', (message) => {
        const message_temp = JSON.parse(message)
        console.log("Message from client:", message_temp)
        //! create party
        if (Object.keys(message_temp)[0] == '0') {
            console.log("keywords send successfully")
            //? team group create
            map.set(ws, message_temp[Object.keys(message_temp)[0]])
            console.log("keys:", map.get(ws))
            //? send data (host)
            json_temp.signal = message_temp[Object.keys(message_temp)[0]]
            host = message_temp["name"]
            console.log("host:", host)
            ws.send(JSON.stringify(json_temp))
        }
        //! join party
        else if (Object.keys(message_temp)[0] == '1') {
            console.log("working to join party")
            json_temp.signal = "working to join party"
            json_temp_host.signal = "name from client"
            //! send name to host
            wss.clients.forEach((client) => {
                if (client !== ws && client.readyState === socketserver.OPEN) {
                    if (message_temp[Object.keys(message_temp)[0]] == map.get(client)) {
                        //? client data
                        json_temp.user = message_temp['name']
                        json_temp.state = message_temp['state']
                        json_temp.host = host

                        //? team group
                        map.set(ws, client)

                        //? send data (client)
                        ws.send(JSON.stringify(json_temp))

                        //? client data
                        console.log("(client)joining:", json_temp_host)

                        //? host data
                        json_temp_host.user = message_temp['name']
                        json_temp_host.state = message_temp['state']

                        //? send data (host)
                        client.send(JSON.stringify(json_temp_host))

                        //? host data
                        console.log("(client)joining:", json_temp_host)

                        i += 1
                    }
                }
            });
            //! identity 
            if (i == 1) {
                i = 0
            }
            else {
                console.log("error")
                json_temp.signal = "error"
                ws.send(JSON.stringify(json_temp))
            }
        }
        //! client ready
        else if (Object.keys(message_temp)[0] == '2') {
            try{
                json_temp_state.signal = "ready"
                json_temp_state.state = message_temp['2']
                json_temp_state.user = message_temp['name']
                map.get(ws).send(JSON.stringify(json_temp_state))
            }catch(err){
                console.log("client ready:", err)
            }
            
        }
        //! host start the game
        else if (Object.keys(message_temp)[0] == '3') {
            json_temp_start.signal="start"
            map.forEach((value, key)=>{
                if(key !== ws && key.readyState === socketserver.OPEN){
                    if(value === ws){
                        key.send(JSON.stringify(json_temp_start))
                    }
                }
            })
        }
        //! exception
        else {
            console.log("error send message")
            json_temp.signal = "error send message"
            ws.send(JSON.stringify(json_temp))
        }
    })
    //! disconnected
    ws.on('close', () => {
        try {
            if (map.get(ws) !== "" && map.get(ws) !== undefined) {
                if (map.get(ws).readyState === socketserver.OPEN) {
                    console.log("")
                }
                else {
                    console.log("error control", map.get(ws), "test")
                }
            }
            else {
                console.log("no pair group")
            }
        } catch (err) {
            console.log(err)
        }
        map.delete(ws)
        console.log("client disconnected")
    })
})

/** database */

//* mysql setup
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'Amks94884674?',
    database: 'test'
});

//* login
app.post('/login', (req, res) => {
    console.log("client login:", req.body)
    const name = Object.keys(req.body)[0]
    const password = req.body[name]
    pool.query('SELECT * FROM account_game WHERE username = ? AND password = ?', [name, password], (err, result) => {
        if (err) {
            console, log("error:", err)
            res.send("error login")
        }
        else if (result.length > 0) {
            // console.log("account:", result)
            res.send("login successfully")
        }
        else {
            // console.log("User not exists or error password")
            res.send("User not exists or error password")
        }
        return
    })
    // res.send("work")
})

//* registe
app.post('/registe', (req, res) => {
    console.log("user registe:", req.body)
    const name = Object.keys(req.body)[0]
    const password = req.body[name]
    pool.query('SELECT * FROM account_game WHERE username = ?', [name], (err, result) => {
        if (err) {
            console.log(err)
            res.send("error registe")
        }
        else if (result.length > 0) {
            // console.log("user existed")
            res.send("user existed")
        }
        else {
            pool.query('INSERT INTO account_game (username, password) VALUES (?, ?)', [name, password], (err) => {
                if (err) {
                    console.log(err)
                    res.send("error create user")
                }
                else {
                    // console.log("successful")
                    res.send("successful create")
                }
            })
        }
    })
})

/**  */

//* test_5