const express = require('express')
const bp = require('body-parser')
const request = require('request')
const glob = require("glob")
const dns = require('dns')
const os = require('os')
const qr = require("qrcode")
const API_URLS = require("./enums/api_urls")
const SMDH_UTILS = require("./helpers/smdh_utils")
const fs = require('fs')
const fsExtra = require('fs-extra');
const http = require('https');

let last = ""

const qrOptions = {
    errorCorrectionLevel: 'H',
    type: 'terminal',
    scale: 10,
    margin: 1,
    color: {
        light: '#A020F0'
    }
}

const app = express()

app.set('view engine', 'ejs')
app.set('views', 'endpoints')
app.use(express.static("public"))
app.use(bp.urlencoded({ extended: true }));
app.use(bp.json())

const port = 1111

async function getIP() {
    return new Promise((resolve, reject) => {
        dns.lookup(os.hostname(), async (e, a, f) => {
            if(e) reject(e)
            resolve(a)
        })
    })
}

app.get('/', async (req, res) => {
    var promised = new Promise(async (resolve, reject) => {
        const f = glob.sync("themes/*.zip", { cwd: __dirname })
        const ip = await getIP()
        let things = []
        if(f.length !== 0) {
            f.forEach((file, ind) => {
                qr.toDataURL(`http://${ip[0]}:${port}/install?file=${file}`, qrOptions, (err, src) => {
                    if(err) reject(err)
                    things.push({
                        img: src,
                        name: file
                    })
                    if(ind == f.length - 1) resolve(things)
                })
            })
        } else {
            reject("No themes in the <code>themes</code> folder found! Put some .ZIP files in there or download some from ThemePlaza <a href=\"/tp\">here</a>!")
        }
    })

    promised.then((re) => {
        return res.render("home", { codes: re })
    }).catch((e) => {
        return res.render("error", { error: e })
    })
})

app.get('/tp', async (req, res) => {
    if(req.query.query) {
        const q = req.query.query
        const p = req.query.page || 1
        console.log("> Contacting TP API for query: '" + q + "'")
        request(API_URLS.SEARCH.replace("%s", q), (e, r, b) => {
            let thisA = []
            const js = JSON.parse(b)
            var promised = new Promise((resolve, reject) => {
                if(js.items !== undefined) {
                    js.items.forEach((id, i) => {
                        const file = fs.createWriteStream(`themep_temp/${id}`)
                        http.get(API_URLS.SMDH.replace("%s", id), (resp) => {
                            resp.pipe(file)
                        })
                        file.on('finish',() => {
                            file.close()
                            const smdh = SMDH_UTILS.readSMDH(`themep_temp/${id}`)
                            thisA.push({
                                id,
                                name: smdh[0],
                                short: smdh[1],
                                author: smdh[2],
                                downloaded: fs.existsSync(`themes/themeplaza_${id}.zip`) ? true : false
                            })
                            if(i === js.items.length -1) resolve()
                        })
                    })
                } else {
                    reject("No themes found!")
                }
            })
            promised.then(() => {
                setTimeout(() => { fsExtra.emptyDirSync("themep_temp") }, 2000)
                return res.render("themepizzad", { data: thisA })
            }).catch((e) => {
                return res.render("error", { error: e })
            })
        })
    } else {
        return res.render("themepizza")
    }
})

app.get('/tpd', (req, res) => {
    if(req.query.id) {
        const id = req.query.id
        http.get(API_URLS.DOWNLOAD.replace("%s", id), (resp) => {
            const file = fs.createWriteStream(`themep_temp/${id}.zip`)
            resp.pipe(file)
            file.on('finish',() => {
                file.close()
                fsExtra.move(`themep_temp/${id}.zip`, `themes/themeplaza_${id}.zip`, (err) => {
                    if(err) return res.render('error', { error: err })
                    return res.status(200).send("done!")
                })
            })
        })
    } else {
        return res.render("error", { error: "No ID was provided!" })
    }
})

app.get('/install', (req, res) => {
    if(req.query.file) {
        if(fs.existsSync(`${req.query.file}`)) {
            return res.sendFile(`${__dirname}/${req.query.file}`)
        } else {
            return res.status(404).render("error", { error: "File not found!" })
        }
    } else {
        return res.status(404).render("error", { error: "No file was provided!" })
    }
})

app.get('*', (req, res, next) => {
    return res.status(404).render("error", { error: "This page doesn't exist!" })
})

function doIntCheck() {
    dns.lookup(os.hostname(), async (e, a, f) => {
        if(a == last) return
        last = a
        var isConnected = !!await require('dns').promises.resolve('google.com').catch(() => { });
        if(isConnected) {
            console.log(`Go to http://localhost:${port} on your computer to get a QR code\nOR\nGo to http://localhost:${port}/tp download themes from ThemePlaza.`)
        }
    })
}

app.listen(port, () => {
    doIntCheck()
    setInterval(() => {
        doIntCheck()
    }, 5000)
}) 