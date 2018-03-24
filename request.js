const { parse, URL }  = require('url');
const http = require('http');

class Handler{
    constructor(){
        this.requestOptions = {};
    }

    getQuery(req){
        let thisUrl = parse(req.url, true);
        req.url = thisUrl.pathname;
        req['query'] = thisUrl.query;
    }

    handle(req, res){
        if(req.method == 'GET' && req.url){
            this.getQuery(req);
            if(this.requestOptions['GET'+req.url]){
                (this.requestOptions['GET'+req.url])(req, res);
                return;
            }
        }
        res.writeHead(404, {'Content-type': 'application/json'});
        res.end(JSON.stringify({
            'error': 'Page not found'
        }));
    }

    send(base, input, message, callback){
        try{
            const url = new URL(input, base);
            for(let i in message){
                url.searchParams.append(i, message[i]);
            }
            http.get(url, callback).on('error', (e) => {
                callback(false, e);
            });
        }
        catch(error){
            callback(false, error);
        }
    }

    get(url, callback){
        this.requestOptions['GET'+url] = callback;
    }

    json(res, json_object, status_no){
        res.writeHead((status_no)?status_no:200, {'Content-type': 'application/json'});
        res.end(JSON.stringify(json_object).toString());
    }
}

module.exports = Handler;
