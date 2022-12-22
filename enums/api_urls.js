const BASE = "https://themeplaza.art/"
const API_BASE = BASE + "api/anemone/v1/"
const DOWNLOAD = BASE + "download/%s"
const PREVIEW = DOWNLOAD + "preview/"

module.exports = {
    BASE,
    API_BASE,
    LIST: API_BASE + "list?page=%s/",
    SEARCH: API_BASE + "list?query=%s/",
    DOWNLOAD,
    PREVIEW,
    ICON: PREVIEW + "icon/",
    BGM: DOWNLOAD + "/bgm",
    SMDH: DOWNLOAD + "/smdh",
}