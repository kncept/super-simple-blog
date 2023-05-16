import * as http from 'http'
import Router from './router'
import FilesystemStorage from './storage/filesystem-storage'
import * as path from 'path'

const router: Router = new Router(new FilesystemStorage(path.join(__dirname, '..', '..', '.data')))

const server = http.createServer((req, res) => {

    const addCorsHeaders = () => {
        const originHeader = req.headers.origin || "*"
        // console.log("origin header", originHeader)
        res.setHeader("Access-Control-Allow-Origin", originHeader) // * for dev
        // res.setHeader("Access-Control-Allow-Methods", ["OPTIONS", "GET", "POST"])
        res.setHeader("Access-Control-Allow-Methods", ["*"])
        res.setHeader("Access-Control-Allow-Headers", ["*"])
    }

    let method = req.method || ""
    method = method.toUpperCase()
    // console.log(method, req.url)

    if (method === "OPTIONS") {
        addCorsHeaders()
        res.writeHead(204) // 204 NO CONTENT
        res.end()
    } else if (method === 'POST') {
        // have to stream out the post data ...
        let body = Buffer.from([])
        // let body: string = ''
        req.on('data', data => {
            body = Buffer.concat([body, data])
            // body = body + data.toString()
        })
        req.on('end', async() => {
            respond(method, req.url || '', flattenHeaders(req.headers), body, res, addCorsHeaders)
        })
    } else if (method === 'GET') {
        respond(method, req.url || '', flattenHeaders(req.headers), undefined, res, addCorsHeaders)
    }
})

function flattenHeaders(headers: NodeJS.Dict<string | string[]>): Record<string, string> {
    const flat: Record<string, string> = {}
    Object.keys(headers).forEach(key => {
        const value = headers[key]
        if (Array.isArray(value)) {
            flat[key] = value[0]
        } else {
            flat[key] = value || ''
        }
    })
    return flat
}

function respond(method: string, path: string, headers: Record<string, string>, requestBody: Buffer | undefined, res: http.ServerResponse<http.IncomingMessage>, addCorsHeaders: () => void) {
    router.route(method, path, headers, requestBody)
    .then((value: any) => {
        addCorsHeaders()
        if (value === undefined) {
            res.writeHead(404)
        } else {
            res.writeHead(200)
            if (value != null) {
                res.write(JSON.stringify(value))
            }
        }
        res.end()
    })
    .catch((err: Error) => {
        console.log(err)
        res.writeHead(500)
        if (err != null && err != undefined && err.message) {
            res.write(err.message)
        }
        res.end()
    })
}

server.listen(8080, "localhost", () => {
    console.log("dev backend is running")
})