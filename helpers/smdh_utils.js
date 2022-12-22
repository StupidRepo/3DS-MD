function readSMDH(path) {
    const fs = require('fs')
    const nameO = 0x04
    const nameS = 0x80
    const descO = 0x80
    const descS = 0x100
    const authO = 0x180
    const authS = 0x80
    const data = fs.readFileSync(path)
    const name = data.toString('utf8', nameO, nameO + nameS).replace(/\x00/g, "")
    const desc = data.toString('utf8', descO, descO + descS).replace(/\x00/g, "")
    const auth = data.toString('utf8', authO, authO + authS).replace(/\x00/g, "")
    return [name, desc, auth]
}

module.exports = {
    readSMDH
}