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
    scale: 16,
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
    const ip = await getIP()
    const themes = glob.sync("3ds/*.zip")
    const threedsx = glob.sync("3ds/*.3dsx")
    const cias = glob.sync("3ds/*.cia")
    const qrCodes = {
        theme: [],
        tdsx: [],
        cia: []
    }
    for await (const thing of themes) {
        qrCodes.theme.push({ name: thing, img: await qr.toDataURL(`http://${ip}:${port}/install?file=${thing}`, qrOptions) })
        break
    }
    for await (const thing of threedsx) {
        qrCodes.tdsx.push({ name: thing, img: await qr.toDataURL(`http://${ip}:${port}/install?file=${thing}`, qrOptions) })
        break
    }
    for await (const thing of cias) {
        qrCodes.cia.push({ name: thing, img: await qr.toDataURL(`http://${ip}:${port}/install?file=${thing}`, qrOptions) })
        break
    }
    return res.render("home", { qrCodes })
})

app.get('/install', (req, res) => {
    if(req.query.file) {
        const split = (req.query.file).split("/")
        const name = split[split.length - 1]
        if(fs.existsSync(`3ds/${name}`)) {
            return res.sendFile(`${__dirname}/3ds/${name}`)
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

app.listen(port, () => {
    console.log(`> Navigate to http://localhost:${port}`)
}) 