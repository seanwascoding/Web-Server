const express = require('express')
const socketserver = require('ws')
const mysql = require('mysql2')
const bodyParser = require('body-parser')
const app = express()

/** 解析 */
app.use(bodyParser.json())

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

/**  setup  */

//* open server
const PORT = 8080
const server = app.listen(PORT, () => console.log(`Server open on ${PORT}`))

//* WebSocket
let i = 0  //? corrected to true & false
let monster = 1000
let host = "";
const json_temp = {}
const json_temp_host = {}
const json_temp_state = {}
const json_temp_start = {}
const json_temp_monster = {}
const json_temp_loading = {}
const map = new Map() //? team group (1st)
const map_2 = new Map() //? team group (2st)
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
            console.log("keys:", message_temp['0'])

            //? 
            const name = message_temp['name']
            host = message_temp['name']
            pool.query('SELECT * FROM Team WHERE username = ?', [name], (err, result) => {
                if (err) {
                    console.log(err)
                    ws.send(err)
                }
                else if (result.length > 0) {
                    //?
                    console.log("exist")

                    //? update
                    pool.query('UPDATE Team SET room_key = ? WHERE username = ?', [message_temp['0'], name], (err, result) => {
                        if (err) {
                            console.log(err)
                        }
                        else {
                            console.log("work to update")
                            message_temp.signal = "successful create"
                            ws.send(JSON.stringify(message_temp))
                        }
                    })
                }
                else {
                    //?
                    pool.query('INSERT INTO Team (username, room_key) VALUES (?, ?)', [name, message_temp['0']], (err) => {
                        if (err) {
                            console.log(err)
                            message_temp.signal = "error"
                            ws.send(JSON.stringify(message_temp))
                        }
                        else if (result.length > 0) {
                            console.log("successful")
                            message_temp.signal = "successful create"
                            ws.send(JSON.stringify(message_temp))
                        }
                    })
                }
                return
            })
        }
        //! join party
        else if (Object.keys(message_temp)[0] == '1') {
            console.log("working to join party")
            json_temp.signal = "working to join party"
            json_temp_host.signal = "name from client"
            var state = true
            //! send name to host
            wss.clients.forEach((client) => {
                if (client !== ws && client.readyState === socketserver.OPEN) {
                    //? host
                    if (message_temp[Object.keys(message_temp)[0]] == map.get(client)) {
                        //? client data
                        json_temp.user = message_temp['name']
                        json_temp.state = message_temp['state']
                        json_temp.host = host

                        //? team group
                        map.set(ws, client)

                        console.log("successful")
                        //? send data (client)
                        ws.send(JSON.stringify(json_temp))
                        //? client data
                        console.log("(client)joining:", json_temp)

                        //? host data
                        json_temp_host.user = message_temp['name']
                        json_temp_host.state = message_temp['state']

                        //? send data (host)
                        client.send(JSON.stringify(json_temp_host))

                        //? host data
                        console.log("(client)joining:", json_temp_host)

                        i += 1

                        //? other client
                        // wss.clients.forEach((other_clients) => {
                        //     if (other_clients !== ws && other_clients !== client && client.readyState === socketserver.OPEN) {
                        //         if (map.get(other_clients) === client) {
                        //             pool.query('SELECT * FROM Team WHERE room_key = ?', [message_temp['1']], (err, result) => {
                        //                 if (err) {
                        //                     console.log(err)
                        //                 }
                        //                 else if (result.length > 0) {
                        //                     console.log('other client')
                        //                     result.forEach((data) => {
                        //                         json_temp.user = data.username
                        //                         json_temp.state = 'ready'
                        //                         other_clients.send(JSON.stringify(json_temp))
                        //                     })
                        //                 }
                        //             })
                        //         }
                        //     }
                        // })
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
            try {
                json_temp_state.signal = "ready"
                json_temp_state.state = message_temp['2']
                json_temp_state.user = message_temp['name']
                map.get(ws).send(JSON.stringify(json_temp_state))
            } catch (err) {
                console.log("client ready:", err)
            }

        }
        //! host start the game
        else if (Object.keys(message_temp)[0] == '3') {
            json_temp_start.signal = "start"
            map.forEach((value, key) => {
                if (key !== ws && key.readyState === socketserver.OPEN) {
                    if (value === ws) {
                        monster = 100
                        key.send(JSON.stringify(json_temp_start))
                    }
                }
            })
        }
        //! moster blood
        else if (Object.keys(message_temp)[0] == '4') {
            if (message_temp['4'] == "attack") {
                monster -= parseFloat(message_temp['value'])
                console.log("monster blood:", monster)
                json_temp_monster.signal = "damage"
                json_temp_monster.value = monster
                ws.send(JSON.stringify(json_temp_monster))
                wss.clients.forEach((client) => {
                    if (client !== ws && client.readyState === socketserver.OPEN && map_2[client] == message_temp['key']) {
                        client.send(JSON.stringify(json_temp_monster))
                    }
                })
            }
            else if (message_temp['4'] == "defend") {
                if(parseFloat(message_temp['value']) > 50){
                    console.log("working to defend:")
                    json_temp_monster.signal = "defend"
                    json_temp_monster.value = "防禦成功"
                    ws.send(JSON.stringify(json_temp_monster))
                }
                else{
                    console.log("fail to defend:")
                    json_temp_monster.signal = "defend"
                    json_temp_monster.value = "防禦失敗"
                    ws.send(JSON.stringify(json_temp_monster))
                }
            }
            else if(message_temp['4'] == "loss"){
                const json_temp_loss = {}
                json_temp_loss.signal="loss"
                console.log("work")
                ws.send(JSON.stringify(json_temp_loss))
                wss.clients.forEach((client) => {
                    if (client !== ws && client.readyState === socketserver.OPEN && map_2[client] == message_temp['key']) {
                        client.send(JSON.stringify(json_temp_loss))
                    }
                })
            }
            else {
                console.log("4:error")
                console.log(message_temp['4'])
            }
        }
        //! replace
        else if (Object.keys(message_temp)[0] == '5') {
            //?
            const name = message_temp['name']
            // ws.send(JSON.stringify(message_temp))
            pool.query('SELECT * FROM Team WHERE username = ? AND room_key = ?', [name, message_temp['key']], (err, result) => {
                if (err) {
                    console.log(err)
                }
                else if (result.length > 0) {
                    map_2.set(ws, message_temp['key'])
                    json_temp_loading.signal = "loading"
                    ws.send(JSON.stringify(json_temp_loading))
                }
                else {
                    console.log("error")
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
        //! 需要再調整
        // try {
        //     if (map.get(ws) !== "" && map.get(ws) !== undefined) {
        //         if (map.get(ws).readyState === socketserver.OPEN) {
        //             console.log("")
        //         }
        //         else {
        //             console.log("error control")
        //         }
        //     }
        //     else {
        //         console.log("no pair group")
        //     }
        // } catch (err) {
        //     console.log(err)
        // }

        // map.delete(ws)
        console.log("client disconnected")

        //? TO DO

    })
})